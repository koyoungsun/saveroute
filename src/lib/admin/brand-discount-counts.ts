export type ActiveDiscountBrandRow = {
  brand_id: number;
  status?: string | null;
  is_active?: boolean | null;
};

export function isActiveDiscountRecord(
  row: Pick<ActiveDiscountBrandRow, "status" | "is_active">,
): boolean {
  if (row.is_active === true) {
    return true;
  }

  return row.status === "active";
}

export function buildDiscountCountByBrandId(
  rows: ActiveDiscountBrandRow[],
): Map<number, number> {
  const map = new Map<number, number>();

  for (const row of rows) {
    if (!isActiveDiscountRecord(row)) {
      continue;
    }

    map.set(row.brand_id, (map.get(row.brand_id) ?? 0) + 1);
  }

  return map;
}

export function getBrandDiscountCount(
  brandId: number,
  countByBrandId: Map<number, number>,
): number {
  return countByBrandId.get(brandId) ?? 0;
}

export const BRAND_LIST_SORT_OPTIONS = [
  { value: "newest", label: "등록일 최신순" },
  { value: "discount_desc", label: "연결 할인 많은 순" },
  { value: "discount_asc", label: "연결 할인 적은 순" },
] as const;

export type BrandListSort = (typeof BRAND_LIST_SORT_OPTIONS)[number]["value"];

const VALID_SORTS = new Set<string>(BRAND_LIST_SORT_OPTIONS.map((option) => option.value));

export function parseBrandListSort(value: string | undefined): BrandListSort {
  const candidate = (value ?? "").trim();
  return VALID_SORTS.has(candidate) ? (candidate as BrandListSort) : "newest";
}

export function sortBrandRows<T extends { id: number }>(
  brands: T[],
  sort: BrandListSort,
  countByBrandId: Map<number, number>,
): T[] {
  if (sort === "newest") {
    return brands;
  }

  const copy = [...brands];

  if (sort === "discount_desc") {
    return copy.sort((a, b) => {
      const diff =
        getBrandDiscountCount(b.id, countByBrandId) -
        getBrandDiscountCount(a.id, countByBrandId);
      return diff !== 0 ? diff : a.id - b.id;
    });
  }

  return copy.sort((a, b) => {
    const diff =
      getBrandDiscountCount(a.id, countByBrandId) -
      getBrandDiscountCount(b.id, countByBrandId);
    return diff !== 0 ? diff : a.id - b.id;
  });
}

export type BrandDiscountCountBadgeVariant = "zero" | "few" | "many";

export function getBrandDiscountCountBadgeVariant(
  count: number,
): BrandDiscountCountBadgeVariant {
  if (count <= 0) {
    return "zero";
  }

  if (count <= 10) {
    return "few";
  }

  return "many";
}
