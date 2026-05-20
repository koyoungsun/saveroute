import {
  getEffectiveDiscountValueForSort,
  formatDiscountValueDisplay,
} from "@/lib/discounts/format-discount-value";
import type {
  BenefitCategorySummary,
  BenefitProductSummary,
  DiscountResult,
  DiscountUnit,
  ProviderSummary,
} from "@/types/search";

import {
  matchDiscountToBenefits as matchDiscountToBenefitsCore,
  type BenefitProductMatchMeta,
  type UserBenefitMatchRow,
} from "./discount-matching";

export type BrandCandidateRow = {
  id: number;
  name: string;
  slug: string;
  official_url: string | null;
  is_active: boolean;
  category_id: number | null;
  aliases: string[] | null;
};

export type DiscountBaseRow = {
  id: number;
  brand_id: number;
  status: string;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_product_ids?: number[] | null;
  title: string;
  condition_text: string | null;
  notice_text: string | null;
  apply_basis: string | null;
  stackable_policy: string | null;
  usage_channel: string | null;
  installment_condition: string | null;
  discount_value: number | string;
  discount_value_max?: number | string | null;
  discount_unit: DiscountUnit;
  usage_type: string;
  is_stackable: boolean;
  stacking_note: string | null;
  source_url: string | null;
  last_checked_at: string;
  valid_until: string | null;
  has_no_expiry: boolean;
};

/** @deprecated UserBenefitMatchRow 사용 — 검색 파이프라인에서 product 메타 포함 */
export type UserBenefitRow = UserBenefitMatchRow;

export type BenefitCategoryRow = {
  id: number;
  name: string;
  code: string;
};

export type ProviderRow = {
  id: number;
  name: string;
};

export type BenefitProductRow = {
  id: number;
  name: string;
  is_mvno: boolean;
  mvno_notice_required: boolean;
  benefit_type: string | null;
  is_all_product: boolean;
};

/** 공백 축약 후 소문자·비(한글/영숫자) 제거 — 검색어·별칭 동일 기준 비교용 */
export function normalizeKeyword(keyword: string) {
  return keyword
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^가-힣a-zA-Z0-9]/g, "");
}

export function isOrderedSubsequence(needle: string, haystack: string) {
  if (!needle) return false;

  let needleIndex = 0;
  for (const character of haystack) {
    if (character === needle[needleIndex]) {
      needleIndex += 1;
      if (needleIndex === needle.length) {
        return true;
      }
    }
  }

  return false;
}

/** 넓은 alias 포함 검색(제안 API 등). 카탈로그 검색은 match-brand 티어를 사용합니다. */
export function matchesAlias(aliases: string[] | null, query: string, normalized: string) {
  return (aliases ?? []).some((alias) => {
    const aliasLower = alias.toLowerCase();
    const normalizedAlias = normalizeKeyword(alias);

    return aliasLower.includes(query.toLowerCase()) || normalizedAlias.includes(normalized);
  });
}

export function matchDiscountToBenefits(
  discount: DiscountResult,
  benefits: UserBenefitMatchRow[],
  productById: Map<number, BenefitProductMatchMeta>,
) {
  return matchDiscountToBenefitsCore(
    {
      benefit_category_id: discount.benefit_category_id,
      provider_id: discount.provider_id,
      benefit_product_id: discount.benefit_product_id,
      benefit_product_ids: discount.benefit_product_ids,
    },
    benefits,
    productById,
  );
}

export function getDiscountScore(discount: DiscountResult) {
  const value = getEffectiveDiscountValueForSort(discount);

  if (discount.discount_unit === "free") {
    return 1_000_000_000;
  }

  if (discount.discount_unit === "percent") {
    return value * 10_000;
  }

  if (discount.discount_unit === "won" || discount.discount_unit === "amount") {
    return value;
  }

  if (discount.discount_unit === "special_price") {
    return Math.max(0, 100_000 - value);
  }

  return value;
}

/** 할인 강도 내림차순 (동점 시 discount_value 숫자 비교) */
export function sortDiscountsByRate(desc: DiscountResult[]) {
  return [...desc].sort((a, b) => {
    const scoreDiff = getDiscountScore(b) - getDiscountScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      getEffectiveDiscountValueForSort(b) - getEffectiveDiscountValueForSort(a)
    );
  });
}

/** UI용: 내 할인 매칭 항목 우선, 그다음 할인 강도 순 */
export function sortDiscountsPrioritizeOwned(discounts: DiscountResult[], owned: Set<number>) {
  return [...discounts].sort((a, b) => {
    const ownedDiff = Number(owned.has(b.id)) - Number(owned.has(a.id));
    if (ownedDiff !== 0) return ownedDiff;
    const scoreDiff = getDiscountScore(b) - getDiscountScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return (
      getEffectiveDiscountValueForSort(b) - getEffectiveDiscountValueForSort(a)
    );
  });
}

export function formatDiscountValue(
  value: number | string,
  unit: DiscountUnit,
  valueMax?: number | string | null,
) {
  return formatDiscountValueDisplay({
    value,
    valueMax,
    unit,
    style: "search",
  });
}

export function formatValidUntil(discount: DiscountResult) {
  if (discount.has_no_expiry) {
    return "상시";
  }

  return discount.valid_until ? `${discount.valid_until}까지` : "기간 확인 필요";
}

export function getBenefitTypeLabel(discount: DiscountResult) {
  const code = discount.benefit_category?.code;
  const name = discount.benefit_category?.name;
  const labels: Record<string, string> = {
    card: "카드",
    telecom: "통신사",
    membership: "멤버십",
    coupon: "쿠폰",
  };

  return (code ? labels[code] : null) ?? name ?? "혜택";
}

export function rowsById<T extends { id: number }>(rows: T[] | null) {
  return new Map((rows ?? []).map((row) => [row.id, row]));
}

export function uniqueNumbers(values: (number | null)[]) {
  return Array.from(
    new Set(values.filter((value): value is number => typeof value === "number")),
  );
}

export function toBenefitProductMatchMeta(
  row: BenefitProductRow | undefined,
): BenefitProductMatchMeta | undefined {
  if (!row) return undefined;
  return {
    id: row.id,
    benefit_type: row.benefit_type,
    is_all_product: row.is_all_product,
  };
}

export function mapBaseDiscountToResult(
  row: DiscountBaseRow,
  benefitCategoryById: Map<number, BenefitCategoryRow>,
  providerById: Map<number, ProviderRow>,
  benefitProductById: Map<number, BenefitProductRow>,
): DiscountResult {
  const bc = benefitCategoryById.get(row.benefit_category_id);
  const pr = providerById.get(row.provider_id);
  const primaryProductId =
    row.benefit_product_ids && row.benefit_product_ids.length > 0
      ? row.benefit_product_ids[0]!
      : row.benefit_product_id;
  const bp =
    primaryProductId == null ? null : benefitProductById.get(primaryProductId);

  const benefit_category: BenefitCategorySummary | null = bc
    ? { id: bc.id, name: bc.name, code: bc.code }
    : null;
  const provider: ProviderSummary | null = pr ? { id: pr.id, name: pr.name } : null;
  const benefit_product: BenefitProductSummary | null = bp
    ? {
        id: bp.id,
        name: bp.name,
        is_mvno: bp.is_mvno,
        mvno_notice_required: bp.mvno_notice_required,
        is_all_product: bp.is_all_product,
        benefit_type: bp.benefit_type,
      }
    : null;

  return {
    id: row.id,
    brand_id: row.brand_id,
    title: row.title,
    condition_text: row.condition_text,
    notice_text: row.notice_text,
    apply_basis: row.apply_basis,
    stackable_policy: row.stackable_policy,
    usage_channel: row.usage_channel,
    installment_condition: row.installment_condition,
    discount_value: row.discount_value,
    discount_value_max: row.discount_value_max,
    discount_unit: row.discount_unit,
    usage_type: row.usage_type,
    benefit_category_id: row.benefit_category_id,
    provider_id: row.provider_id,
    benefit_product_id: row.benefit_product_id,
    benefit_product_ids: row.benefit_product_ids,
    valid_until: row.valid_until,
    has_no_expiry: row.has_no_expiry,
    benefit_category,
    provider,
    benefit_product,
  };
}
