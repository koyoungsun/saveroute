import {
  formatApplyBasisLabel,
  formatStackablePolicyLabel,
  formatUsageChannelLabel,
} from "@/lib/discounts/discount-detail-fields";
import { getPointBenefitInfo } from "@/lib/search/format-point-benefit-info";
import { formatValidUntil } from "@/lib/search/helpers";
import type { DiscountResult } from "@/types/search";

export type SearchResultDetailRow = {
  label: string;
  value: string;
  preWrap?: boolean;
};

function normalizeDetailValue(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function overlapsPointLines(value: string, pointLines: string[]) {
  const normalized = normalizeDetailValue(value);
  if (!normalized) {
    return true;
  }

  return pointLines.some((line) => {
    const lineNorm = normalizeDetailValue(line);
    if (!lineNorm) {
      return false;
    }

    return (
      normalized === lineNorm ||
      normalized.includes(lineNorm) ||
      lineNorm.includes(normalized)
    );
  });
}

type BuildSearchResultDetailRowsInput = {
  discount: DiscountResult;
  inPointSection: boolean;
  matchesUserBenefit: boolean;
  benefitProductLabel: string | null;
  showBenefitProductInDetails: boolean;
};

export function buildSearchResultDetailRows({
  discount,
  inPointSection,
  matchesUserBenefit,
  benefitProductLabel,
  showBenefitProductInDetails,
}: BuildSearchResultDetailRowsInput): SearchResultDetailRow[] {
  const rows: SearchResultDetailRow[] = [];
  const seenValues = new Set<string>();

  const pointInfo = inPointSection ? getPointBenefitInfo(discount) : null;
  const pointLines = pointInfo
    ? [...pointInfo.accrualLines, ...pointInfo.usageLines]
    : [];

  const addRow = (
    label: string,
    value: string | null | undefined,
    preWrap = false,
  ) => {
    const trimmed = value?.trim();
    if (!trimmed) {
      return;
    }

    const normalized = normalizeDetailValue(trimmed);
    if (seenValues.has(normalized)) {
      return;
    }

    if (inPointSection && overlapsPointLines(trimmed, pointLines)) {
      return;
    }

    seenValues.add(normalized);
    rows.push({ label, value: trimmed, preWrap });
  };

  if (matchesUserBenefit) {
    addRow("내 혜택", "내 할인 가능");
  }

  if (showBenefitProductInDetails) {
    addRow("혜택 상품", benefitProductLabel);
  }

  addRow("기간", formatValidUntil(discount));

  if (!(inPointSection && pointLines.length > 0)) {
    addRow("조건 요약", discount.condition_text, true);
  } else if (
    discount.condition_text?.trim() &&
    !overlapsPointLines(discount.condition_text, pointLines)
  ) {
    addRow("조건 요약", discount.condition_text, true);
  }

  addRow("사용 방법", formatUsageChannelLabel(discount.usage_channel));
  addRow("적용 기준", formatApplyBasisLabel(discount.apply_basis));
  addRow("중복 정책", formatStackablePolicyLabel(discount.stackable_policy));
  addRow("결제 조건", discount.installment_condition, true);
  addRow("유의사항", discount.notice_text, true);

  return rows;
}
