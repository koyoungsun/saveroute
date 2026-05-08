"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProductType =
  | "telecom_membership"
  | "telecom_mvno_plan"
  | "credit_card"
  | "coupon"
  | "membership";

type ProviderType =
  | "telecom_major"
  | "telecom_mvno"
  | "card_company"
  | "coupon_platform"
  | "membership_company";

type FieldName =
  | "benefit_category_id"
  | "provider_id"
  | "name"
  | "is_active"
  | "is_mvno"
  | "mvno_notice_required";

export type BenefitProductFormState = {
  message?: string;
  fieldErrors?: Partial<Record<FieldName, string>>;
};

type ValidatedProductInput = {
  benefitCategoryId: number;
  providerId: number;
  name: string;
  isActive: boolean;
  isMvno: boolean;
  mvnoNoticeRequired: boolean;
  productType: ProductType;
};

type ValidationResult =
  | { ok: true; data: ValidatedProductInput }
  | { ok: false; state: BenefitProductFormState };

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function generateProductCode(name: string) {
  const base = slugify(name) || "benefit_product";
  return `${base}_${randomUUID().slice(0, 8)}`;
}

function inferProductType({
  categoryCode,
  providerType,
  isMvno,
}: {
  categoryCode: string;
  providerType: ProviderType;
  isMvno: boolean;
}): ProductType | null {
  if (categoryCode === "telecom") {
    return isMvno || providerType === "telecom_mvno"
      ? "telecom_mvno_plan"
      : "telecom_membership";
  }

  if (categoryCode === "card") {
    return "credit_card";
  }

  if (categoryCode === "coupon") {
    return "coupon";
  }

  if (categoryCode === "membership") {
    return "membership";
  }

  return null;
}

async function validateBenefitProductForm(
  formData: FormData,
): Promise<ValidationResult> {
  const benefitCategoryIdValue = readString(formData, "benefit_category_id");
  const providerIdValue = readString(formData, "provider_id");
  const name = readString(formData, "name");
  const isActive = formData.get("is_active") === "on";
  const isMvno = formData.get("is_mvno") === "on";
  const mvnoNoticeRequired = formData.get("mvno_notice_required") === "on";

  const fieldErrors: BenefitProductFormState["fieldErrors"] = {};
  const benefitCategoryId = readPositiveInteger(benefitCategoryIdValue);
  const providerId = readPositiveInteger(providerIdValue);

  if (!benefitCategoryId) {
    fieldErrors.benefit_category_id = "혜택 카테고리를 선택해 주세요.";
  }

  if (!providerId) {
    fieldErrors.provider_id = "제공사를 선택해 주세요.";
  }

  if (!name) {
    fieldErrors.name = "상품명을 입력해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, state: { fieldErrors } };
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: category, error: categoryError },
    { data: provider, error: providerError },
  ] = await Promise.all([
    supabase
      .from("benefit_categories")
      .select("id,code")
      .eq("id", benefitCategoryId)
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("providers")
      .select("benefit_category_id,provider_type")
      .eq("id", providerId)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  if (categoryError || !category) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          benefit_category_id: "활성 혜택 카테고리를 선택해 주세요.",
        },
        message: categoryError?.message,
      },
    };
  }

  if (providerError || !provider) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          provider_id: "활성 제공사를 선택해 주세요.",
        },
        message: providerError?.message,
      },
    };
  }

  if (provider.benefit_category_id !== benefitCategoryId) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          provider_id: "선택한 카테고리에 속한 제공사를 선택해 주세요.",
        },
      },
    };
  }

  const productType = inferProductType({
    categoryCode: category.code,
    providerType: provider.provider_type as ProviderType,
    isMvno,
  });

  if (!productType) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          benefit_category_id: "지원하는 혜택상품 카테고리를 선택해 주세요.",
        },
      },
    };
  }

  return {
    ok: true,
    data: {
      benefitCategoryId: benefitCategoryId!,
      providerId: providerId!,
      name,
      isActive,
      isMvno,
      mvnoNoticeRequired,
      productType,
    },
  };
}

export async function createBenefitProductAction(
  _prevState: BenefitProductFormState,
  formData: FormData,
): Promise<BenefitProductFormState> {
  const validated = await validateBenefitProductForm(formData);

  if (!validated.ok) {
    return validated.state;
  }

  const product = validated.data;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("benefit_products").insert({
    benefit_category_id: product.benefitCategoryId,
    provider_id: product.providerId,
    name: product.name,
    code: generateProductCode(product.name),
    product_type: product.productType,
    is_active: product.isActive,
    is_mvno: product.isMvno,
    mvno_notice_required: product.mvnoNoticeRequired,
  });

  if (error) {
    return {
      message: `혜택상품 등록에 실패했습니다: ${error.message}`,
    };
  }

  revalidatePath("/admin/benefit-products");
  redirect("/admin/benefit-products");
}

export async function updateBenefitProductAction(
  benefitProductId: number,
  _prevState: BenefitProductFormState,
  formData: FormData,
): Promise<BenefitProductFormState> {
  if (!Number.isInteger(benefitProductId) || benefitProductId <= 0) {
    return {
      message: "올바른 혜택상품 ID가 아닙니다.",
    };
  }

  const validated = await validateBenefitProductForm(formData);

  if (!validated.ok) {
    return validated.state;
  }

  const product = validated.data;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("benefit_products")
    .update({
      benefit_category_id: product.benefitCategoryId,
      provider_id: product.providerId,
      name: product.name,
      product_type: product.productType,
      is_active: product.isActive,
      is_mvno: product.isMvno,
      mvno_notice_required: product.mvnoNoticeRequired,
    })
    .eq("id", benefitProductId);

  if (error) {
    return {
      message: `혜택상품 수정에 실패했습니다: ${error.message}`,
    };
  }

  revalidatePath("/admin/benefit-products");
  redirect("/admin/benefit-products");
}
