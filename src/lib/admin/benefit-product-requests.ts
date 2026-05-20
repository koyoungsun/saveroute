import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createCardBenefitProduct,
  findExistingCardBenefitProduct,
  type CardBenefitType,
} from "@/lib/admin/create-card-benefit-product";

export type BenefitProductRequestRow = {
  id: number;
  user_id: string | null;
  provider_id: number;
  category_code: string;
  requested_name: string;
  requested_benefit_type: CardBenefitType;
  status: string;
  approved_benefit_product_id: number | null;
  admin_memo: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export async function approveBenefitProductRequest(
  supabase: SupabaseClient,
  requestId: number,
  reviewedBy: string | null,
): Promise<{ productId: number; created: boolean }> {
  const { data: requestRow, error: fetchError } = await supabase
    .from("benefit_product_requests")
    .select(
      "id,user_id,provider_id,category_code,requested_name,requested_benefit_type,status,provider:providers(benefit_category_id)",
    )
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !requestRow) {
    throw new Error("카드 요청을 찾을 수 없습니다.");
  }

  if (requestRow.status !== "pending") {
    throw new Error("이미 처리된 요청입니다.");
  }

  if (requestRow.category_code !== "card") {
    throw new Error("카드 카테고리 요청만 승인할 수 있습니다.");
  }

  const providerRelation = requestRow.provider as
    | { benefit_category_id: number }
    | { benefit_category_id: number }[]
    | null;
  const provider = Array.isArray(providerRelation) ? providerRelation[0] : providerRelation;
  if (!provider?.benefit_category_id) {
    throw new Error("카드사 정보를 확인할 수 없습니다.");
  }

  const benefitType = requestRow.requested_benefit_type as CardBenefitType;
  const trimmedName = String(requestRow.requested_name).trim();

  let productId: number;
  let created = false;

  const existing = await findExistingCardBenefitProduct(
    supabase,
    requestRow.provider_id as number,
    trimmedName,
    benefitType,
  );

  if (existing) {
    productId = existing.id;
  } else {
    const result = await createCardBenefitProduct(supabase, {
      benefitCategoryId: provider.benefit_category_id,
      providerId: requestRow.provider_id as number,
      name: trimmedName,
      benefitType,
    });

    if (!result.ok) {
      if (result.reason === "duplicate") {
        productId = result.existingProduct.id;
      } else {
        throw new Error(result.message);
      }
    } else {
      productId = result.product.id;
      created = result.created;
    }
  }

  const now = new Date().toISOString();

  const { error: requestUpdateError } = await supabase
    .from("benefit_product_requests")
    .update({
      status: "approved",
      approved_benefit_product_id: productId,
      reviewed_at: now,
      reviewed_by: reviewedBy,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (requestUpdateError) {
    throw new Error(requestUpdateError.message);
  }

  const { error: userBenefitsError } = await supabase
    .from("user_benefits")
    .update({
      benefit_product_id: productId,
      benefit_type: benefitType,
      approval_status: "approved",
      custom_name: null,
      updated_at: now,
    })
    .eq("benefit_product_request_id", requestId);

  if (userBenefitsError) {
    throw new Error(userBenefitsError.message);
  }

  return { productId, created };
}

export async function rejectBenefitProductRequest(
  supabase: SupabaseClient,
  requestId: number,
  adminMemo: string,
  reviewedBy: string | null,
): Promise<void> {
  const { data: requestRow, error: fetchError } = await supabase
    .from("benefit_product_requests")
    .select("id,status")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !requestRow) {
    throw new Error("카드 요청을 찾을 수 없습니다.");
  }

  if (requestRow.status !== "pending") {
    throw new Error("이미 처리된 요청입니다.");
  }

  const now = new Date().toISOString();

  const { error: requestUpdateError } = await supabase
    .from("benefit_product_requests")
    .update({
      status: "rejected",
      admin_memo: adminMemo.trim() || null,
      reviewed_at: now,
      reviewed_by: reviewedBy,
      updated_at: now,
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (requestUpdateError) {
    throw new Error(requestUpdateError.message);
  }

  const { error: userBenefitsError } = await supabase
    .from("user_benefits")
    .update({
      approval_status: "rejected",
      updated_at: now,
    })
    .eq("benefit_product_request_id", requestId);

  if (userBenefitsError) {
    throw new Error(userBenefitsError.message);
  }
}
