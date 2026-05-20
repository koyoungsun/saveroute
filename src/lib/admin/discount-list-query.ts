export const DISCOUNT_SORT_OPTIONS = [
  { value: "newest", label: "최신 등록순" },
  { value: "oldest", label: "오래된 등록순" },
  { value: "brand_asc", label: "브랜드명 가나다순" },
  { value: "value_desc", label: "할인값 높은순" },
  { value: "value_asc", label: "할인값 낮은순" },
  { value: "status_asc", label: "상태별" },
] as const;

export type DiscountSort = (typeof DISCOUNT_SORT_OPTIONS)[number]["value"];

const VALID_SORTS = new Set<string>(DISCOUNT_SORT_OPTIONS.map((option) => option.value));

export type DiscountListSearchParams = {
  sort?: string;
  brand?: string;
  q?: string;
};

export type ParsedDiscountListQuery = {
  sort: DiscountSort;
  brandSlug: string;
  q: string;
};

export function parseDiscountListQuery(
  params: DiscountListSearchParams,
): ParsedDiscountListQuery {
  const sortCandidate = (params.sort ?? "").trim();
  const sort = VALID_SORTS.has(sortCandidate)
    ? (sortCandidate as DiscountSort)
    : "newest";

  return {
    sort,
    brandSlug: (params.brand ?? "").trim(),
    q: (params.q ?? "").trim(),
  };
}

export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type DiscountListBrandRelation =
  | { name: string; slug: string }
  | { name: string; slug: string }[]
  | null;

export type DiscountListRow = {
  id: number;
  title: string;
  discount_value: number | string;
  discount_unit: string;
  usage_type: string;
  status: string;
  data_confidence: "high" | "medium" | "low";
  valid_until: string | null;
  created_at: string;
  brand: DiscountListBrandRelation;
  benefit_category: { name: string } | { name: string }[] | null;
  provider: { name: string } | { name: string }[] | null;
  benefit_product: { name: string } | { name: string }[] | null;
};

export function getDiscountRelationName(
  relation: { name: string } | { name: string }[] | null,
): string {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "-";
  }

  return relation?.name ?? "-";
}

export function getDiscountBrandMeta(discount: DiscountListRow): {
  name: string;
  slug: string;
} {
  const brand = discount.brand;
  if (Array.isArray(brand)) {
    return {
      name: brand[0]?.name ?? "-",
      slug: brand[0]?.slug ?? "",
    };
  }

  return {
    name: brand?.name ?? "-",
    slug: brand?.slug ?? "",
  };
}

export function sortDiscountListRows(
  rows: DiscountListRow[],
  sort: DiscountSort,
): DiscountListRow[] {
  const copy = [...rows];

  switch (sort) {
    case "oldest":
      return copy.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    case "brand_asc":
      return copy.sort((a, b) =>
        getDiscountBrandMeta(a).name.localeCompare(getDiscountBrandMeta(b).name, "ko"),
      );
    case "value_desc":
      return copy.sort(
        (a, b) => (Number(b.discount_value) || 0) - (Number(a.discount_value) || 0),
      );
    case "value_asc":
      return copy.sort(
        (a, b) => (Number(a.discount_value) || 0) - (Number(b.discount_value) || 0),
      );
    case "status_asc":
      return copy.sort((a, b) => a.status.localeCompare(b.status, "ko"));
    case "newest":
    default:
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }
}

export function buildDiscountListHref(params: {
  sort?: string;
  brand?: string;
  q?: string;
}): string {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.brand) {
    search.set("brand", params.brand);
  }
  if (params.sort && params.sort !== "newest") {
    search.set("sort", params.sort);
  }

  const query = search.toString();
  return query ? `/admin/discounts?${query}` : "/admin/discounts";
}
