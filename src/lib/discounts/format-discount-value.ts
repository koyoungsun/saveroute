import { isPercentLikeDiscountUnit } from "@/lib/discounts/discount-units";

export type DiscountValueDisplayStyle = "admin-list" | "compact" | "search";

export function supportsDiscountValueRange(unit: string): boolean {
  return isPercentLikeDiscountUnit(unit) || unit === "won" || unit === "amount";
}

export function hasDiscountValueRange(
  valueMax: number | string | null | undefined,
): boolean {
  if (valueMax == null || valueMax === "") {
    return false;
  }

  const maxNumber = Number(valueMax);
  return Number.isFinite(maxNumber);
}

export function getEffectiveDiscountValueForSort(input: {
  discount_value: number | string;
  discount_value_max?: number | string | null;
  discount_unit: string;
}): number {
  const min = Number(input.discount_value) || 0;
  const max = hasDiscountValueRange(input.discount_value_max)
    ? Number(input.discount_value_max)
    : null;

  if (input.discount_unit === "free") {
    return Number.MAX_SAFE_INTEGER;
  }

  if (input.discount_unit === "per_amount") {
    return min;
  }

  if (max != null && max >= min) {
    return max;
  }

  return min;
}

function formatSingleValue(numberValue: number, unit: string, style: DiscountValueDisplayStyle) {
  if (unit === "free") {
    return "무료";
  }

  if (unit === "percent") {
    return style === "search" ? `${numberValue}% 할인` : `${numberValue}%`;
  }

  if (unit === "point_percent") {
    if (style === "search") {
      return `${numberValue}% 포인트 적립`;
    }
    return `${numberValue}% 포인트`;
  }

  if (unit === "won" || unit === "amount") {
    const amount = `${numberValue.toLocaleString("ko-KR")}원`;
    return style === "search" ? `${amount} 할인` : amount;
  }

  if (unit === "per_amount") {
    return `${numberValue.toLocaleString("ko-KR")}원 할인`;
  }

  if (unit === "special_price") {
    return style === "search"
      ? `${numberValue.toLocaleString("ko-KR")}원 특가`
      : `${numberValue.toLocaleString("ko-KR")}원 특가`;
  }

  if (unit === "unknown") {
    return "할인 혜택";
  }

  return String(numberValue);
}

function formatRangeValue(
  minValue: number,
  maxValue: number,
  unit: string,
  style: DiscountValueDisplayStyle,
) {
  if (unit === "percent") {
    if (style === "search") {
      return `최소 ${minValue}% ~ 최대 ${maxValue}% 할인`;
    }

    return `${minValue}% ~ ${maxValue}%`;
  }

  if (unit === "point_percent") {
    if (style === "search") {
      return `최소 ${minValue}% ~ 최대 ${maxValue}% 포인트 적립`;
    }

    return `${minValue}% ~ ${maxValue}% 포인트`;
  }

  if (unit === "won" || unit === "amount") {
    const minLabel = minValue.toLocaleString("ko-KR");
    const maxLabel = maxValue.toLocaleString("ko-KR");

    if (style === "search") {
      return `최소 ${minLabel}원 ~ 최대 ${maxLabel}원 할인`;
    }

    return `${minLabel}원 ~ ${maxLabel}원`;
  }

  return formatSingleValue(minValue, unit, style);
}

export function formatPerAmountDiscountLabel(input: {
  conditionAmount: number | string | null | undefined;
  discountValue: number | string;
  style?: DiscountValueDisplayStyle;
}): string {
  const base = Number(input.conditionAmount) || 0;
  const discount = Number(input.discountValue) || 0;

  if (base <= 0 || discount <= 0) {
    return "금액별 할인";
  }

  const label = `${base.toLocaleString("ko-KR")}원당 ${discount.toLocaleString("ko-KR")}원 할인`;
  return input.style === "search" ? label : label;
}

export function formatDiscountValueDisplay(input: {
  value: number | string;
  valueMax?: number | string | null;
  conditionAmount?: number | string | null;
  unit: string;
  style?: DiscountValueDisplayStyle;
}): string {
  const style = input.style ?? "compact";
  const minValue = Number(input.value) || 0;
  const maxValue = hasDiscountValueRange(input.valueMax)
    ? Number(input.valueMax)
    : null;

  if (input.unit === "per_amount") {
    return formatPerAmountDiscountLabel({
      conditionAmount: input.conditionAmount,
      discountValue: input.value,
      style,
    });
  }

  if (
    maxValue != null &&
    supportsDiscountValueRange(input.unit) &&
    maxValue >= minValue
  ) {
    return formatRangeValue(minValue, maxValue, input.unit, style);
  }

  return formatSingleValue(minValue, input.unit, style);
}
