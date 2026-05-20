"use client";

import { ReactNode, useState } from "react";

import {
  DISCOUNT_OPTION_GROUPS,
  type DiscountOptionGroupKey,
} from "@/lib/admin/discount-form-option-groups";

export function DiscountFormOptionGroup({
  group,
  label,
  defaultOpen = false,
  children,
}: {
  group: DiscountOptionGroupKey;
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const checkboxId = `${DISCOUNT_OPTION_GROUPS[group]}-toggle`;

  return (
    <div className="col-12">
      <div
        className={`sr-admin-discounts-option-group sr-admin-discounts-option-group--${group} ${open ? "is-open" : ""}`}
      >
        <div className="sr-discounts-option-group__header sr-discounts-group-title">
          <div className="form-check">
            <input
              id={checkboxId}
              name={DISCOUNT_OPTION_GROUPS[group]}
              type="checkbox"
              className="form-check-input"
              value="on"
              checked={open}
              onChange={(event) => setOpen(event.target.checked)}
            />
            <label className="form-check-label fw-semibold" htmlFor={checkboxId}>
              {label}
            </label>
          </div>
        </div>

        {open ? (
          <fieldset disabled={!open} className="border-0 p-0 mb-0">
            <div className="row g-3 sr-admin-discounts-option-body">{children}</div>
          </fieldset>
        ) : null}
      </div>
    </div>
  );
}
