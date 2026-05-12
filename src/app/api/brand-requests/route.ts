import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase().replace(/[^가-힣a-zA-Z0-9]/g, "");
}

/** 로그인 사용자의 업데이트 요청 참여 로그 (마이페이지 집계용, 실패 시 무시) */
async function recordBrandRequestParticipation(normalizedKeyword: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_brand_request_events").insert({
      user_id: user.id,
      normalized_keyword: normalizedKeyword,
    });
  } catch {
    /* noop — 집계 테이블 미적용 등으로 본 요청은 성공 처리 유지 */
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ request_count: 0 });
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /** 비로그인 시 brand_requests 는 anon 에게 SELECT/UPDATE 가 없으므로 서버에서만 처리 */
  const db = user ? supabase : createSupabaseAdminClient();

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

  const { data: existing, error: selectError } = await db
    .from("brand_requests")
    .select("id, request_count")
    .eq("normalized_keyword", normalized)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (!existing) {
    const { error: insertError } = await db.from("brand_requests").insert({
      keyword: raw || normalized,
      normalized_keyword: normalized,
      request_count: 1,
      status: "pending",
      last_requested_at: now,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return handleConcurrentExisting(db, normalized, raw, now);
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await recordBrandRequestParticipation(normalized);
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
  const { error: updateError } = await db
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

  await recordBrandRequestParticipation(normalized);
  return NextResponse.json({ ok: true, request_count: nextCount });
}

async function handleConcurrentExisting(
  client: SupabaseClient,
  normalized: string,
  raw: string,
  now: string,
) {
  const { data: row, error } = await client
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
  const { error: updateError } = await client
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

  await recordBrandRequestParticipation(normalized);
  return NextResponse.json({ ok: true, request_count: nextCount });
}
