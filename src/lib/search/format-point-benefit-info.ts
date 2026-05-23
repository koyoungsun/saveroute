import { hasDiscountValueRange } from "@/lib/discounts/format-discount-value";
import type { DiscountResult } from "@/types/search";

export function isPointRelatedDiscountUnit(unit: string): boolean {
  return unit === "point_percent" || unit === "point";
}

export function supportsPaymentDiscountEstimate(unit: string): boolean {
  return unit === "percent" || unit === "won" || unit === "amount";
}

export type PointBenefitInfo = {
  accrualLines: string[];
  usageLines: string[];
};

function formatAccrualLine(discount: DiscountResult): string | null {
  if (discount.discount_unit !== "point_percent") {
    return null;
  }

  const min = Number(discount.discount_value) || 0;
  const max = hasDiscountValueRange(discount.discount_value_max)
    ? Number(discount.discount_value_max)
    : null;

  if (min <= 0 && (max == null || max <= 0)) {
    return null;
  }

  if (max != null && max > min) {
    return `${min}% ~ ${max}% 적립`;
  }

  if (min > 0) {
    return `${min}% 적립`;
  }

  if (max != null && max > 0) {
    return `최대 ${max}% 적립`;
  }

  return null;
}

function extractPointUsageLines(
  ...texts: Array<string | null | undefined>
): string[] {
  const results = new Set<string>();

  for (const text of texts) {
    if (!text?.trim()) {
      continue;
    }

    const maxPointMatch = text.match(/최대\s*([\d,]+)\s*P\s*사용\s*가능/i);
    if (maxPointMatch) {
      results.add(`최대 ${maxPointMatch[1]}P 사용 가능`);
    }

    const lineMatches = text.match(
      /[^\n]+?(?:포인트|[\d,]+P)[^\n]*?(?:사용|차감)[^\n]*/gi,
    );

    if (lineMatches) {
      for (const line of lineMatches) {
        const cleaned = line.replace(/^[\s•\-*]+/, "").trim();
        if (cleaned.length > 0 && cleaned.length <= 80) {
          results.add(cleaned);
        }
      }
    }
  }

  return Array.from(results);
}

export function getPointBenefitInfo(discount: DiscountResult): PointBenefitInfo | null {
  if (!isPointRelatedDiscountUnit(discount.discount_unit)) {
    return null;
  }

  const accrualLines: string[] = [];
  const usageLines: string[] = [];

  const accrualLine = formatAccrualLine(discount);
  if (accrualLine) {
    accrualLines.push(accrualLine);
  }

  usageLines.push(
    ...extractPointUsageLines(
      discount.condition_text,
      discount.notice_text,
      discount.installment_condition,
    ),
  );

  if (accrualLines.length === 0 && usageLines.length === 0) {
    return null;
  }

  return { accrualLines, usageLines };
}
