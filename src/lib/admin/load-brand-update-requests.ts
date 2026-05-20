import type { SupabaseClient } from "@supabase/supabase-js";

export type BrandUpdateRequestRow = {
  id: number;
  keyword: string;
  normalized_keyword: string;
  request_count: number;
  status: string;
  memo: string | null;
  created_at: string;
  updated_at: string;
  last_requested_at: string;
};

export type BrandUpdateRequestQuery = {
  status?: string;
  q?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

const VALID_STATUSES = ["pending", "reviewing", "completed", "rejected"] as const;

function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function parseDateStart(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(`${value.trim()}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(`${value.trim()}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function loadBrandUpdateRequests(
  supabase: SupabaseClient,
  query: BrandUpdateRequestQuery = {},
): Promise<BrandUpdateRequestRow[]> {
  const limit = query.limit ?? 50;
  const status = query.status?.trim() ?? "";
  const q = query.q?.trim() ?? "";

  let request = supabase
    .from("brand_requests")
    .select(
      "id,keyword,normalized_keyword,request_count,status,memo,created_at,updated_at,last_requested_at",
    )
    .order("last_requested_at", { ascending: false })
    .limit(limit);

  if (status && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    request = request.eq("status", status);
  }

  if (q) {
    const esc = escapeIlikePattern(q);
    request = request.or(`keyword.ilike.%${esc}%,normalized_keyword.ilike.%${esc}%`);
  }

  const start = parseDateStart(query.startDate);
  if (start) {
    request = request.gte("created_at", start.toISOString());
  }

  const end = parseDateEnd(query.endDate);
  if (end) {
    request = request.lte("created_at", end.toISOString());
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(`brand_requests 조회 실패: ${error.message}`);
  }

  return (data ?? []) as BrandUpdateRequestRow[];
}

export function formatBrandRequestProcessedAt(row: BrandUpdateRequestRow) {
  if (row.status === "completed" || row.status === "rejected") {
    return row.updated_at;
  }

  return null;
}
