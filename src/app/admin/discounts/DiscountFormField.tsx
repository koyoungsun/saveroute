import type { ReactNode } from "react";

export function DiscountFormField({
  label,
  htmlFor,
  required = false,
  stack = false,
  hintInline = false,
  className,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  stack?: boolean;
  hintInline?: boolean;
  className?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`sr-discounts-field${stack ? " sr-discounts-field--stack" : ""}${hintInline ? " sr-discounts-field--hint-inline" : ""}${className ? ` ${className}` : ""}`}
    >
      <label className="sr-discounts-field__label form-label fw-semibold mb-0" htmlFor={htmlFor}>
        {required ? (
          <span className="sr-discounts-field__required" aria-hidden="true">
            *{" "}
          </span>
        ) : null}
        {label}
      </label>
      <div className="sr-discounts-field__body">
        {hintInline && hint ? (
          <div className="sr-discounts-field__control-row">
            <div className="sr-discounts-field__control">{children}</div>
            <div className="sr-discounts-field__hint sr-discounts-field__hint--inline form-text mb-0">
              {hint}
            </div>
          </div>
        ) : (
          <div className="sr-discounts-field__control">{children}</div>
        )}
        {error ? (
          <div className="sr-discounts-field__error mb-0">{error}</div>
        ) : null}
        {!hintInline && hint ? (
          <div className="sr-discounts-field__hint form-text mb-0">{hint}</div>
        ) : null}
      </div>
    </div>
  );
}
