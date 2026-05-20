import type { SupabaseClient } from "@supabase/supabase-js";

import { SEARCH_LOG_DEDUP_MS } from "./search-log-constants";

export { SEARCH_LOG_DEDUP_MS };

export type RecordSearchLogInput = {
  keyword: string;
  normalizedKeyword: string;
  matchedBrandId: number | null;
  resultStatus: "matched" | "unmatched";
  resultCount: number;
  userId: string | null;
  sessionId: string | null;
  requestFingerprint?: string | null;
};

export type RecordSearchLogResult =
  | { recorded: true; skipped: false; actorKey: string }
  | {
      recorded: false;
      skipped: true;
      reason: "dedup" | "invalid" | "dedup_check_failed";
      actorKey: string | null;
    };

export function isWithinSearchLogDedupWindow(
  lastCreatedAt: string | null | undefined,
  now: Date,
  windowMs: number = SEARCH_LOG_DEDUP_MS,
): boolean {
  if (!lastCreatedAt) {
    return false;
  }

  const lastMs = Date.parse(lastCreatedAt);
  if (Number.isNaN(lastMs)) {
    return false;
  }

  return now.getTime() - lastMs < windowMs;
}

export function resolveSearchLogActorKey(input: {
  userId: string | null;
  sessionId: string | null;
}): { kind: "user"; userId: string } | { kind: "session"; sessionId: string } | null {
  if (input.userId) {
    return { kind: "user", userId: input.userId };
  }

  if (input.sessionId) {
    return { kind: "session", sessionId: input.sessionId };
  }

  return null;
}

export function formatSearchLogActorKey(input: {
  userId: string | null;
  sessionId: string | null;
}): string | null {
  const actor = resolveSearchLogActorKey(input);
  if (!actor) {
    return null;
  }

  return actor.kind === "user" ? `user:${actor.userId}` : `session:${actor.sessionId}`;
}

export async function findRecentDuplicateSearchLog(
  supabase: SupabaseClient,
  input: {
    normalizedKeyword: string;
    userId: string | null;
    sessionId: string | null;
    sinceIso: string;
  },
): Promise<
  | { status: "found"; row: { id: number; created_at: string } }
  | { status: "missing" }
  | { status: "error"; message: string }
> {
  const actor = resolveSearchLogActorKey(input);
  if (!actor) {
    return { status: "missing" };
  }

  let query = supabase
    .from("search_logs")
    .select("id,created_at")
    .eq("normalized_keyword", input.normalizedKeyword)
    .gte("created_at", input.sinceIso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (actor.kind === "user") {
    query = query.eq("user_id", actor.userId);
  } else {
    query = query.is("user_id", null).eq("session_id", actor.sessionId);
  }

  const { data, error } = await query;
  if (error) {
    return { status: "error", message: error.message };
  }

  const row = (data?.[0] as { id: number; created_at: string } | undefined) ?? null;
  if (!row) {
    return { status: "missing" };
  }

  return { status: "found", row };
}

export async function recordSearchLog(
  supabase: SupabaseClient,
  input: RecordSearchLogInput,
): Promise<RecordSearchLogResult> {
  const keyword = input.keyword.trim();
  const normalizedKeyword = input.normalizedKeyword.trim();
  const actorKey = formatSearchLogActorKey({
    userId: input.userId,
    sessionId: input.sessionId,
  });

  if (!keyword || !normalizedKeyword) {
    return { recorded: false, skipped: true, reason: "invalid", actorKey };
  }

  if (!actorKey) {
    return { recorded: false, skipped: true, reason: "invalid", actorKey: null };
  }

  const now = new Date();
  const sinceIso = new Date(now.getTime() - SEARCH_LOG_DEDUP_MS).toISOString();

  const recent = await findRecentDuplicateSearchLog(supabase, {
    normalizedKeyword,
    userId: input.userId,
    sessionId: input.sessionId,
    sinceIso,
  });

  if (recent.status === "error") {
    return { recorded: false, skipped: true, reason: "dedup_check_failed", actorKey };
  }

  if (recent.status === "found" && isWithinSearchLogDedupWindow(recent.row.created_at, now)) {
    return { recorded: false, skipped: true, reason: "dedup", actorKey };
  }

  const storedSessionId = input.userId ? null : input.sessionId;

  try {
    await supabase.from("search_logs").insert({
      keyword,
      normalized_keyword: normalizedKeyword,
      matched_brand_id: input.matchedBrandId,
      gender_group: null,
      age_group: null,
      result_status: input.resultStatus,
      result_count: input.resultCount,
      user_id: input.userId,
      session_id: storedSessionId,
      request_fingerprint: input.requestFingerprint?.trim() || null,
    });

    if (input.userId || storedSessionId) {
      await supabase.from("activity_logs").insert({
        user_id: input.userId,
        session_id: input.userId ? null : storedSessionId,
        event_type: "search",
        keyword,
        path: "/search",
      });
    }

    const today = now.toISOString().slice(0, 10);
    const { data: dailyExisting } = await supabase
      .from("daily_search_stats")
      .select("total_search_count,matched_search_count,unmatched_search_count")
      .eq("date", today)
      .maybeSingle();

    const matched = input.resultStatus === "matched";

    if (dailyExisting) {
      await supabase
        .from("daily_search_stats")
        .update({
          total_search_count: dailyExisting.total_search_count + 1,
          matched_search_count: dailyExisting.matched_search_count + (matched ? 1 : 0),
          unmatched_search_count: dailyExisting.unmatched_search_count + (matched ? 0 : 1),
        })
        .eq("date", today);
    } else {
      await supabase.from("daily_search_stats").insert({
        date: today,
        total_search_count: 1,
        matched_search_count: matched ? 1 : 0,
        unmatched_search_count: matched ? 0 : 1,
      });
    }

    if (input.matchedBrandId) {
      const { data: brandDailyExisting } = await supabase
        .from("brand_daily_stats")
        .select("search_count")
        .eq("date", today)
        .eq("brand_id", input.matchedBrandId)
        .maybeSingle();

      if (brandDailyExisting) {
        await supabase
          .from("brand_daily_stats")
          .update({ search_count: brandDailyExisting.search_count + 1 })
          .eq("date", today)
          .eq("brand_id", input.matchedBrandId);
      } else {
        await supabase.from("brand_daily_stats").insert({
          date: today,
          brand_id: input.matchedBrandId,
          search_count: 1,
          detail_view_count: 0,
          discount_click_count: 0,
        });
      }
    }
  } catch {
    return { recorded: false, skipped: true, reason: "invalid", actorKey };
  }

  return { recorded: true, skipped: false, actorKey };
}
