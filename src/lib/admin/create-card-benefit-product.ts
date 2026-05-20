import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";

export type CardBenefitType = "credit" | "debit";

export type CreateCardBenefitProductInput = {
  benefitCategoryId: number;
  providerId: number;
  name: string;
  benefitType: CardBenefitType;
  isActive?: boolean;
  code?: string;
};

export type CreateCardBenefitProductResult =
  | {
      ok: true;
      product: DiscountBenefitProductOption;
      created: boolean;
    }
  | {
      ok: false;
      reason: "duplicate";
      existingProduct: DiscountBenefitProductOption;
      message: string;
    }
  | {
      ok: false;
      reason: "validation" | "error";
      message: string;
    };

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function generateCardBenefitProductCode(name: string) {
  const base = slugify(name) || "card_product";
  return `${base}_${randomUUID().slice(0, 8)}`;
}

export function resolveInlineCardProductFields(benefitType: CardBenefitType) {
  return {
    productType: benefitType === "debit" ? "debit_card" : "credit_card",
    benefitType,
    cardType: benefitType,
    isAllProduct: false,
    grade: null as string | null,
  };
}

const CARD_PRODUCT_SELECT =
  "id,name,benefit_category_id,provider_id,benefit_type,is_all_product,product_type,grade,code,name_normalized";

function mapCardBenefitProductRow(
  row: Record<string, unknown>,
): DiscountBenefitProductOption {
  return {
    id: row.id as number,
    name: row.name as string,
    benefit_category_id: row.benefit_category_id as number,
    provider_id: row.provider_id as number,
    benefit_type: (row.benefit_type as string | null) ?? null,
    is_all_product: Boolean(row.is_all_product),
    product_type: (row.product_type as string | null) ?? null,
    grade: (row.grade as string | null) ?? null,
    code: (row.code as string | null) ?? null,
    name_normalized: (row.name_normalized as string | null) ?? null,
  };
}

export async function findExistingCardBenefitProduct(
  supabase: SupabaseClient,
  providerId: number,
  name: string,
  benefitType: CardBenefitType,
): Promise<DiscountBenefitProductOption | null> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  const { data, error } = await supabase
    .from("benefit_products")
    .select(CARD_PRODUCT_SELECT)
    .eq("provider_id", providerId)
    .eq("name", trimmedName)
    .eq("benefit_type", benefitType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapCardBenefitProductRow(data as Record<string, unknown>);
}

export async function createCardBenefitProduct(
  supabase: SupabaseClient,
  input: CreateCardBenefitProductInput,
): Promise<CreateCardBenefitProductResult> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    return {
      ok: false,
      reason: "validation",
      message: "카드명을 입력해 주세요.",
    };
  }

  const existing = await findExistingCardBenefitProduct(
    supabase,
    input.providerId,
    trimmedName,
    input.benefitType,
  );
  if (existing) {
    return {
      ok: false,
      reason: "duplicate",
      existingProduct: existing,
      message: "같은 카드사·카드명·카드 유형의 상품이 이미 있습니다. 기존 상품을 선택했습니다.",
    };
  }

  const fields = resolveInlineCardProductFields(input.benefitType);
  const code = input.code?.trim() || generateCardBenefitProductCode(trimmedName);
  const isActive = input.isActive ?? true;

  const { data, error } = await supabase
    .from("benefit_products")
    .insert({
      benefit_category_id: input.benefitCategoryId,
      provider_id: input.providerId,
      name: trimmedName,
      code,
      product_type: fields.productType,
      grade: fields.grade,
      card_type: fields.cardType,
      benefit_type: fields.benefitType,
      is_all_product: fields.isAllProduct,
      is_active: isActive,
      is_mvno: false,
      mvno_notice_required: false,
    })
    .select(CARD_PRODUCT_SELECT)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      const duplicate = await findExistingCardBenefitProduct(
        supabase,
        input.providerId,
        trimmedName,
        input.benefitType,
      );
      if (duplicate) {
        return {
          ok: false,
          reason: "duplicate",
          existingProduct: duplicate,
          message:
            "같은 카드사·카드명·카드 유형의 상품이 이미 있습니다. 기존 상품을 선택했습니다.",
        };
      }
    }

    return {
      ok: false,
      reason: "error",
      message: error?.message ?? "카드 상품 저장에 실패했습니다.",
    };
  }

  return {
    ok: true,
    product: mapCardBenefitProductRow(data as Record<string, unknown>),
    created: true,
  };
}
