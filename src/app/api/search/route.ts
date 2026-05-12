import { NextRequest, NextResponse } from "next/server";

import { performSearch } from "@/lib/search/perform-search";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
  const supabase = await createServerSupabaseClient();
  const payload = await performSearch(supabase, keyword);
  return NextResponse.json(payload);
}
