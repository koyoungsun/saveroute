import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase().replace(/[^가-힣a-zA-Z0-9]/g, "");
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keyword = request.nextUrl.searchParams.get("keyword") ?? "";
  const normalized = normalizeKeyword(keyword);
  if (!normalized) {
    return NextResponse.json({ request_count: 0 });
  }

  const { data, error } = await supabase
    .from("brand_requests")
    .select("request_count")
    .eq("normalized_keyword", normalized)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ request_count: data?.request_count ?? 0 });
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw =
    typeof (body as { keyword?: unknown }).keyword === "string"
      ? (body as { keyword: string }).keyword.trim()
      : "";
  const normalized = normalizeKeyword(raw);
  if (!normalized) {
    return NextResponse.json({ error: "keyword required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const { data: existing, error: selectError } = await supabase
    .from("brand_requests")
    .select("id, request_count")
    .eq("normalized_keyword", normalized)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (!existing) {
    const { error: insertError } = await supabase.from("brand_requests").insert({
      keyword: raw || normalized,
      normalized_keyword: normalized,
      request_count: 1,
      status: "pending",
      last_requested_at: now,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return handleConcurrentExisting(supabase, normalized, raw, now);
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, request_count: 1 });
  }

  if (existing.request_count >= 10) {
    return NextResponse.json({
      ok: false,
      status: "max_reached",
      request_count: existing.request_count,
    });
  }

  const nextCount = existing.request_count + 1;
  const { error: updateError } = await supabase
    .from("brand_requests")
    .update({
      request_count: nextCount,
      last_requested_at: now,
      keyword: raw || normalized,
      updated_at: now,
    })
    .eq("id", existing.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request_count: nextCount });
}

async function handleConcurrentExisting(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  normalized: string,
  raw: string,
  now: string,
) {
  const { data: row, error } = await supabase
    .from("brand_requests")
    .select("id, request_count")
    .eq("normalized_keyword", normalized)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "Conflict retry failed" }, { status: 500 });
  }

  if (row.request_count >= 10) {
    return NextResponse.json({
      ok: false,
      status: "max_reached",
      request_count: row.request_count,
    });
  }

  const nextCount = row.request_count + 1;
  const { error: updateError } = await supabase
    .from("brand_requests")
    .update({
      request_count: nextCount,
      last_requested_at: now,
      keyword: raw || normalized,
      updated_at: now,
    })
    .eq("id", row.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request_count: nextCount });
}
