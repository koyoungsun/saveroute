"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  parseDiscountBenefitProductsFromForm,
  syncDiscountBenefitProductLinks,
} from "@/lib/admin/discount-benefit-product-links";

type DiscountUnit = "percent" | "won" | "special_price" | "free" | "unknown";
type DiscountStatus = "draft" | "active" | "expired" | "hidden";

export type DiscountEditFormState = {
  message?: string;
  fieldErrors?: Partial<
    Record<
      | "brand_id"
      | "benefit_category_id"
      | "provider_id"
      | "benefit_product_id"
      | "title"
      | "discount_unit"
      | "discount_value"
      | "source_url"
      | "valid_until"
      | "status",
      string
    >
  >;
};

const discountUnits = new Set<DiscountUnit>([
  "percent",
  "won",
  "special_price",
  "free",
  "unknown",
]);

const discountStatuses = new Set<DiscountStatus>([
  "draft",
  "active",
  "expired",
  "hidden",
]);

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveNumber(value: string) {
  if (!value) {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function normalizeUrl(value: string) {
  if (!value) {
    return null;
  }

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(normalized).toString();
  } catch {
    return null;
  }
}

export async function updateDiscountAction(
  discountId: number,
  _prevState: DiscountEditFormState,
  formData: FormData,
): Promise<DiscountEditFormState> {
  const brandIdValue = readString(formData, "brand_id");
  const benefitCategoryIdValue = readString(formData, "benefit_category_id");
  const providerIdValue = readString(formData, "provider_id");
  const title = readString(formData, "title");
  const discountUnitValue = readString(formData, "discount_unit");
  const discountValueValue = readString(formData, "discount_value");
  const conditionText = readString(formData, "condition_text");
  const installmentCondition = readString(formData, "installment_condition");
  const validFrom = readString(formData, "valid_from");
  const validUntil = readString(formData, "valid_until");
  const sourceUrlValue = readString(formData, "source_url");
  const statusValue = readString(formData, "status");

  const fieldErrors: DiscountEditFormState["fieldErrors"] = {};

  const brandId = Number(brandIdValue);
  if (!brandIdValue || !Number.isInteger(brandId) || brandId <= 0) {
    fieldErrors.brand_id = "브랜드를 선택해 주세요.";
  }

  const benefitCategoryId = Number(benefitCategoryIdValue);
  if (
    !benefitCategoryIdValue ||
    !Number.isInteger(benefitCategoryId) ||
    benefitCategoryId <= 0
  ) {
    fieldErrors.benefit_category_id = "혜택 카테고리를 선택해 주세요.";
  }

  const providerId = Number(providerIdValue);
  if (!providerIdValue || !Number.isInteger(providerId) || providerId <= 0) {
    fieldErrors.provider_id = "제공사를 선택해 주세요.";
  }

  if (!title) {
    fieldErrors.title = "할인 제목을 입력해 주세요.";
  }

  const discountUnit = discountUnitValue as DiscountUnit;
  if (!discountUnits.has(discountUnit)) {
    fieldErrors.discount_unit = "할인 유형을 선택해 주세요.";
  }

  const discountValue =
    discountUnit === "free" ? 0 : readPositiveNumber(discountValueValue);
  if (discountValue === null) {
    fieldErrors.discount_value = "0 이상의 할인값을 입력해 주세요.";
  }

  const sourceUrl = normalizeUrl(sourceUrlValue);
  if (sourceUrlValue && !sourceUrl) {
    fieldErrors.source_url = "올바른 출처 URL을 입력해 주세요.";
  }

  if (validFrom && validUntil && validFrom > validUntil) {
    fieldErrors.valid_until = "종료일은 시작일 이후여야 합니다.";
  }

  const status = statusValue as DiscountStatus;
  if (!discountStatuses.has(status)) {
    fieldErrors.status = "상태를 선택해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = createSupabaseAdminClient();
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("benefit_category_id")
    .eq("id", providerId)
    .eq("is_active", true)
    .maybeSingle();

  if (providerError || !provider) {
    return {
      fieldErrors: {
        provider_id: "활성 제공사를 선택해 주세요.",
      },
      message: providerError?.message,
    };
  }

  if (provider.benefit_category_id !== benefitCategoryId) {
    return {
      fieldErrors: {
        provider_id: "선택한 카테고리에 속한 제공사를 선택해 주세요.",
      },
    };
  }

  const parsedProducts = await parseDiscountBenefitProductsFromForm(
    supabase,
    formData,
    benefitCategoryId,
    providerId,
  );

  if (!parsedProducts.ok) {
    return {
      fieldErrors: {
        benefit_product_id: parsedProducts.message,
      },
    };
  }

  const { primaryBenefitProductId: benefitProductId } = parsedProducts.value;

  const { error } = await supabase
    .from("discounts")
    .update({
      brand_id: brandId,
      benefit_category_id: benefitCategoryId,
      provider_id: providerId,
      benefit_product_id: benefitProductId,
      title,
      summary: title,
      condition_text: conditionText || null,
      installment_condition: installmentCondition || null,
      discount_value: discountValue,
      discount_unit: discountUnit,
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      has_no_expiry: !validUntil,
      source_url: sourceUrl,
      status,
    })
    .eq("id", discountId);

  if (error) {
    return {
      message: `할인 수정에 실패했습니다: ${error.message}`,
    };
  }

  try {
    await syncDiscountBenefitProductLinks(supabase, discountId, parsedProducts.value);
  } catch (syncError) {
    return {
      message:
        syncError instanceof Error
          ? `혜택상품 연결 저장에 실패했습니다: ${syncError.message}`
          : "혜택상품 연결 저장에 실패했습니다.",
    };
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}
