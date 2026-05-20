import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeCardBenefitProductIds,
  normalizeTelecomBenefitProductIds,
  readBenefitProductIdsFromFormData,
  resolvePrimaryBenefitProductId,
  type BenefitProductMatchMeta,
} from "@/lib/benefits/discount-benefit-products";

type BenefitProductValidationRow = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_type: string | null;
  is_all_product: boolean;
};

export type ParsedDiscountBenefitProducts = {
  normalizedIds: number[];
  primaryBenefitProductId: number | null;
  useJunctionTable: boolean;
  productById: Map<number, BenefitProductMatchMeta>;
};

export async function parseDiscountBenefitProductsFromForm(
  supabase: SupabaseClient,
  formData: FormData,
  benefitCategoryId: number,
  providerId: number,
): Promise<
  | { ok: true; value: ParsedDiscountBenefitProducts }
  | { ok: false; message: string }
> {
  const { data: category, error: categoryError } = await supabase
    .from("benefit_categories")
    .select("code")
    .eq("id", benefitCategoryId)
    .maybeSingle();

  if (categoryError || !category) {
    return { ok: false, message: "혜택 카테고리를 확인할 수 없습니다." };
  }

  const requestedIds = readBenefitProductIdsFromFormData(formData);
  if (requestedIds.length === 0) {
    return {
      ok: true,
      value: {
        normalizedIds: [],
        primaryBenefitProductId: null,
        useJunctionTable: false,
        productById: new Map(),
      },
    };
  }

  const { data: products, error: productsError } = await supabase
    .from("benefit_products")
    .select("id,benefit_category_id,provider_id,benefit_type,is_all_product")
    .in("id", requestedIds)
    .eq("is_active", true);

  if (productsError) {
    return { ok: false, message: productsError.message };
  }

  const rows = (products ?? []) as BenefitProductValidationRow[];
  if (rows.length !== requestedIds.length) {
    return { ok: false, message: "활성 혜택상품을 선택해 주세요." };
  }

  for (const product of rows) {
    if (
      product.benefit_category_id !== benefitCategoryId ||
      product.provider_id !== providerId
    ) {
      return {
        ok: false,
        message: "선택한 카테고리와 제공사에 속한 혜택상품을 선택해 주세요.",
      };
    }
  }

  const productById = new Map<number, BenefitProductMatchMeta>(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        benefit_type: row.benefit_type,
        is_all_product: row.is_all_product,
      },
    ]),
  );

  if (category.code === "telecom") {
    const normalizedIds = normalizeTelecomBenefitProductIds(requestedIds, productById);
    const useJunctionTable = normalizedIds.length > 1;

    return {
      ok: true,
      value: {
        normalizedIds,
        primaryBenefitProductId: resolvePrimaryBenefitProductId(normalizedIds),
        useJunctionTable,
        productById,
      },
    };
  }

  if (category.code === "card") {
    const normalizedIds = normalizeCardBenefitProductIds(requestedIds);
    const useJunctionTable = normalizedIds.length > 1;

    return {
      ok: true,
      value: {
        normalizedIds,
        primaryBenefitProductId: resolvePrimaryBenefitProductId(normalizedIds),
        useJunctionTable,
        productById,
      },
    };
  }

  if (requestedIds.length > 1) {
    return {
      ok: false,
      message: "멤버십/쿠폰 등 기타 카테고리는 혜택상품을 하나만 선택할 수 있습니다.",
    };
  }

  return {
    ok: true,
    value: {
      normalizedIds: requestedIds,
      primaryBenefitProductId: resolvePrimaryBenefitProductId(requestedIds),
      useJunctionTable: false,
      productById,
    },
  };
}

export async function syncDiscountBenefitProductLinks(
  supabase: SupabaseClient,
  discountId: number,
  parsed: ParsedDiscountBenefitProducts,
) {
  const { error: deleteError } = await supabase
    .from("discount_benefit_products")
    .delete()
    .eq("discount_id", discountId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!parsed.useJunctionTable || parsed.normalizedIds.length <= 1) {
    return;
  }

  const { error: insertError } = await supabase.from("discount_benefit_products").insert(
    parsed.normalizedIds.map((benefitProductId) => ({
      discount_id: discountId,
      benefit_product_id: benefitProductId,
    })),
  );

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function loadDiscountBenefitProductIdsByDiscountId(
  supabase: SupabaseClient,
  discountIds: number[],
): Promise<Map<number, number[]>> {
  if (discountIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("discount_benefit_products")
    .select("discount_id,benefit_product_id")
    .in("discount_id", discountIds);

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.message.includes("discount_benefit_products")
    ) {
      return new Map();
    }

    throw new Error(error.message);
  }

  const grouped = new Map<number, number[]>();
  for (const row of data ?? []) {
    const discountId = row.discount_id as number;
    const benefitProductId = row.benefit_product_id as number;
    const existing = grouped.get(discountId) ?? [];
    existing.push(benefitProductId);
    grouped.set(discountId, existing);
  }

  return grouped;
}
