"use client";

import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type BenefitSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type BenefitSelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: BenefitSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function BenefitSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className,
}: BenefitSelectProps) {
  const showPlaceholder = Boolean(placeholder) && value === "";

  return (
    <div
      className={cn(
        "sr-user-benefit-select",
        showPlaceholder && "sr-user-benefit-select--placeholder",
        className,
      )}
    >
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="sr-user-benefit-select__native"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="sr-user-benefit-select__chevron" aria-hidden="true" />
    </div>
  );
}
