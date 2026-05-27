import {
  hasDiscountValueRange,
  supportsDiscountValueRange,
} from "@/lib/discounts/format-discount-value";
import { parseNumericInput } from "@/lib/ui/format-money";

import {
  isDiscountUnitValue,
  type DiscountUnitValue,
} from "@/lib/discounts/discount-units";

export type ParsedDiscountValues = {
  discountValue: number;
  discountValueMax: number | null;
  conditionAmount: number | null;
};

export type DiscountValueFieldErrors = {
  discount_value?: string;
  discount_value_max?: string;
  condition_amount?: string;
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
  unit: DiscountUnitValue,
): { ok: true; value: ParsedDiscountValues } | { ok: false; fieldErrors: DiscountValueFieldErrors } {
  if (unit === "free") {
    return {
      ok: true,
      value: {
        discountValue: 0,
        discountValueMax: null,
        conditionAmount: null,
      },
    };
  }

  if (unit === "per_amount") {
    const conditionAmount = readPositiveNumber(readString(formData, "condition_amount"));
    const discountValue = readPositiveNumber(readString(formData, "discount_value"));

    if (conditionAmount === null) {
      return {
        ok: false,
        fieldErrors: {
          condition_amount: "0보다 큰 기준금액을 입력해 주세요.",
        },
      };
    }

    if (discountValue === null) {
      return {
        ok: false,
        fieldErrors: {
          discount_value: "0보다 큰 할인금액을 입력해 주세요.",
        },
      };
    }

    return {
      ok: true,
      value: {
        discountValue,
        discountValueMax: null,
        conditionAmount,
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
        conditionAmount: null,
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
      conditionAmount: null,
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
