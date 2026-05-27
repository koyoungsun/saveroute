export const DISCOUNT_UNIT_VALUES = [
  "percent",
  "point_percent",
  "won",
  "amount",
  "per_amount",
  "special_price",
  "free",
  "unknown",
] as const;

export type DiscountUnitValue = (typeof DISCOUNT_UNIT_VALUES)[number];

export const DISCOUNT_UNIT_OPTIONS: ReadonlyArray<{
  value: DiscountUnitValue;
  label: string;
}> = [
  { value: "percent", label: "퍼센트 (%)" },
  { value: "won", label: "정액 (원)" },
  { value: "per_amount", label: "금액별 할인" },
  { value: "amount", label: "정액 (amount)" },
  { value: "point_percent", label: "포인트 % (표시용)" },
  { value: "special_price", label: "특가" },
  { value: "free", label: "무료" },
  { value: "unknown", label: "미정" },
];

export const DISCOUNT_UNITS_SET = new Set<string>(DISCOUNT_UNIT_VALUES);

export function isDiscountUnitValue(value: string): value is DiscountUnitValue {
  return DISCOUNT_UNITS_SET.has(value);
}

export function isPercentLikeDiscountUnit(unit: string): boolean {
  return unit === "percent" || unit === "point_percent";
}
