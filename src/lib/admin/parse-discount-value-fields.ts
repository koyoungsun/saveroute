import {
  hasDiscountValueRange,
  supportsDiscountValueRange,
} from "@/lib/discounts/format-discount-value";
import { parseNumericInput } from "@/lib/ui/format-money";

type DiscountUnit = "percent" | "won" | "special_price" | "free" | "unknown";

export type ParsedDiscountValues = {
  discountValue: number;
  discountValueMax: number | null;
};

export type DiscountValueFieldErrors = {
  discount_value?: string;
  discount_value_max?: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveNumber(value: string) {
  return parseNumericInput(value);
}

export function parseDiscountValueFields(
  formData: FormData,
  unit: DiscountUnit,
): { ok: true; value: ParsedDiscountValues } | { ok: false; fieldErrors: DiscountValueFieldErrors } {
  if (unit === "free") {
    return {
      ok: true,
      value: {
        discountValue: 0,
        discountValueMax: null,
      },
    };
  }

  const mode = readString(formData, "discount_value_mode") || "single";
  const minRaw = readString(formData, "discount_value");
  const maxRaw = readString(formData, "discount_value_max");
  const useRange = supportsDiscountValueRange(unit) && mode === "range";

  if (!useRange) {
    const discountValue = readPositiveNumber(minRaw);
    if (discountValue === null) {
      return {
        ok: false,
        fieldErrors: {
          discount_value: "0 이상의 할인값을 입력해 주세요.",
        },
      };
    }

    return {
      ok: true,
      value: {
        discountValue,
        discountValueMax: null,
      },
    };
  }

  const discountValue = readPositiveNumber(minRaw);
  const discountValueMax = readPositiveNumber(maxRaw);

  if (discountValue === null) {
    return {
      ok: false,
      fieldErrors: {
        discount_value: "최소 할인값을 입력해 주세요.",
      },
    };
  }

  if (discountValueMax === null) {
    return {
      ok: false,
      fieldErrors: {
        discount_value_max: "최대 할인값을 입력해 주세요.",
      },
    };
  }

  if (discountValueMax < discountValue) {
    return {
      ok: false,
      fieldErrors: {
        discount_value_max: "최대 할인값은 최소 할인값 이상이어야 합니다.",
      },
    };
  }

  if (!hasDiscountValueRange(discountValueMax)) {
    return {
      ok: false,
      fieldErrors: {
        discount_value_max: "최대 할인값을 입력해 주세요.",
      },
    };
  }

  return {
    ok: true,
    value: {
      discountValue,
      discountValueMax,
    },
  };
}

export function inferDiscountValueMode(
  unit: string,
  valueMax: number | string | null | undefined,
): "single" | "range" {
  if (!supportsDiscountValueRange(unit)) {
    return "single";
  }

  return hasDiscountValueRange(valueMax) ? "range" : "single";
}
