/**
 * 할인 ↔ 사용자 등록 혜택 매칭 (카드사 전체 / 특정 카드).
 * 특정 카드 할인은 benefit_product_id 정확 일치 시에만 매칭.
 * 전체 할인(is_all_product / benefit_type=all)은 같은 provider 내 모든 특정 카드 사용자에게 매칭.
 * 통신사 복수 등급은 discount_benefit_products / benefit_product_ids 로 연결.
 */

import { resolveDiscountBenefitProductIds } from "@/lib/benefits/discount-benefit-products";

export type BenefitProductMatchMeta = {
  id: number;
  benefit_type: string | null;
  is_all_product: boolean;
};

export type UserBenefitMatchRow = {
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_type: string | null;
  /** benefit_products 조인 결과 (없으면 null) */
  product?: BenefitProductMatchMeta | null;
};

export type DiscountMatchRow = {
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  /** junction 또는 로더에서 주입 (없으면 benefit_product_id 단일 사용) */
  benefit_product_ids?: number[] | null;
};

function normalizeBenefitType(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  return v || null;
}

export function isAllProductMeta(
  product: BenefitProductMatchMeta | null | undefined,
): boolean {
  if (!product) return false;
  return product.is_all_product === true || normalizeBenefitType(product.benefit_type) === "all";
}

export function isSpecificCardProductMeta(
  product: BenefitProductMatchMeta | null | undefined,
): boolean {
  if (!product) return false;
  return !isAllProductMeta(product);
}

export function isCardTypeWideProductMeta(
  product: BenefitProductMatchMeta | null | undefined,
): boolean {
  if (!product || isAllProductMeta(product)) return false;
  const bt = normalizeBenefitType(product.benefit_type);
  return bt === "credit" || bt === "debit";
}

/** 사용자가 카드사 전체 상품만 등록했는지 */
export function userHoldsProviderAllProduct(benefit: UserBenefitMatchRow): boolean {
  if (normalizeBenefitType(benefit.benefit_type) === "all") {
    return true;
  }
  return isAllProductMeta(benefit.product ?? null);
}

function providerScopeMatches(
  discount: DiscountMatchRow,
  benefit: UserBenefitMatchRow,
): boolean {
  return (
    discount.benefit_category_id === benefit.benefit_category_id &&
    discount.provider_id === benefit.provider_id
  );
}

function matchDiscountProductToUserBenefit(
  discountProduct: BenefitProductMatchMeta | null | undefined,
  benefit: UserBenefitMatchRow,
): boolean {
  const userAll = userHoldsProviderAllProduct(benefit);

  if (!discountProduct) {
    return false;
  }

  const discountAll = isAllProductMeta(discountProduct);

  if (userAll) {
    return discountAll;
  }

  if (discountProduct.id === benefit.benefit_product_id) {
    return true;
  }

  if (discountAll) {
    return true;
  }

  return false;
}

/**
 * 단일 (할인, 사용자혜택) 쌍 매칭.
 * discountProductIds: 할인에 연결된 benefit_products id 목록 (legacy null = provider-wide)
 */
export function matchDiscountToUserBenefit(
  discount: DiscountMatchRow,
  benefit: UserBenefitMatchRow,
  discountProduct: BenefitProductMatchMeta | null | undefined,
  discountProductIds?: number[] | null,
  productById?: Map<number, BenefitProductMatchMeta>,
): boolean {
  if (!providerScopeMatches(discount, benefit)) {
    return false;
  }

  const linkedProductIds =
    discountProductIds ??
    resolveDiscountBenefitProductIds(discount);

  // 레거시: benefit_product_id NULL + junction 없음 = 제공사 전체 할인
  if (linkedProductIds === null) {
    return true;
  }

  if (linkedProductIds.length === 0) {
    return discount.benefit_product_id == null;
  }

  if (linkedProductIds.length === 1 && productById) {
    const singleProduct =
      productById.get(linkedProductIds[0]!) ?? discountProduct ?? null;
    return matchDiscountProductToUserBenefit(singleProduct, benefit);
  }

  if (productById) {
    return linkedProductIds.some((productId) =>
      matchDiscountProductToUserBenefit(productById.get(productId), benefit),
    );
  }

  if (discountProduct) {
    return matchDiscountProductToUserBenefit(discountProduct, benefit);
  }

  return linkedProductIds.includes(benefit.benefit_product_id ?? -1);
}

export function matchDiscountToBenefits(
  discount: DiscountMatchRow,
  benefits: UserBenefitMatchRow[],
  productById: Map<number, BenefitProductMatchMeta>,
): boolean {
  const linkedProductIds = resolveDiscountBenefitProductIds(discount);

  return benefits.some((benefit) => {
    const discountProduct =
      linkedProductIds?.length === 1
        ? productById.get(linkedProductIds[0]!) ?? null
        : linkedProductIds?.length === 0 || linkedProductIds == null
          ? null
          : null;

    return matchDiscountToUserBenefit(
      discount,
      benefit,
      discountProduct,
      linkedProductIds,
      productById,
    );
  });
}

/** 등록 화면: 연결된 할인 건수 (카드) */
export function countMatchingCardDiscounts(
  benefit: UserBenefitMatchRow,
  discounts: {
    provider_id: number;
    benefit_product_id: number | null;
    benefit_product_ids?: number[] | null;
  }[],
  productById: Map<number, BenefitProductMatchMeta>,
): number {
  return discounts.filter((d) =>
    matchDiscountToUserBenefit(
      {
        benefit_category_id: benefit.benefit_category_id,
        provider_id: d.provider_id,
        benefit_product_id: d.benefit_product_id,
        benefit_product_ids: d.benefit_product_ids,
      },
      benefit,
      d.benefit_product_id == null ? null : productById.get(d.benefit_product_id),
      resolveDiscountBenefitProductIds(d),
      productById,
    ),
  ).length;
}
