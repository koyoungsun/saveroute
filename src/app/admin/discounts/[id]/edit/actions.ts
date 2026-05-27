"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  readDiscountConditionFields,
  readDiscountDataManagementFields,
  readDiscountNoticeFields,
  readDiscountPeriodFields,
  readDiscountVisibilityFields,
} from "@/lib/admin/read-discount-option-form";
import {
  parseDiscountBenefitProductsFromForm,
  syncDiscountBenefitProductLinks,
} from "@/lib/admin/discount-benefit-product-links";
import { isDiscountOptionGroupEnabled } from "@/lib/admin/discount-form-option-groups";
import { parseDiscountValueFields } from "@/lib/admin/parse-discount-value-fields";
import {
  isDiscountUnitValue,
} from "@/lib/discounts/discount-units";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";
import { parseNumericInput } from "@/lib/ui/format-money";

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
      | "discount_value_max"
      | "condition_amount"
      | "source_url"
      | "valid_until"
      | "status",
      string
    >
  >;
};

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
  const maxDiscountAmountValue = readString(formData, "max_discount_amount");

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

  const discountUnit = discountUnitValue;
  if (!isDiscountUnitValue(discountUnit)) {
    fieldErrors.discount_unit = "할인 유형을 선택해 주세요.";
  }

  const parsedDiscountValues =
    isDiscountUnitValue(discountUnit)
      ? parseDiscountValueFields(formData, discountUnit)
      : null;

  let discountValue: number | null = null;
  let discountValueMax: number | null = null;
  let conditionAmount: number | null = null;

  if (parsedDiscountValues && !parsedDiscountValues.ok) {
    Object.assign(fieldErrors, parsedDiscountValues.fieldErrors);
  } else if (parsedDiscountValues?.ok) {
    discountValue = parsedDiscountValues.value.discountValue;
    discountValueMax = parsedDiscountValues.value.discountValueMax;
    conditionAmount = parsedDiscountValues.value.conditionAmount;
  }

  const maxDiscountAmount = parseNumericInput(maxDiscountAmountValue);

  const supabase = createSupabaseAdminClient();
  const { data: existingDiscount, error: existingError } = await supabase
    .from("discounts")
    .select(
      `
      valid_from,
      valid_until,
      has_no_expiry,
      condition_text,
      apply_basis,
      stackable_policy,
      usage_channel,
      installment_condition,
      notice_text,
      source_url,
      admin_memo,
      status
    `,
    )
    .eq("id", discountId)
    .maybeSingle();

  if (existingError || !existingDiscount) {
    return {
      message: existingError?.message ?? "할인 정보를 불러오지 못했습니다.",
    };
  }

  const existing = {
    valid_from: existingDiscount.valid_from as string | null,
    valid_until: existingDiscount.valid_until as string | null,
    has_no_expiry: existingDiscount.has_no_expiry as boolean,
    condition_text: existingDiscount.condition_text as string | null,
    apply_basis: existingDiscount.apply_basis as string | null,
    stackable_policy: existingDiscount.stackable_policy as string | null,
    usage_channel: existingDiscount.usage_channel as string | null,
    installment_condition: existingDiscount.installment_condition as string | null,
    notice_text: existingDiscount.notice_text as string | null,
    source_url: existingDiscount.source_url as string | null,
    admin_memo: existingDiscount.admin_memo as string | null,
    status: existingDiscount.status as string,
  };

  const noticeFields = readDiscountNoticeFields(formData, "edit", existing);
  const periodFields = readDiscountPeriodFields(formData, "edit", existing);
  const conditionFields = readDiscountConditionFields(formData);
  const dataFields = readDiscountDataManagementFields(formData, "edit", existing);
  const visibilityFields = readDiscountVisibilityFields(formData, "edit", existing);

  const sourceUrl = normalizeUrl(dataFields.source_url_raw);
  if (isDiscountOptionGroupEnabled(formData, "data") && dataFields.source_url_raw && !sourceUrl) {
    fieldErrors.source_url = "올바른 출처 URL을 입력해 주세요.";
  }

  if (
    isDiscountOptionGroupEnabled(formData, "period") &&
    periodFields.valid_from &&
    periodFields.valid_until &&
    periodFields.valid_from > periodFields.valid_until
  ) {
    fieldErrors.valid_until = "종료일은 시작일 이후여야 합니다.";
  }

  const status = visibilityFields.status as DiscountStatus;
  if (
    isDiscountOptionGroupEnabled(formData, "visibility") &&
    !discountStatuses.has(status)
  ) {
    fieldErrors.status = "상태를 선택해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0 || discountValue === null) {
    return { fieldErrors };
  }

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
      condition_text: conditionFields.condition_text,
      apply_basis: conditionFields.apply_basis,
      stackable_policy: conditionFields.stackable_policy,
      usage_channel: conditionFields.usage_channel,
      notice_text: noticeFields.notice_text,
      installment_condition: conditionFields.installment_condition,
      discount_value: discountValue,
      discount_value_max: discountValueMax,
      condition_amount: conditionAmount,
      max_discount_amount: maxDiscountAmount,
      discount_unit: discountUnit,
      valid_from: periodFields.valid_from,
      valid_until: periodFields.valid_until,
      has_no_expiry: periodFields.has_no_expiry,
      source_url: sourceUrl,
      admin_memo: dataFields.admin_memo,
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

  await writeAdminAuditLog({
    action: "update",
    targetTable: "discounts",
    targetId: discountId,
    summary: `할인 수정: ${title}`,
    afterData: { title, status },
  });

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts");
}
