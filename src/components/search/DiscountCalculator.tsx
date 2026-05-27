"use client";

import { useMemo, useState } from "react";

import {
  calculateDiscountEstimate,
  formatPaymentInput,
  parsePaymentInput,
} from "@/lib/search/calculate-discount-estimate";
import type { DiscountResult } from "@/types/search";

type DiscountCalculatorProps = {
  discount: DiscountResult;
};

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function DiscountCalculator({ discount }: DiscountCalculatorProps) {
  const [inputValue, setInputValue] = useState("");

  const paymentAmount = useMemo(() => parsePaymentInput(inputValue), [inputValue]);

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
      discount_unit: discount.discount_unit,
    });
  }, [discount, paymentAmount]);

  return (
    <section className="sr-user-discount-calculator" aria-label="할인금액 계산하기">
      <p className="sr-user-discount-calculator__title">할인금액 계산하기</p>
      <p className="sr-user-discount-calculator__hint">
        상단에 예상 결제금액을 입력하면 모든 카드에 일괄 적용됩니다.
      </p>

      <label className="sr-user-discount-calculator__field mt-2 block">
        <span className="sr-user-discount-calculator__field-label">결제 예정 금액 입력</span>
        <input
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(event) => {
            const next = parsePaymentInput(event.target.value);
            setInputValue(next ? formatPaymentInput(next) : "");
          }}
          placeholder="예: 78,000"
          className="sr-user-discount-calculator__input sr-user-input sr-user-t-body mt-1 w-full"
        />
      </label>

      {estimate ? (
        <div className="sr-user-discount-calculator__summary space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className="sr-user-discount-calculator__summary-label">적용 할인</span>
            <span className="sr-user-discount-calculator__summary-value text-right">
              {estimate.appliedLabel}
            </span>
          </div>

          {estimate.kind === "payment" ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="sr-user-discount-calculator__summary-label">예상 할인금액</span>
                <span className="sr-user-discount-calculator__discount">
                  {formatWon(estimate.discountAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="sr-user-discount-calculator__summary-label">예상 결제금액</span>
                <span className="sr-user-discount-calculator__payment">
                  {formatWon(estimate.paymentAmount)}
                </span>
              </div>
            </>
          ) : null}

          {estimate.kind === "info" ? (
            <p className="sr-user-t-muted sr-user-text-secondary">{estimate.message}</p>
          ) : null}
        </div>
      ) : null}

      <p className="sr-user-discount-calculator__notice mt-2">
        실제 할인은 현장/카드사 조건에 따라 달라질 수 있습니다.
      </p>
    </section>
  );
}
