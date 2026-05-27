export const BRAND_PRICE_INPUT_MODES = [
  "manual_total",
  "per_person",
  "ticket_type",
] as const;

export type BrandPriceInputMode = (typeof BRAND_PRICE_INPUT_MODES)[number];

export const BRAND_PAYMENT_APPLY_MODES = [
  "single",
  "grouped_prepay",
  "split",
] as const;

export type BrandPaymentApplyMode = (typeof BRAND_PAYMENT_APPLY_MODES)[number];

export function isBrandPriceInputMode(value: string | null | undefined): value is BrandPriceInputMode {
  return BRAND_PRICE_INPUT_MODES.includes(value as BrandPriceInputMode);
}

export function isBrandPaymentApplyMode(
  value: string | null | undefined,
): value is BrandPaymentApplyMode {
  return BRAND_PAYMENT_APPLY_MODES.includes(value as BrandPaymentApplyMode);
}

export function parseBrandPriceInputMode(
  formValue: string | null | undefined,
): BrandPriceInputMode | null {
  const trimmed = (formValue ?? "").trim();
  return isBrandPriceInputMode(trimmed) ? trimmed : null;
}

export function parseBrandPaymentApplyMode(
  formValue: string | null | undefined,
): BrandPaymentApplyMode | null {
  const trimmed = (formValue ?? "").trim();
  return isBrandPaymentApplyMode(trimmed) ? trimmed : null;
}
