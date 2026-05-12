"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DiscountUnit = "percent" | "won" | "special_price" | "free" | "unknown";

export type DiscountFormState = {
  message?: string;
  fieldErrors?: Partial<
    Record<
      | "brand_id"
      | "benefit_category_id"
      | "provider_id"
      | "benefit_product_id"
      | "title"
      | "discount_type"
      | "discount_value"
      | "source_url"
      | "end_date",
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

function buildConditionText({
  notice,
  maxDiscountAmount,
  minPaymentAmount,
}: {
  notice: string;
  maxDiscountAmount: number | null;
  minPaymentAmount: number | null;
}) {
  const lines = [
    minPaymentAmount === null ? null : `최소 결제 금액: ${minPaymentAmount}원`,
    maxDiscountAmount === null ? null : `최대 할인 금액: ${maxDiscountAmount}원`,
    notice || null,
  ].filter(Boolean);

  return lines.length > 0 ? lines.join("\n") : null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function createDiscountAction(
  _prevState: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  const brandIdValue = readString(formData, "brand_id");
  const benefitCategoryIdValue = readString(formData, "benefit_category_id");
  const providerIdValue = readString(formData, "provider_id");
  const benefitProductIdValue = readString(formData, "benefit_product_id");
  const title = readString(formData, "title");
  const discountTypeValue = readString(formData, "discount_type");
  const discountValueValue = readString(formData, "discount_value");
  const maxDiscountAmountValue = readString(formData, "max_discount_amount");
  const minPaymentAmountValue = readString(formData, "min_payment_amount");
  const startDate = readString(formData, "start_date");
  const endDate = readString(formData, "end_date");
  const sourceUrlValue = readString(formData, "source_url");
  const notice = readString(formData, "notice");
  const isActive = formData.get("is_active") === "on";

  const fieldErrors: DiscountFormState["fieldErrors"] = {};

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

  const benefitProductId = benefitProductIdValue
    ? Number(benefitProductIdValue)
    : null;
  if (benefitProductIdValue && benefitProductId !== null) {
    if (!Number.isInteger(benefitProductId) || benefitProductId <= 0) {
      fieldErrors.benefit_product_id = "올바른 혜택상품을 선택해 주세요.";
    }
  }

  if (benefitProductIdValue && benefitProductId === null) {
    fieldErrors.benefit_product_id = "올바른 혜택상품을 선택해 주세요.";
  }

  if (!title) {
    fieldErrors.title = "할인 제목을 입력해 주세요.";
  }

  const discountType = discountTypeValue as DiscountUnit;
  if (!discountUnits.has(discountType)) {
    fieldErrors.discount_type = "할인 유형을 선택해 주세요.";
  }

  const discountValue =
    discountType === "free" ? 0 : readPositiveNumber(discountValueValue);
  if (discountValue === null) {
    fieldErrors.discount_value = "0 이상의 할인값을 입력해 주세요.";
  }

  const maxDiscountAmount = readPositiveNumber(maxDiscountAmountValue);
  const minPaymentAmount = readPositiveNumber(minPaymentAmountValue);

  const sourceUrl = normalizeUrl(sourceUrlValue);
  if (sourceUrlValue && !sourceUrl) {
    fieldErrors.source_url = "올바른 출처 URL을 입력해 주세요.";
  }

  if (startDate && endDate && startDate > endDate) {
    fieldErrors.end_date = "종료일은 시작일 이후여야 합니다.";
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

  if (benefitProductId) {
    const { data: product, error: productError } = await supabase
      .from("benefit_products")
      .select("benefit_category_id,provider_id")
      .eq("id", benefitProductId)
      .eq("is_active", true)
      .maybeSingle();

    if (productError || !product) {
      return {
        fieldErrors: {
          benefit_product_id: "활성 혜택상품을 선택해 주세요.",
        },
        message: productError?.message,
      };
    }

    if (
      product.benefit_category_id !== benefitCategoryId ||
      product.provider_id !== providerId
    ) {
      return {
        fieldErrors: {
          benefit_product_id:
            "선택한 카테고리와 제공사에 속한 혜택상품을 선택해 주세요.",
        },
      };
    }
  }

  const { error } = await supabase
    .from("discounts")
    .insert({
      brand_id: brandId,
      benefit_category_id: benefitCategoryId,
      provider_id: providerId,
      benefit_product_id: benefitProductId,
      title,
      summary: title,
      condition_text: buildConditionText({
        notice,
        maxDiscountAmount,
        minPaymentAmount,
      }),
      discount_value: discountValue,
      discount_unit: discountType,
      usage_type: "unknown",
      valid_from: startDate || null,
      valid_until: endDate || null,
      has_no_expiry: !endDate,
      source_url: sourceUrl,
      last_checked_at: today(),
      data_confidence: "medium",
      status: isActive ? "active" : "hidden",
    });

  if (error) {
    return {
      message: `할인 등록에 실패했습니다: ${error.message}`,
    };
  }

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}
