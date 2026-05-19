/**
 * 할인 ↔ 사용자 등록 혜택 매칭 (카드사 전체 / 특정 카드 / 카드유형 전체).
 */

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

/**
 * 단일 (할인, 사용자혜택) 쌍 매칭.
 * discountProduct: 할인에 연결된 benefit_products 메타 (legacy null product_id 는 undefined)
 */
export function matchDiscountToUserBenefit(
  discount: DiscountMatchRow,
  benefit: UserBenefitMatchRow,
  discountProduct: BenefitProductMatchMeta | null | undefined,
): boolean {
  if (!providerScopeMatches(discount, benefit)) {
    return false;
  }

  const userAll = userHoldsProviderAllProduct(benefit);
  const userBenefitType = normalizeBenefitType(benefit.benefit_type);

  // 레거시: benefit_product_id NULL = 카드사 전체 할인
  if (discount.benefit_product_id == null) {
    return true;
  }

  if (!discountProduct) {
    return discount.benefit_product_id === benefit.benefit_product_id;
  }

  const discountAll = isAllProductMeta(discountProduct);
  const discountTypeWide = isCardTypeWideProductMeta(discountProduct);

  if (userAll) {
    if (discount.benefit_product_id == null) {
      return true;
    }
    return discountAll;
  }

  // 특정 카드 등록
  if (discount.benefit_product_id === benefit.benefit_product_id) {
    return true;
  }

  if (discountAll) {
    return true;
  }

  if (
    discountTypeWide &&
    userBenefitType &&
    normalizeBenefitType(discountProduct.benefit_type) === userBenefitType
  ) {
    return true;
  }

  return false;
}

export function matchDiscountToBenefits(
  discount: DiscountMatchRow,
  benefits: UserBenefitMatchRow[],
  productById: Map<number, BenefitProductMatchMeta>,
): boolean {
  return benefits.some((benefit) => {
    const discountProduct =
      discount.benefit_product_id == null
        ? null
        : productById.get(discount.benefit_product_id);
    return matchDiscountToUserBenefit(discount, benefit, discountProduct);
  });
}

/** 등록 화면: 연결된 할인 건수 (카드) */
export function countMatchingCardDiscounts(
  benefit: UserBenefitMatchRow,
  discounts: { provider_id: number; benefit_product_id: number | null }[],
  productById: Map<number, BenefitProductMatchMeta>,
): number {
  return discounts.filter((d) =>
    matchDiscountToUserBenefit(
      {
        benefit_category_id: benefit.benefit_category_id,
        provider_id: d.provider_id,
        benefit_product_id: d.benefit_product_id,
      },
      benefit,
      d.benefit_product_id == null ? null : productById.get(d.benefit_product_id),
    ),
  ).length;
}
