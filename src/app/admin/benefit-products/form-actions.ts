"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  MEMBERSHIP_ALL_BENEFIT_TYPE,
  MEMBERSHIP_ALL_GRADE,
  MEMBERSHIP_PRODUCT_TYPE,
  buildMembershipAllProductCode,
  buildMembershipAllProductName,
  ensureMembershipAllProduct,
  isMembershipCatalogProvider,
} from "@/lib/benefits/membership-catalog";

type ProductType =
  | "telecom_membership"
  | "telecom_mvno_plan"
  | "credit_card"
  | "debit_card"
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
  | "mvno_notice_required"
  | "benefit_type"
  | "is_all_product";

type CardBenefitType = "credit" | "debit" | "prepaid" | "all";

type ValidatedProductInput = {
  benefitCategoryId: number;
  providerId: number;
  name: string;
  code: string;
  isActive: boolean;
  isMvno: boolean;
  mvnoNoticeRequired: boolean;
  productType: ProductType;
  benefitType: CardBenefitType | null;
  cardType: string | null;
  isAllProduct: boolean;
  grade: string | null;
};

export type BenefitProductFormState = {
  message?: string;
  fieldErrors?: Partial<Record<FieldName, string>>;
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

function resolveMembershipProductFields({
  categoryCode,
  providerType,
  providerCode,
  providerName,
  name,
}: {
  categoryCode: string;
  providerType: ProviderType;
  providerCode: string;
  providerName: string;
  name: string;
}):
  | {
      ok: true;
      productType: ProductType;
      benefitType: CardBenefitType;
      cardType: string | null;
      isAllProduct: boolean;
      grade: string;
      code: string;
      resolvedName: string;
      isMvno: boolean;
      mvnoNoticeRequired: boolean;
    }
  | { ok: false; fieldErrors: BenefitProductFormState["fieldErrors"] } {
  if (categoryCode !== "membership") {
    return {
      ok: false,
      fieldErrors: {
        benefit_category_id: "membership 카테고리에서만 membership 상품을 등록할 수 있습니다.",
      },
    };
  }

  if (
    !isMembershipCatalogProvider({
      categoryCode,
      providerType,
    })
  ) {
    return {
      ok: false,
      fieldErrors: {
        provider_id: "membership 상품은 membership_company 제공사에만 연결할 수 있습니다.",
      },
    };
  }

  const resolvedName = name.trim() || buildMembershipAllProductName(providerName);

  return {
    ok: true,
    productType: MEMBERSHIP_PRODUCT_TYPE,
    benefitType: MEMBERSHIP_ALL_BENEFIT_TYPE,
    cardType: null,
    isAllProduct: true,
    grade: MEMBERSHIP_ALL_GRADE,
    code: buildMembershipAllProductCode(providerCode),
    resolvedName,
    isMvno: false,
    mvnoNoticeRequired: false,
  };
}

function resolveCardProductFields({
  categoryCode,
  isAllProduct,
  benefitTypeRaw,
}: {
  categoryCode: string;
  isAllProduct: boolean;
  benefitTypeRaw: string;
}):
  | {
      ok: true;
      productType: ProductType;
      benefitType: CardBenefitType | null;
      cardType: string | null;
      isAllProduct: boolean;
    }
  | { ok: false; fieldErrors: BenefitProductFormState["fieldErrors"] } {
  if (categoryCode !== "card") {
    return {
      ok: true,
      productType: "credit_card",
      benefitType: null,
      cardType: null,
      isAllProduct: false,
    };
  }

  if (isAllProduct) {
    return {
      ok: true,
      productType: "credit_card",
      benefitType: "all",
      cardType: "unknown",
      isAllProduct: true,
    };
  }

  if (!benefitTypeRaw) {
    return {
      ok: true,
      productType: "credit_card",
      benefitType: null,
      cardType: null,
      isAllProduct: false,
    };
  }

  if (
    benefitTypeRaw !== "credit" &&
    benefitTypeRaw !== "debit" &&
    benefitTypeRaw !== "prepaid"
  ) {
    return {
      ok: false,
      fieldErrors: {
        benefit_type: "카드 혜택 유형을 선택해 주세요.",
      },
    };
  }

  return {
    ok: true,
    productType: benefitTypeRaw === "debit" ? "debit_card" : "credit_card",
    benefitType: benefitTypeRaw,
    cardType: benefitTypeRaw,
    isAllProduct: false,
  };
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

  const isAllProduct = formData.get("is_all_product") === "on";
  const benefitTypeRaw = readString(formData, "benefit_type");

  const fieldErrors: BenefitProductFormState["fieldErrors"] = {};
  const benefitCategoryId = readPositiveInteger(benefitCategoryIdValue);
  const providerId = readPositiveInteger(providerIdValue);

  if (!benefitCategoryId) {
    fieldErrors.benefit_category_id = "혜택 카테고리를 선택해 주세요.";
  }

  if (!providerId) {
    fieldErrors.provider_id = "제공사를 선택해 주세요.";
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
      .select("benefit_category_id,provider_type,code,name")
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

  if (!name && category.code !== "membership") {
    return {
      ok: false,
      state: {
        fieldErrors: {
          name: "상품명을 입력해 주세요.",
        },
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

  if (!productType && category.code !== "card") {
    return {
      ok: false,
      state: {
        fieldErrors: {
          benefit_category_id: "지원하는 혜택상품 카테고리를 선택해 주세요.",
        },
      },
    };
  }

  if (category.code === "membership") {
    const membershipFields = resolveMembershipProductFields({
      categoryCode: category.code,
      providerType: provider.provider_type as ProviderType,
      providerCode: String(provider.code),
      providerName: String(provider.name),
      name,
    });

    if (!membershipFields.ok) {
      return { ok: false, state: { fieldErrors: membershipFields.fieldErrors } };
    }

    return {
      ok: true,
      data: {
        benefitCategoryId: benefitCategoryId!,
        providerId: providerId!,
        name: membershipFields.resolvedName,
        code: membershipFields.code,
        isActive,
        isMvno: membershipFields.isMvno,
        mvnoNoticeRequired: membershipFields.mvnoNoticeRequired,
        productType: membershipFields.productType,
        benefitType: membershipFields.benefitType,
        cardType: membershipFields.cardType,
        isAllProduct: membershipFields.isAllProduct,
        grade: membershipFields.grade,
      },
    };
  }

  const cardFields = resolveCardProductFields({
    categoryCode: category.code,
    isAllProduct,
    benefitTypeRaw,
  });

  if (!cardFields.ok) {
    return { ok: false, state: { fieldErrors: cardFields.fieldErrors } };
  }

  const resolvedProductType =
    category.code === "card" ? cardFields.productType : productType!;

  return {
    ok: true,
    data: {
      benefitCategoryId: benefitCategoryId!,
      providerId: providerId!,
      name,
      code: generateProductCode(name),
      isActive,
      isMvno,
      mvnoNoticeRequired,
      productType: resolvedProductType,
      benefitType: cardFields.benefitType,
      cardType: cardFields.cardType,
      isAllProduct: cardFields.isAllProduct,
      grade: null,
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

  if (product.productType === MEMBERSHIP_PRODUCT_TYPE) {
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("code,name")
      .eq("id", product.providerId)
      .maybeSingle();

    if (providerError || !provider) {
      return {
        fieldErrors: {
          provider_id: "제공사 정보를 확인할 수 없습니다.",
        },
        message: providerError?.message,
      };
    }

    try {
      await ensureMembershipAllProduct(supabase, {
        benefitCategoryId: product.benefitCategoryId,
        providerId: product.providerId,
        providerCode: String(provider.code),
        providerName: String(provider.name),
        isActive: product.isActive,
      });
    } catch (syncError) {
      return {
        message:
          syncError instanceof Error
            ? `멤버십 상품 저장에 실패했습니다: ${syncError.message}`
            : "멤버십 상품 저장에 실패했습니다.",
      };
    }

    revalidatePath("/admin/benefit-products");
    redirect("/admin/benefit-products");
  }

  const { error } = await supabase.from("benefit_products").insert({
    benefit_category_id: product.benefitCategoryId,
    provider_id: product.providerId,
    name: product.name,
    code: product.code,
    product_type: product.productType,
    grade: product.grade,
    card_type: product.cardType,
    benefit_type: product.benefitType,
    is_all_product: product.isAllProduct,
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

  if (product.productType === MEMBERSHIP_PRODUCT_TYPE) {
    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("code,name")
      .eq("id", product.providerId)
      .maybeSingle();

    if (providerError || !provider) {
      return {
        fieldErrors: {
          provider_id: "제공사 정보를 확인할 수 없습니다.",
        },
        message: providerError?.message,
      };
    }

    try {
      await ensureMembershipAllProduct(supabase, {
        benefitCategoryId: product.benefitCategoryId,
        providerId: product.providerId,
        providerCode: String(provider.code),
        providerName: String(provider.name),
        isActive: product.isActive,
      });
    } catch (syncError) {
      return {
        message:
          syncError instanceof Error
            ? `멤버십 상품 저장에 실패했습니다: ${syncError.message}`
            : "멤버십 상품 저장에 실패했습니다.",
      };
    }

    revalidatePath("/admin/benefit-products");
    redirect("/admin/benefit-products");
  }

  const { error } = await supabase
    .from("benefit_products")
    .update({
      benefit_category_id: product.benefitCategoryId,
      provider_id: product.providerId,
      name: product.name,
      product_type: product.productType,
      grade: product.grade,
      card_type: product.cardType,
      benefit_type: product.benefitType,
      is_all_product: product.isAllProduct,
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
