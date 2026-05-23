"use client";

import {
  ChangeEvent,
  ReactNode,
  useId,
  useState,
} from "react";

import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id?: string;
  label: string;
  type?: string;
  value: string;
  autoComplete?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  endAdornment?: ReactNode;
  className?: string;
};

export function AuthField({
  id,
  label,
  type = "text",
  value,
  autoComplete,
  onChange,
  endAdornment,
  className,
}: AuthFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || value.length > 0;

  return (
    <div
      className={cn(
        "sr-user-auth-field",
        isActive && "sr-user-auth-field--active",
        isFocused && "sr-user-auth-field--focused",
        endAdornment && "sr-user-auth-field--with-adornment",
        className,
      )}
    >
      <div className="sr-user-auth-field__shell">
        <input
          id={inputId}
          type={type}
          value={value}
          autoComplete={autoComplete}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="sr-user-auth-field__input"
        />
        <label htmlFor={inputId} className="sr-user-auth-field__label">
          {label}
        </label>
        {endAdornment ? (
          <div className="sr-user-auth-field__adornment">{endAdornment}</div>
        ) : null}
      </div>
    </div>
  );
}
