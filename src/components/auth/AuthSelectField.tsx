"use client";

import { ChangeEvent, useId } from "react";

import { cn } from "@/lib/utils";

type AuthSelectOption = {
  value: string;
  label: string;
};

type AuthSelectFieldProps = {
  id?: string;
  label: string;
  value: string;
  options: readonly AuthSelectOption[];
  placeholder?: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
};

export function AuthSelectField({
  id,
  label,
  value,
  options,
  placeholder = "선택",
  onChange,
  className,
}: AuthSelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={cn("sr-user-auth-field sr-user-auth-field--select", className)}>
      <label htmlFor={selectId} className="sr-user-auth-field__static-label">
        {label}
      </label>
      <div className="sr-user-auth-field__shell sr-user-auth-field__shell--select">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className="sr-user-auth-field__select"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
