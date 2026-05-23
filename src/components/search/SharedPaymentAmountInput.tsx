"use client";

import { useId, useState } from "react";

import {
  formatPaymentInput,
  parsePaymentInput,
} from "@/lib/search/calculate-discount-estimate";
import { cn } from "@/lib/utils";

type SharedPaymentAmountInputProps = {
  value: string;
  onChange: (value: string) => void;
};

export function SharedPaymentAmountInput({
  value,
  onChange,
}: SharedPaymentAmountInputProps) {
  const inputId = useId();
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value.trim().length > 0;
  const isFieldActive = isFocused || hasValue;

  return (
    <section className="sr-user-shared-payment-input" aria-label="예상 결제금액 입력">
      <div
        className={cn(
          "sr-user-shared-payment-input__bar",
          isFieldActive && "sr-user-shared-payment-input__bar--active",
          isFocused && "sr-user-shared-payment-input__bar--focused",
        )}
      >
        <div className="sr-user-shared-payment-input__shell">
          <div className="sr-user-shared-payment-input__amount-field">
            <input
              id={inputId}
              type="text"
              inputMode="numeric"
              value={value}
              onChange={(event) => {
                const next = parsePaymentInput(event.target.value);
                onChange(next ? formatPaymentInput(next) : "");
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="금액을 입력하세요"
              className={cn(
                "sr-user-shared-payment-input__field",
                hasValue && "sr-user-shared-payment-input__field--filled",
              )}
              aria-label="예상 결제금액 입력"
            />
          </div>
          <label htmlFor={inputId} className="sr-user-shared-payment-input__label">
            예상 결제금액 입력
          </label>
        </div>
      </div>
      <ul className="sr-user-shared-payment-input__helper-list">
        <li>예상 결제 금액 입력 시 예상 할인금액을 알려드립니다.</li>
        <li>입력 시 실제 할인은 현장/카드사 조건에 따라 달라질 수 있습니다.</li>
      </ul>
    </section>
  );
}

export function useSharedPaymentAmount(inputValue: string) {
  return parsePaymentInput(inputValue);
}
