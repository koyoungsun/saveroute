"use client";

import { useState } from "react";

import { sanitizePercentInput } from "@/lib/ui/format-money";

type PercentInputProps = {
  id: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export function PercentInput({
  id,
  name,
  defaultValue,
  placeholder,
  required,
  className = "form-control",
}: PercentInputProps) {
  const initialRaw = sanitizePercentInput(
    defaultValue == null ? "" : String(defaultValue),
  );
  const [rawValue, setRawValue] = useState(initialRaw);

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        className={className}
        value={rawValue}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        onChange={(event) => setRawValue(sanitizePercentInput(event.target.value))}
      />
      <input type="hidden" name={name} value={rawValue} readOnly />
    </>
  );
}
