import { isPointRelatedDiscountUnit } from "@/lib/search/format-point-benefit-info";
import type { DiscountResult } from "@/types/search";

export type SearchResultCardAccent = "card" | "telecom" | "membership" | "point";

export function isPointBenefitDiscount(discount: DiscountResult): boolean {
  if (isPointRelatedDiscountUnit(discount.discount_unit)) {
    return true;
  }

  const title = discount.title ?? "";
  const condition = discount.condition_text ?? "";
  const combined = `${title} ${condition}`;

  if (/포인트\s*(적립|사용)/.test(combined) && !supportsImmediateDiscountUnit(discount.discount_unit)) {
    return true;
  }

  return false;
}

function supportsImmediateDiscountUnit(unit: string): boolean {
  return (
    unit === "percent" ||
    unit === "won" ||
    unit === "amount" ||
    unit === "per_amount" ||
    unit === "special_price"
  );
}

export function splitSearchResultDiscounts(discounts: DiscountResult[]) {
  const immediateDiscounts: DiscountResult[] = [];
  const pointBenefits: DiscountResult[] = [];

  for (const discount of discounts) {
    if (isPointBenefitDiscount(discount)) {
      pointBenefits.push(discount);
    } else {
      immediateDiscounts.push(discount);
    }
  }

  return { immediateDiscounts, pointBenefits };
}

export function getSearchResultCardAccent(
  discount: DiscountResult,
  inPointSection = false,
): SearchResultCardAccent {
  if (inPointSection || isPointRelatedDiscountUnit(discount.discount_unit)) {
    return "point";
  }

  const code = discount.benefit_category?.code;

  if (code === "telecom") {
    return "telecom";
  }

  if (code === "membership") {
    return "membership";
  }

  return "card";
}

export function getSearchResultAccentLabel(accent: SearchResultCardAccent): string {
  switch (accent) {
    case "telecom":
      return "통신";
    case "membership":
      return "멤버십";
    case "point":
      return "포인트";
    default:
      return "카드";
  }
}
