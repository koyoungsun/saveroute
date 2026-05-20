"use client";

import { shouldFormatDiscountValueWithComma } from "@/lib/ui/format-money";

import { MoneyInput } from "./MoneyInput";
import { PercentInput } from "./PercentInput";

type DiscountAmountInputProps = {
  id?: string;
  name?: string;
  unit: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
};

export function DiscountAmountInput({
  id = "discount_value",
  name = "discount_value",
  unit,
  defaultValue,
  placeholder,
  required = true,
}: DiscountAmountInputProps) {
  if (unit === "free") {
    return (
      <>
        <input id={id} className="form-control" value="0" readOnly disabled />
        <input type="hidden" name={name} value="0" readOnly />
        <div className="sr-discounts-field__hint form-text mb-0">무료 할인은 할인값 0으로 저장됩니다.</div>
      </>
    );
  }

  if (shouldFormatDiscountValueWithComma(unit)) {
    return (
      <MoneyInput
        key={`money-${unit}-${defaultValue ?? ""}`}
        id={id}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder ?? "예: 10,000"}
        required={required}
      />
    );
  }

  return (
    <PercentInput
      key={`percent-${unit}-${defaultValue ?? ""}`}
      id={id}
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder ?? "예: 20"}
      required={required}
    />
  );
}
