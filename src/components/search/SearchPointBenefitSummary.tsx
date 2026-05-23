"use client";

import { getPointBenefitInfo } from "@/lib/search/format-point-benefit-info";
import type { DiscountResult } from "@/types/search";

type SearchPointBenefitSummaryProps = {
  discount: DiscountResult;
};

export function SearchPointBenefitSummary({ discount }: SearchPointBenefitSummaryProps) {
  const pointInfo = getPointBenefitInfo(discount);

  if (!pointInfo) {
    return null;
  }

  const lines = [...pointInfo.accrualLines, ...pointInfo.usageLines];

  if (lines.length === 0) {
    return null;
  }

  return (
    <ul className="sr-user-search-point-benefit-summary">
      {lines.map((line) => (
        <li key={line} className="sr-user-search-point-benefit-summary__item">
          {line}
        </li>
      ))}
    </ul>
  );
}
