import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import { isProviderWideBenefitProduct } from "@/lib/benefits/discount-product-options";

export const CARD_PRODUCT_SEARCH_MIN_LENGTH = 1;

export function compactCardSearchKey(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export function matchesCardProductSearch(
  product: Pick<
    DiscountBenefitProductOption,
    "name" | "code" | "name_normalized"
  >,
  query: string,
  minLength = CARD_PRODUCT_SEARCH_MIN_LENGTH,
): boolean {
  const normalizedQuery = compactCardSearchKey(query);
  if (normalizedQuery.length < minLength) {
    return false;
  }

  const haystacks = [product.name, product.code, product.name_normalized]
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map(compactCardSearchKey);

  return haystacks.some((haystack) => haystack.includes(normalizedQuery));
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
  const normalizedQuery = compactCardSearchKey(query);

  if (normalizedQuery.length < CARD_PRODUCT_SEARCH_MIN_LENGTH) {
    return allProducts;
  }

  return [
    ...allProducts,
    ...specificProducts.filter((product) =>
      matchesCardProductSearch(product, normalizedQuery),
    ),
  ];
}
