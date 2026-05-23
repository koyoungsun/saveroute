"use client";

import { getPointBenefitInfo } from "@/lib/search/format-point-benefit-info";
import type { DiscountResult } from "@/types/search";

type PointBenefitInfoSectionProps = {
  discount: DiscountResult;
};

export function PointBenefitInfoSection({ discount }: PointBenefitInfoSectionProps) {
  const pointInfo = getPointBenefitInfo(discount);

  if (!pointInfo) {
    return null;
  }

  const lines = [...pointInfo.accrualLines, ...pointInfo.usageLines];

  return (
    <section className="sr-user-point-benefit-info" aria-label="포인트 정보">
      <p className="sr-user-point-benefit-info__title">포인트 정보</p>

      <ul className="sr-user-point-benefit-info__list">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <p className="sr-user-point-benefit-info__notice">
        실제 포인트 사용/적립은 제휴 조건에 따라 달라질 수 있습니다.
      </p>
    </section>
  );
}
