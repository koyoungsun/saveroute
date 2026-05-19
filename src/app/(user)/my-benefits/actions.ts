"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { allowedCardBenefitKinds, type CardBenefitKind } from "@/lib/benefits/card-benefit-kinds";

export type BenefitActionState = {
  message?: string;
  error?: string;
};

export type BenefitCardCatalogRequestKind = "credit" | "debit" | "prepaid" | "unknown";

function normalizeBenefitCatalogRequestKind(
  value: BenefitCardCatalogRequestKind | string,
): BenefitCardCatalogRequestKind | null {
  return value === "credit" || value === "debit" || value === "prepaid" || value === "unknown"
    ? value
    : null;
}

function readPositiveInteger(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCardBenefitType(value: string) {
  return value === "credit" || value === "debit" || value === "prepaid" || value === "all"
    ? value
    : null;
}

function nowIso() {
  return new Date().toISOString();
}

async function requireSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login?redirect=/my-benefits");
  }

  return { supabase, userId: user.id };
}

/** 통신·알뜰폰 혜택 단일 등록 (중복 조합 차단, 3사 멤버십은 동일 망 등급 교체) */
export async function registerTelecomBenefitAction(productId: number): Promise<BenefitActionState> {
  if (!Number.isInteger(productId) || productId <= 0) {
    return { error: "잘못된 통신 혜택 상품입니다." };
  }

  const { supabase, userId } = await requireSession();

  const { data: product, error: productError } = await supabase
    .from("benefit_products")
    .select("id, benefit_category_id, provider_id, product_type")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (productError || !product) {
    return { error: "통신 혜택 상품을 찾지 못했습니다." };
  }

  const { data: categoryRow, error: catError } = await supabase
    .from("benefit_categories")
    .select("code")
    .eq("id", product.benefit_category_id)
    .maybeSingle();

  if (catError || !categoryRow) {
    return { error: "혜택 카테고리를 확인하지 못했습니다." };
  }

  const catCode = categoryRow.code;

  if (catCode === "telecom") {
    if (product.product_type !== "telecom_membership") {
      return { error: "선택한 상품으로는 통신 멤버십을 등록할 수 없습니다." };
    }

    await supabase
      .from("user_benefits")
      .update({ is_active: false, updated_at: nowIso() })
      .eq("user_id", userId)
      .eq("benefit_category_id", product.benefit_category_id)
      .eq("provider_id", product.provider_id);
  } else if (catCode === "mvno") {
    if (product.product_type !== "telecom_mvno_plan") {
      return { error: "선택한 상품으로는 알뜰폰 회선을 등록할 수 없습니다." };
    }

    const { data: dupe, error: dupeError } = await supabase
      .from("user_benefits")
      .select("id")
      .eq("user_id", userId)
      .eq("provider_id", product.provider_id)
      .eq("benefit_product_id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (dupeError) {
      return { error: dupeError.message };
    }

    if (dupe) {
      return { error: "이미 등록된 통신 혜택입니다." };
    }
  } else {
    return { error: "통신·알뜰폰 카테고리 상품만 등록할 수 있습니다." };
  }

  const { error: upsertError } = await supabase.from("user_benefits").upsert(
    {
      user_id: userId,
      benefit_category_id: product.benefit_category_id,
      provider_id: product.provider_id,
      benefit_product_id: productId,
      is_active: true,
      updated_at: nowIso(),
    },
    { onConflict: "user_id,benefit_category_id,provider_id,benefit_product_id" },
  );

  if (upsertError) {
    return { error: upsertError.message };
  }

  revalidatePath("/my-benefits");
  revalidatePath("/onboarding");
  return { message: "통신 혜택을 등록했습니다." };
}

/** 카드 혜택 상품 추가 (중복 시 재활성화) */
export async function addCardBenefitAction(
  productId: number,
  benefitType: "credit" | "debit" | "prepaid" | "all",
): Promise<BenefitActionState> {
  if (!Number.isInteger(productId) || productId <= 0) {
    return { error: "잘못된 카드 상품입니다." };
  }

  const normalizedBenefitType = normalizeCardBenefitType(benefitType);
  if (!normalizedBenefitType) {
    return { error: "카드 유형을 선택해 주세요." };
  }

  const { supabase, userId } = await requireSession();

  const { data: product, error: productError } = await supabase
    .from("benefit_products")
    .select("id, benefit_category_id, provider_id, benefit_type, card_type, is_all_product")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (productError || !product) {
    return { error: "카드 상품을 찾지 못했습니다." };
  }

  const isAllProduct =
    Boolean(product.is_all_product) ||
    String(product.benefit_type ?? "").toLowerCase() === "all";

  let storedBenefitType: CardBenefitKind | null = normalizedBenefitType;
  if (isAllProduct) {
    storedBenefitType = "all";
  }

  const allowed = allowedCardBenefitKinds({
    benefit_type: (product.benefit_type as string | null) ?? null,
    card_type: (product.card_type as string | null) ?? null,
    is_all_product: isAllProduct,
  });
  if (!storedBenefitType || !allowed.includes(storedBenefitType)) {
    return { error: "선택한 카드와 카드 유형이 맞지 않습니다." };
  }

  const { data: categoryRow } = await supabase
    .from("benefit_categories")
    .select("code")
    .eq("id", product.benefit_category_id)
    .maybeSingle();

  if (categoryRow?.code !== "card") {
    return { error: "카드 카테고리 상품만 등록할 수 있습니다." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("user_benefits")
    .select("id,is_active")
    .eq("user_id", userId)
    .eq("benefit_category_id", product.benefit_category_id)
    .eq("provider_id", product.provider_id)
    .eq("benefit_product_id", product.id)
    .maybeSingle();

  if (existingError) {
    return { error: existingError.message };
  }

  if (existing?.is_active) {
    return { error: "이미 등록된 카드입니다." };
  }

  const row = {
    user_id: userId,
    benefit_category_id: product.benefit_category_id,
    provider_id: product.provider_id,
    benefit_product_id: product.id,
    benefit_type: storedBenefitType,
    is_active: true,
    updated_at: nowIso(),
  };

  const { error: upsertError } = await supabase.from("user_benefits").upsert(row, {
    onConflict: "user_id,benefit_category_id,provider_id,benefit_product_id",
  });

  if (upsertError) {
    return { error: upsertError.message };
  }

  revalidatePath("/my-benefits");
  revalidatePath("/onboarding");
  return { message: "보유카드에 추가되었습니다." };
}

/** benefit_products 에 없어도 카드 마스터 추가 요청 (상태 pending) */
export async function requestBenefitCardCatalogAction(
  providerId: number,
  rawCardName: string,
  cardBenefitType: BenefitCardCatalogRequestKind,
): Promise<BenefitActionState> {
  if (!Number.isInteger(providerId) || providerId <= 0) {
    return { error: "카드사를 선택해 주세요." };
  }

  const cardName = rawCardName.trim();
  if (cardName.length === 0 || cardName.length > 200) {
    return { error: "카드명을 1~200자로 입력해 주세요." };
  }

  const normalizedKind = normalizeBenefitCatalogRequestKind(cardBenefitType);
  if (!normalizedKind) {
    return { error: "카드 유형을 선택해 주세요." };
  }

  const { supabase, userId } = await requireSession();

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id,benefit_category_id,provider_type,is_active")
    .eq("id", providerId)
    .eq("is_active", true)
    .maybeSingle();

  if (providerError || !provider) {
    return { error: "카드사 정보를 확인할 수 없습니다." };
  }

  const { data: category, error: categoryError } = await supabase
    .from("benefit_categories")
    .select("code")
    .eq("id", provider.benefit_category_id as number)
    .maybeSingle();

  if (categoryError || category?.code !== "card" || provider.provider_type !== "card_company") {
    return { error: "등록 가능한 카드사만 요청할 수 있습니다." };
  }

  const { error: insertError } = await supabase.from("benefit_card_catalog_requests").insert({
    user_id: userId,
    provider_id: providerId,
    card_name: cardName,
    card_benefit_type: normalizedKind,
    status: "pending",
    updated_at: nowIso(),
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/my-benefits");
  revalidatePath("/onboarding");
  return { message: "카드 추가 요청이 접수되었습니다. 처리 후 마스터에 반영할게요." };
}

export async function deactivateUserBenefitAction(formData: FormData) {
  const benefitId = readPositiveInteger(formData, "user_benefit_id");

  if (!benefitId) {
    return;
  }

  const { supabase, userId } = await requireSession();
  await supabase
    .from("user_benefits")
    .update({ is_active: false, updated_at: nowIso() })
    .eq("id", benefitId)
    .eq("user_id", userId);

  revalidatePath("/my-benefits");
  revalidatePath("/onboarding");
}
