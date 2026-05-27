"use client";

import { MoneyInput } from "@/components/admin/MoneyInput";

type PerAmountDiscountFieldsProps = {
  defaultConditionAmount?: string | number | null;
  defaultDiscountValue?: string | number | null;
  conditionAmountError?: string;
  discountValueError?: string;
  required?: boolean;
};

export function PerAmountDiscountFields({
  defaultConditionAmount,
  defaultDiscountValue,
  conditionAmountError,
  discountValueError,
  required = true,
}: PerAmountDiscountFieldsProps) {
  return (
    <div className="d-flex flex-column gap-3">
      <div>
        <label className="form-label mb-1" htmlFor="condition_amount">
          기준금액 <span className="text-danger">*</span>
        </label>
        <MoneyInput
          id="condition_amount"
          name="condition_amount"
          placeholder="예: 1,000"
          defaultValue={
            defaultConditionAmount != null ? String(defaultConditionAmount) : ""
          }
          required={required}
        />
        <div className="form-text mb-0">예) 1,000원당</div>
        {conditionAmountError ? (
          <div className="sr-discounts-field__error mb-0">{conditionAmountError}</div>
        ) : null}
      </div>

      <div>
        <label className="form-label mb-1" htmlFor="discount_value">
          할인금액 <span className="text-danger">*</span>
        </label>
        <MoneyInput
          id="discount_value"
          name="discount_value"
          placeholder="예: 50"
          defaultValue={
            defaultDiscountValue != null ? String(defaultDiscountValue) : ""
          }
          required={required}
        />
        <div className="form-text mb-0">예) 50원 할인</div>
        {discountValueError ? (
          <div className="sr-discounts-field__error mb-0">{discountValueError}</div>
        ) : null}
      </div>

      <p className="sr-discounts-field__hint form-text mb-0">
        편의점 멤버십처럼 1,000원당 50원 할인되는 구조에 사용합니다.
      </p>
    </div>
  );
}
