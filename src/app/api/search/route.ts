import { NextRequest, NextResponse } from "next/server";

import { performSearch } from "@/lib/search/perform-search";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { VISITOR_SESSION_COOKIE } from "@/lib/session/visitor-session";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
  const supabase = await createServerSupabaseClient();
  const sessionId = request.cookies.get(VISITOR_SESSION_COOKIE)?.value ?? null;
  const payload = await performSearch(supabase, keyword, { sessionId });
  return NextResponse.json(payload);
}
