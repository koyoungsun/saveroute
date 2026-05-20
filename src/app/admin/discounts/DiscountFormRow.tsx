import type { ReactNode } from "react";

export function DiscountFormRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["sr-discounts-form-row", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
