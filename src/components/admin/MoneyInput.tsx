"use client";

import { useState } from "react";

import {
  formatMoneyInputDisplay,
  sanitizeMoneyInput,
} from "@/lib/ui/format-money";

type MoneyInputProps = {
  id: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  allowDecimal?: boolean;
  className?: string;
};

export function MoneyInput({
  id,
  name,
  defaultValue,
  placeholder,
  required,
  allowDecimal = false,
  className = "form-control",
}: MoneyInputProps) {
  const initialRaw = sanitizeMoneyInput(
    defaultValue == null ? "" : String(defaultValue),
    allowDecimal,
  );
  const [rawValue, setRawValue] = useState(initialRaw);
  const [displayValue, setDisplayValue] = useState(
    formatMoneyInputDisplay(initialRaw),
  );

  const handleChange = (nextRaw: string) => {
    const sanitized = sanitizeMoneyInput(nextRaw, allowDecimal);
    setRawValue(sanitized);
    setDisplayValue(formatMoneyInputDisplay(sanitized));
  };

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        className={className}
        value={displayValue}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onChange={(event) => handleChange(event.target.value)}
      />
      <input type="hidden" name={name} value={rawValue} readOnly />
    </>
  );
}
