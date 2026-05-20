import { getEffectiveDiscountValueForSort } from "@/lib/discounts/format-discount-value";

export const DISCOUNT_SORT_OPTIONS = [

  { value: "newest", label: "작성일 최신순" },

  { value: "oldest", label: "작성일 오래된순" },

  { value: "updated_desc", label: "수정일 최신순" },

  { value: "updated_asc", label: "수정일 오래된순" },

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

  discount_value_max?: number | string | null;

  discount_unit: string;

  usage_type: string;

  usage_channel: string | null;

  status: string;

  data_confidence: "high" | "medium" | "low";

  valid_until: string | null;

  created_at: string;

  updated_at: string;

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



export function formatAdminDiscountTimestamp(value: string | null | undefined): string {

  if (!value) {

    return "-";

  }



  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {

    return value.slice(0, 16).replace("T", " ");

  }



  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");

  const minutes = String(date.getMinutes()).padStart(2, "0");



  return `${year}-${month}-${day} ${hours}:${minutes}`;

}



function compareTimestamps(left: string, right: string, order: "asc" | "desc"): number {

  const diff = new Date(left).getTime() - new Date(right).getTime();

  return order === "desc" ? -diff : diff;

}



export function sortDiscountListRows(

  rows: DiscountListRow[],

  sort: DiscountSort,

): DiscountListRow[] {

  const copy = [...rows];



  switch (sort) {

    case "oldest":

      return copy.sort((a, b) => compareTimestamps(a.created_at, b.created_at, "asc"));

    case "updated_desc":

      return copy.sort((a, b) => compareTimestamps(a.updated_at, b.updated_at, "desc"));

    case "updated_asc":

      return copy.sort((a, b) => compareTimestamps(a.updated_at, b.updated_at, "asc"));

    case "brand_asc":

      return copy.sort((a, b) =>

        getDiscountBrandMeta(a).name.localeCompare(getDiscountBrandMeta(b).name, "ko"),

      );

    case "value_desc":

      return copy.sort(
        (a, b) =>
          getEffectiveDiscountValueForSort(b) - getEffectiveDiscountValueForSort(a),
      );

    case "value_asc":

      return copy.sort(
        (a, b) =>
          getEffectiveDiscountValueForSort(a) - getEffectiveDiscountValueForSort(b),
      );

    case "status_asc":

      return copy.sort((a, b) => a.status.localeCompare(b.status, "ko"));

    case "newest":

    default:

      return copy.sort((a, b) => compareTimestamps(a.created_at, b.created_at, "desc"));

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



export function formatDiscountBenefitProductNames(names: string[]): string {

  const cleaned = names.filter((name) => name.trim().length > 0);

  if (cleaned.length === 0) {

    return "-";

  }

  if (cleaned.length === 1) {

    return cleaned[0]!;

  }

  return `${cleaned[0]!} 외 ${cleaned.length - 1}개`;

}


