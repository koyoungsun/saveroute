import type { SupabaseClient } from "@supabase/supabase-js";

import { loadDiscountBenefitProductIdsByDiscountId } from "@/lib/admin/discount-benefit-product-links";
import {
  attachBenefitProductIdsToDiscounts,
  collectUniqueBenefitProductIds,
  resolveDiscountBenefitProductIds,
} from "@/lib/benefits/discount-benefit-products";
import { isUserBenefitEligibleForMatching } from "@/lib/benefits/benefit-product-request-status";
import {
  matchDiscountToUserBenefit,
  type BenefitProductMatchMeta,
  type UserBenefitMatchRow,
} from "@/lib/search/discount-matching";
import type { PersonalizedDiscount } from "@/components/search/PersonalizedBestSections";

const telecomCategoryCodes = new Set(["telecom", "membership", "mvno"]);
const cardCategoryCodes = new Set(["card"]);

type Relation<T> = T | T[] | null;

type UserBenefitRow = UserBenefitMatchRow & {
  benefit_category: Relation<{ code: string; name: string }>;
};

type DiscountRow = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_product_ids?: number[] | null;
  title: string;
  discount_value: number | string;
  discount_unit: string;
  brand: Relation<{ name: string }>;
  provider: Relation<{ name: string }>;
};

function getRelation<T>(relation: Relation<T>) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function matchesBenefit(
  discount: DiscountRow,
  benefit: UserBenefitRow,
  productById: Map<number, BenefitProductMatchMeta>,
) {
  const linkedProductIds = resolveDiscountBenefitProductIds(discount);
  const discountProduct =
    linkedProductIds?.length === 1
      ? productById.get(linkedProductIds[0]!) ?? null
      : null;

  return matchDiscountToUserBenefit(
    discount,
    benefit,
    discountProduct,
    linkedProductIds,
    productById,
  );
}

function toPersonalizedDiscount(discount: DiscountRow): PersonalizedDiscount {
  return {
    id: discount.id,
    brandName: getRelation(discount.brand)?.name ?? "브랜드",
    title: discount.title,
    discountValue: Number(discount.discount_value) || 0,
    discountUnit: discount.discount_unit,
    providerName: getRelation(discount.provider)?.name ?? "제공사",
  };
}

function getBestDiscounts(
  discounts: DiscountRow[],
  benefits: UserBenefitRow[],
  categoryCodes: Set<string>,
  productById: Map<number, BenefitProductMatchMeta>,
) {
  const scopedBenefits = benefits.filter((benefit) => {
    const code = getRelation(benefit.benefit_category)?.code;
    return code ? categoryCodes.has(code) : false;
  });

  if (scopedBenefits.length === 0) {
    return [];
  }

  return discounts
    .filter((discount) =>
      scopedBenefits.some((benefit) => matchesBenefit(discount, benefit, productById)),
    )
    .sort((a, b) => (Number(b.discount_value) || 0) - (Number(a.discount_value) || 0))
    .slice(0, 3)
    .map(toPersonalizedDiscount);
}

export type PersonalizedBestDiscountsPayload = {
  hasBenefits: boolean;
  telecomDiscounts: PersonalizedDiscount[];
  cardDiscounts: PersonalizedDiscount[];
};

export async function loadPersonalizedBestDiscounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<PersonalizedBestDiscountsPayload> {
  const [{ data: benefitData }, { data: discountData }] = await Promise.all([
    supabase
      .from("user_benefits")
      .select(
        `
          benefit_category_id,
          provider_id,
          benefit_product_id,
          benefit_type,
          approval_status,
          benefit_category:benefit_categories(code,name),
          product:benefit_products(id,benefit_type,is_all_product)
        `,
      )
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("discounts")
      .select(
        `
          id,
          benefit_category_id,
          provider_id,
          benefit_product_id,
          title,
          discount_value,
          discount_unit,
          brand:brands(name),
          provider:providers(name)
        `,
      )
      .eq("status", "active")
      .order("discount_value", { ascending: false })
      .limit(100),
  ]);

  const userBenefits: UserBenefitRow[] = (
    (benefitData ?? []) as Array<
      Omit<UserBenefitRow, "product"> & {
        approval_status: string | null;
        product:
          | { id: number; benefit_type: string | null; is_all_product: boolean }
          | { id: number; benefit_type: string | null; is_all_product: boolean }[]
          | null;
      }
    >
  )
    .filter((row) =>
      isUserBenefitEligibleForMatching({
        benefit_product_id: row.benefit_product_id,
        approval_status: row.approval_status,
      }),
    )
    .map((row) => {
      const prod = getRelation(row.product);
      return {
        benefit_category_id: row.benefit_category_id,
        provider_id: row.provider_id,
        benefit_product_id: row.benefit_product_id,
        benefit_type: row.benefit_type,
        benefit_category: row.benefit_category,
        product: prod
          ? {
              id: prod.id,
              benefit_type: prod.benefit_type,
              is_all_product: prod.is_all_product,
            }
          : null,
      };
    });

  const activeDiscounts = attachBenefitProductIdsToDiscounts(
    (discountData ?? []) as DiscountRow[],
    await loadDiscountBenefitProductIdsByDiscountId(
      supabase,
      ((discountData ?? []) as DiscountRow[]).map((row) => row.id),
    ),
  );

  let productMatchById = new Map<number, BenefitProductMatchMeta>();
  const productIds = collectUniqueBenefitProductIds(activeDiscounts);
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("benefit_products")
      .select("id,benefit_type,is_all_product")
      .in("id", productIds);
    productMatchById = new Map(
      (products ?? []).map((p) => [
        p.id as number,
        {
          id: p.id as number,
          benefit_type: (p.benefit_type as string | null) ?? null,
          is_all_product: Boolean(p.is_all_product),
        },
      ]),
    );
  }

  return {
    hasBenefits: userBenefits.length > 0,
    telecomDiscounts: getBestDiscounts(
      activeDiscounts,
      userBenefits,
      telecomCategoryCodes,
      productMatchById,
    ),
    cardDiscounts: getBestDiscounts(
      activeDiscounts,
      userBenefits,
      cardCategoryCodes,
      productMatchById,
    ),
  };
}
