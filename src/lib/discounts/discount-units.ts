export const DISCOUNT_UNIT_VALUES = [
  "percent",
  "point_percent",
  "won",
  "special_price",
  "free",
  "unknown",
] as const;

export type DiscountUnitValue = (typeof DISCOUNT_UNIT_VALUES)[number];

export const DISCOUNT_UNIT_OPTIONS: ReadonlyArray<{
  value: DiscountUnitValue;
  label: string;
}> = [
  { value: "percent", label: "percent" },
  { value: "point_percent", label: "포인트 퍼센트" },
  { value: "won", label: "won" },
  { value: "special_price", label: "special_price" },
  { value: "free", label: "free" },
  { value: "unknown", label: "unknown" },
];

export const DISCOUNT_UNITS_SET = new Set<string>(DISCOUNT_UNIT_VALUES);

export function isDiscountUnitValue(value: string): value is DiscountUnitValue {
  return DISCOUNT_UNITS_SET.has(value);
}

export function isPercentLikeDiscountUnit(unit: string): boolean {
  return unit === "percent" || unit === "point_percent";
}
