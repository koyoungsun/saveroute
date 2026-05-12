"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { TelecomCarrierKey } from "@/lib/benefits/load-registration-data";

export type BenefitActionState = {
  message?: string;
  error?: string;
};

function readPositiveInteger(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeCardBenefitType(value: string) {
  return value === "credit" || value === "debit" ? value : null;
}

function nowIso() {
  return new Date().toISOString();
}

async function requireSession() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/auth/login?redirect=/my-benefits");
  }

  return { supabase, userId: data.session.user.id };
}

const TELECOM_PRODUCT_CODE: Record<Exclude<TelecomCarrierKey, "mvno">, string> = {
  skt: "skt_tmembership",
  kt: "kt_vip",
  lguplus: "lguplus_vip",
};

/** 통신사 단일 선택(SKT / KT / LG U+ / 알뜰폰). 기존 통신사 행은 비활성화 후 교체 */
export async function setTelecomCarrierAction(
  _prev: BenefitActionState,
  formData: FormData,
): Promise<BenefitActionState> {
  const carrierRaw = formData.get("carrier");
  const carrier =
    typeof carrierRaw === "string"
      ? (carrierRaw as TelecomCarrierKey | "none")
      : "none";

  const allowed: (TelecomCarrierKey | "none")[] = ["skt", "kt", "lguplus", "mvno", "none"];
  if (!allowed.includes(carrier)) {
    return { error: "통신사 선택이 올바르지 않습니다." };
  }

  const { supabase, userId } = await requireSession();

  const { data: telecomCat, error: catError } = await supabase
    .from("benefit_categories")
    .select("id")
    .eq("code", "telecom")
    .maybeSingle();

  if (catError || !telecomCat) {
    return { error: "통신사 카테고리를 불러오지 못했습니다." };
  }

  const telecomCategoryId = telecomCat.id;

  await supabase
    .from("user_benefits")
    .update({ is_active: false, updated_at: nowIso() })
    .eq("user_id", userId)
    .eq("benefit_category_id", telecomCategoryId);

  if (carrier === "none") {
    revalidatePath("/my-benefits");
    revalidatePath("/onboarding");
    return { message: "통신사 혜택을 해제했습니다." };
  }

  const ts = nowIso();
  const rows: {
    user_id: string;
    benefit_category_id: number;
    provider_id: number;
    benefit_product_id: number;
    is_active: boolean;
    updated_at: string;
  }[] = [];

  if (carrier === "mvno") {
    const { data: mvnoProviders } = await supabase
      .from("providers")
      .select("id")
      .eq("benefit_category_id", telecomCategoryId)
      .eq("provider_type", "telecom_mvno")
      .eq("is_active", true);

    const mvnoIds = (mvnoProviders ?? []).map((p) => p.id);
    if (mvnoIds.length === 0) {
      return { error: "등록 가능한 알뜰폰 상품이 없습니다." };
    }

    const { data: mvnoProducts, error: prodError } = await supabase
      .from("benefit_products")
      .select("id, benefit_category_id, provider_id")
      .in("provider_id", mvnoIds)
      .eq("is_active", true);

    if (prodError || !mvnoProducts?.length) {
      return { error: "알뜰폰 혜택 상품을 불러오지 못했습니다." };
    }

    for (const p of mvnoProducts) {
      rows.push({
        user_id: userId,
        benefit_category_id: p.benefit_category_id,
        provider_id: p.provider_id,
        benefit_product_id: p.id,
        is_active: true,
        updated_at: ts,
      });
    }
  } else {
    const code = TELECOM_PRODUCT_CODE[carrier];
    const { data: product, error: productError } = await supabase
      .from("benefit_products")
      .select("id, benefit_category_id, provider_id")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();

    if (productError || !product) {
      return { error: "선택한 통신사 혜택 상품을 찾지 못했습니다." };
    }

    rows.push({
      user_id: userId,
      benefit_category_id: product.benefit_category_id,
      provider_id: product.provider_id,
      benefit_product_id: product.id,
      is_active: true,
      updated_at: ts,
    });
  }

  const { error: upsertError } = await supabase.from("user_benefits").upsert(rows, {
    onConflict: "user_id,benefit_category_id,provider_id,benefit_product_id",
  });

  if (upsertError) {
    return { error: `통신사 혜택 저장 실패: ${upsertError.message}` };
  }

  revalidatePath("/my-benefits");
  revalidatePath("/onboarding");
  return { message: "통신사 혜택을 저장했습니다." };
}

/** 카드 혜택 상품 추가 (중복 시 재활성화) */
export async function addCardBenefitAction(
  productId: number,
  benefitType: "credit" | "debit",
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
    .select("id, benefit_category_id, provider_id")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (productError || !product) {
    return { error: "카드 상품을 찾지 못했습니다." };
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
    benefit_type: normalizedBenefitType,
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
