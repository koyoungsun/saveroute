import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import { isProviderWideBenefitProduct } from "@/lib/benefits/discount-product-options";

import { normalizeCardProductSearchKey } from "./card-product-name-normalize";

export { normalizeCardProductSearchKey };

export const CARD_PRODUCT_SEARCH_MIN_LENGTH = 1;

/** @deprecated normalizeCardProductSearchKey 사용 */
export function compactCardSearchKey(raw: string): string {
  return normalizeCardProductSearchKey(raw);
}

function buildCardProductSearchHaystacks(
  product: Pick<
    DiscountBenefitProductOption,
    "name" | "code" | "name_normalized"
  >,
): string[] {
  const values = [product.name, product.code, product.name_normalized];
  const haystacks = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string" || value.length === 0) {
      continue;
    }

    const normalized = normalizeCardProductSearchKey(value);
    if (normalized) {
      haystacks.add(normalized);
    }
  }

  return [...haystacks];
}

export function matchesCardProductSearch(
  product: Pick<
    DiscountBenefitProductOption,
    "name" | "code" | "name_normalized"
  >,
  query: string,
  minLength = CARD_PRODUCT_SEARCH_MIN_LENGTH,
): boolean {
  const normalizedQuery = normalizeCardProductSearchKey(query);
  if (normalizedQuery.length < minLength) {
    return false;
  }

  return buildCardProductSearchHaystacks(product).some((haystack) =>
    haystack.includes(normalizedQuery),
  );
}

export function partitionCardDiscountProducts(
  products: DiscountBenefitProductOption[],
): {
  allProducts: DiscountBenefitProductOption[];
  specificProducts: DiscountBenefitProductOption[];
} {
  const allProducts: DiscountBenefitProductOption[] = [];
  const specificProducts: DiscountBenefitProductOption[] = [];

  for (const product of products) {
    if (isProviderWideBenefitProduct(product)) {
      allProducts.push(product);
    } else {
      specificProducts.push(product);
    }
  }

  return { allProducts, specificProducts };
}

export function filterCardProductsForSearch(
  products: DiscountBenefitProductOption[],
  query: string,
): DiscountBenefitProductOption[] {
  const { allProducts, specificProducts } = partitionCardDiscountProducts(products);
  const normalizedQuery = normalizeCardProductSearchKey(query);

  if (normalizedQuery.length < CARD_PRODUCT_SEARCH_MIN_LENGTH) {
    return allProducts;
  }

  return [
    ...allProducts,
    ...specificProducts.filter((product) =>
      matchesCardProductSearch(product, query),
    ),
  ];
}
