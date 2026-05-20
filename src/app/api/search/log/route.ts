import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { performSearch } from "@/lib/search/perform-search";
import { recordSearchLog } from "@/lib/search/record-search-log";
import {
  SEARCH_LOG_EXPLICIT_HEADER,
  SEARCH_LOG_EXPLICIT_HEADER_VALUE,
} from "@/lib/search/search-log-constants";
import {
  createVisitorSessionId,
  VISITOR_SESSION_COOKIE,
} from "@/lib/session/visitor-session";

type SearchLogBody = {
  keyword?: string;
  requestFingerprint?: string;
};

const VISITOR_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function logSearchEvent(message: string) {
  if (process.env.NODE_ENV === "development") {
    console.info(message);
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get(SEARCH_LOG_EXPLICIT_HEADER) !== SEARCH_LOG_EXPLICIT_HEADER_VALUE) {
    return NextResponse.json({ error: "Explicit search header required." }, { status: 403 });
  }

  let body: SearchLogBody;
  try {
    body = (await request.json()) as SearchLogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const keyword = String(body.keyword ?? "").trim();
  if (!keyword) {
    return NextResponse.json({ error: "keyword is required." }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sessionId = request.cookies.get(VISITOR_SESSION_COOKIE)?.value ?? null;
  const shouldIssueSessionCookie = !user && !sessionId;
  if (shouldIssueSessionCookie) {
    sessionId = createVisitorSessionId();
  }

  const payload = await performSearch(supabase, keyword, { sessionId });

  const admin = createSupabaseAdminClient();
  const logResult = await recordSearchLog(admin, {
    keyword: payload.keyword,
    normalizedKeyword: payload.normalizedKeyword,
    matchedBrandId: payload.matchedBrand?.id ?? null,
    resultStatus: payload.matchedBrand ? "matched" : "unmatched",
    resultCount: payload.discounts.length,
    userId: user?.id ?? null,
    sessionId,
    requestFingerprint: body.requestFingerprint ?? null,
  });

  const actorLabel = logResult.actorKey ?? "unknown";

  if (logResult.recorded) {
    logSearchEvent(`[search-log] inserted keyword=${payload.normalizedKeyword} actor=${actorLabel}`);
  } else if (logResult.skipped && logResult.reason === "dedup") {
    logSearchEvent(`[search-log] skipped duplicate keyword=${payload.normalizedKeyword} actor=${actorLabel}`);
  } else if (process.env.NODE_ENV === "development") {
    logSearchEvent(
      `[search-log] skipped ${logResult.reason} keyword=${payload.normalizedKeyword} actor=${actorLabel}`,
    );
  }

  const response = NextResponse.json({
    recorded: logResult.recorded,
    skipped: logResult.skipped,
    reason: logResult.skipped ? logResult.reason : null,
  });

  if (shouldIssueSessionCookie && sessionId) {
    response.cookies.set(VISITOR_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: VISITOR_SESSION_MAX_AGE,
      path: "/",
    });
  }

  return response;
}
