"use client";

import { useEffect, useState } from "react";

import { inferDiscountValueMode } from "@/lib/admin/parse-discount-value-fields";
import { supportsDiscountValueRange } from "@/lib/discounts/format-discount-value";

import { DiscountAmountInput } from "./DiscountAmountInput";

type DiscountValueFieldsProps = {
  unit: string;
  defaultValue?: string | number | null;
  defaultValueMax?: string | number | null;
  valueError?: string;
  valueMaxError?: string;
  required?: boolean;
};

export function DiscountValueFields({
  unit,
  defaultValue,
  defaultValueMax,
  valueError,
  valueMaxError,
  required = true,
}: DiscountValueFieldsProps) {
  const rangeSupported = supportsDiscountValueRange(unit);
  const [mode, setMode] = useState<"single" | "range">(() =>
    inferDiscountValueMode(unit, defaultValueMax),
  );

  useEffect(() => {
    if (!rangeSupported) {
      setMode("single");
      return;
    }

    setMode(inferDiscountValueMode(unit, defaultValueMax));
  }, [unit, defaultValueMax, rangeSupported]);

  if (!rangeSupported) {
    return (
      <DiscountAmountInput
        unit={unit}
        defaultValue={defaultValue}
        placeholder={
          unit === "point_percent"
            ? "예: 5"
            : unit === "percent"
              ? "예: 20"
              : "예: 10,000"
        }
        required={required && unit !== "free"}
      />
    );
  }

  const percentPlaceholder = "예: 20";
  const pointPercentPlaceholder = "예: 5";
  const amountPlaceholder = "예: 10,000";

  return (
    <div className="d-flex flex-column gap-2">
      <input type="hidden" name="discount_value_mode" value={mode} readOnly />

      <div className="d-flex flex-wrap gap-3">
        <div className="form-check mb-0">
          <input
            id="discount_value_mode_single"
            className="form-check-input"
            type="radio"
            checked={mode === "single"}
            onChange={() => setMode("single")}
          />
          <label className="form-check-label" htmlFor="discount_value_mode_single">
            단일 할인값
          </label>
        </div>
        <div className="form-check mb-0">
          <input
            id="discount_value_mode_range"
            className="form-check-input"
            type="radio"
            checked={mode === "range"}
            onChange={() => setMode("range")}
          />
          <label className="form-check-label" htmlFor="discount_value_mode_range">
            범위 할인값
          </label>
        </div>
      </div>

      {mode === "single" ? (
        <>
          <DiscountAmountInput
            unit={unit}
            defaultValue={defaultValue}
            placeholder={
              unit === "point_percent"
                ? pointPercentPlaceholder
                : unit === "percent"
                  ? percentPlaceholder
                  : amountPlaceholder
            }
            required={required}
          />
          {valueError ? (
            <div className="sr-discounts-field__error mb-0">{valueError}</div>
          ) : null}
        </>
      ) : (
        <div className="sr-discounts-value-range-row">
          <div>
            <label className="form-label mb-1" htmlFor="discount_value">
              최소 할인값
            </label>
            <DiscountAmountInput
              unit={unit}
              defaultValue={defaultValue}
              placeholder={
              unit === "point_percent"
                ? pointPercentPlaceholder
                : unit === "percent"
                  ? percentPlaceholder
                  : amountPlaceholder
            }
              required={required}
            />
            {valueError ? (
              <div className="sr-discounts-field__error mb-0">{valueError}</div>
            ) : null}
          </div>
          <div>
            <label className="form-label mb-1" htmlFor="discount_value_max">
              최대 할인값
            </label>
            <DiscountAmountInput
              id="discount_value_max"
              name="discount_value_max"
              unit={unit}
              defaultValue={defaultValueMax}
              placeholder={unit === "percent" ? "예: 30" : unit === "point_percent" ? "예: 10" : "예: 10,000"}
              required={required}
            />
            {valueMaxError ? (
              <div className="sr-discounts-field__error mb-0">{valueMaxError}</div>
            ) : null}
          </div>
        </div>
      )}

      <div className="sr-discounts-field__hint form-text mb-0">
        할인값 범위(최소~최대)와 「최대 할인 한도 금액」은 다른 항목입니다.
      </div>
    </div>
  );
}
