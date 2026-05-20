import type { SupabaseClient } from "@supabase/supabase-js";

export type ProviderRequestRow = {
  id: number;
  provider_name: string;
  category: string;
  request_user: string;
  request_user_id: string | null;
  requested_at: string;
  status: string;
  admin_memo: string | null;
  approved_provider_id: number | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const PROVIDER_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export type ProviderRequestStatus = (typeof PROVIDER_REQUEST_STATUSES)[number];

export function normalizeProviderCode(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);

  return base || "card_provider";
}

export async function ensureCardProviderAllProduct(
  supabase: SupabaseClient,
  params: {
    providerId: number;
    providerName: string;
    providerCode: string;
  },
) {
  const { data: category, error: categoryError } = await supabase
    .from("benefit_categories")
    .select("id")
    .eq("code", "card")
    .maybeSingle();

  if (categoryError || !category) {
    throw new Error("카드 혜택 카테고리를 찾을 수 없습니다.");
  }

  const allProductName = `${params.providerName} 전체`;
  const allProductCode = `${params.providerCode}_all`;

  const { data: existing } = await supabase
    .from("benefit_products")
    .select("id")
    .eq("provider_id", params.providerId)
    .eq("name", allProductName)
    .eq("benefit_type", "all")
    .maybeSingle();

  if (existing) {
    return existing.id as number;
  }

  const { data: inserted, error } = await supabase
    .from("benefit_products")
    .insert({
      benefit_category_id: category.id,
      provider_id: params.providerId,
      name: allProductName,
      code: allProductCode,
      product_type: "credit_card",
      card_type: "unknown",
      benefit_type: "all",
      is_all_product: true,
      is_active: true,
      is_mvno: false,
      mvno_notice_required: false,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "카드사 전체 상품 생성에 실패했습니다.");
  }

  return inserted.id as number;
}

export async function approveProviderRequest(
  supabase: SupabaseClient,
  requestId: number,
): Promise<{ providerId: number }> {
  const { data: request, error: fetchError } = await supabase
    .from("provider_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !request) {
    throw new Error("요청을 찾을 수 없습니다.");
  }

  const row = request as ProviderRequestRow;
  if (row.status !== "pending") {
    throw new Error("대기중인 요청만 승인할 수 있습니다.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("benefit_categories")
    .select("id,code")
    .eq("code", row.category)
    .maybeSingle();

  if (categoryError || !category) {
    throw new Error("혜택 카테고리를 확인할 수 없습니다.");
  }

  if (category.code !== "card") {
    throw new Error("현재는 카드사(category=card) 요청만 승인할 수 있습니다.");
  }

  let providerCode = normalizeProviderCode(row.provider_name);
  const { data: codeConflict } = await supabase
    .from("providers")
    .select("id")
    .eq("code", providerCode)
    .maybeSingle();

  if (codeConflict) {
    providerCode = `${providerCode}_${requestId}`;
  }

  const { data: createdProvider, error: insertError } = await supabase
    .from("providers")
    .insert({
      name: row.provider_name.trim(),
      code: providerCode,
      benefit_category_id: category.id,
      provider_type: "card_company",
      is_active: true,
      display_order: 500,
    })
    .select("id")
    .single();

  if (insertError || !createdProvider) {
    throw new Error(insertError?.message ?? "제공사 등록에 실패했습니다.");
  }

  const providerId = createdProvider.id as number;

  await ensureCardProviderAllProduct(supabase, {
    providerId,
    providerName: row.provider_name.trim(),
    providerCode,
  });

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("provider_requests")
    .update({
      status: "approved",
      approved_provider_id: providerId,
      processed_at: now,
      updated_at: now,
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { providerId };
}
