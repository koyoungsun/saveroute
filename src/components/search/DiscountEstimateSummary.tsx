"use client";

import { useMemo } from "react";

import { calculateDiscountEstimate } from "@/lib/search/calculate-discount-estimate";
import type { DiscountResult } from "@/types/search";

type DiscountEstimateSummaryProps = {
  discount: DiscountResult;
  paymentAmount: number;
  /** 계산기 최대 할인제한금액 — 입력 시 할인 cap 우선 적용 */
  maxDiscountLimitOverride?: number | null;
};

function WonDisplay({
  value,
  variant,
}: {
  value: number;
  variant: "payment" | "discount";
}) {
  return (
    <span
      className={
        variant === "payment"
          ? "sr-user-discount-estimate-summary__payment-value"
          : "sr-user-discount-estimate-summary__discount-value"
      }
    >
      <span className="sr-user-won-display__number">
        {value.toLocaleString("ko-KR")}
      </span>
      <span className="sr-user-won-display__unit">원</span>
    </span>
  );
}

export function DiscountEstimateSummary({
  discount,
  paymentAmount,
  maxDiscountLimitOverride = null,
}: DiscountEstimateSummaryProps) {
  const estimate = useMemo(() => {
    if (paymentAmount <= 0) {
      return null;
    }

    return calculateDiscountEstimate({
      paymentAmount,
      discount_value: discount.discount_value,
      discount_value_max: discount.discount_value_max,
      condition_amount: discount.condition_amount,
      max_discount_amount: discount.max_discount_amount,
      max_support_amount_override: maxDiscountLimitOverride,
      discount_unit: discount.discount_unit,
    });
  }, [discount, maxDiscountLimitOverride, paymentAmount]);

  if (!estimate || estimate.kind !== "payment") {
    return null;
  }

  return (
    <div className="sr-user-discount-estimate-summary-box">
      <div className="sr-user-discount-estimate-summary">
        <div className="sr-user-discount-estimate-summary__row">
          <span className="sr-user-discount-estimate-summary__label">예상 할인금액</span>
          <strong className="sr-user-discount-estimate-summary__value">
            <WonDisplay value={estimate.discountAmount} variant="discount" />
          </strong>
        </div>
        <div className="sr-user-discount-estimate-summary__row">
          <span className="sr-user-discount-estimate-summary__label">예상 결제금액</span>
          <strong className="sr-user-discount-estimate-summary__value">
            <WonDisplay value={estimate.paymentAmount} variant="payment" />
          </strong>
        </div>
      </div>
    </div>
  );
}
