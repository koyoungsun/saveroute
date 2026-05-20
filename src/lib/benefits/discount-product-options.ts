/** Admin 할인 폼 · benefit_product 선택 옵션 */

export type DiscountBenefitProductOption = {
  id: number;
  name: string;
  benefit_category_id: number;
  provider_id: number;
  benefit_type?: string | null;
  is_all_product?: boolean;
  product_type?: string | null;
  grade?: string | null;
};

export function isProviderWideBenefitProduct(
  product: Pick<
    DiscountBenefitProductOption,
    "is_all_product" | "benefit_type" | "product_type"
  >,
): boolean {
  return (
    product.is_all_product === true ||
    product.benefit_type === "all"
  );
}

export function isTelecomMembershipProduct(
  product: Pick<DiscountBenefitProductOption, "product_type">,
): boolean {
  return product.product_type === "telecom_membership";
}

function sortDiscountProducts(
  a: DiscountBenefitProductOption,
  b: DiscountBenefitProductOption,
): number {
  if (isProviderWideBenefitProduct(a) && !isProviderWideBenefitProduct(b)) {
    return -1;
  }
  if (!isProviderWideBenefitProduct(a) && isProviderWideBenefitProduct(b)) {
    return 1;
  }

  const gradeOrder = ["전체", "일반", "VIP", "VVIP"];
  const ai = gradeOrder.indexOf(a.grade ?? "");
  const bi = gradeOrder.indexOf(b.grade ?? "");
  const as = ai === -1 ? 99 : ai;
  const bs = bi === -1 ? 99 : bi;
  if (as !== bs) {
    return as - bs;
  }

  return a.name.localeCompare(b.name, "ko");
}

export type DiscountProductSelectGroups = {
  useOptGroups: boolean;
  allProducts: DiscountBenefitProductOption[];
  tierProducts: DiscountBenefitProductOption[];
  products: DiscountBenefitProductOption[];
};

export function buildDiscountProductSelectGroups(
  products: DiscountBenefitProductOption[],
  categoryCode: string | null,
): DiscountProductSelectGroups {
  const sorted = [...products].sort(sortDiscountProducts);

  if (categoryCode === "telecom") {
    return {
      useOptGroups: true,
      allProducts: sorted.filter(isProviderWideBenefitProduct),
      tierProducts: sorted.filter((product) => !isProviderWideBenefitProduct(product)),
      products: sorted,
    };
  }

  return {
    useOptGroups: false,
    allProducts: [],
    tierProducts: [],
    products: sorted,
  };
}

export function resolveCategoryCode(
  categoryId: string,
  categories: { id: number; code?: string }[],
): string | null {
  if (!categoryId) {
    return null;
  }

  const category = categories.find((row) => row.id === Number(categoryId));
  return category?.code ?? null;
}
