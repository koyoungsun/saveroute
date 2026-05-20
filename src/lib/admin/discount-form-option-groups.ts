export const DISCOUNT_OPTION_GROUPS = {
  notice: "enable_notice",
  period: "enable_period",
  data: "enable_data",
  visibility: "enable_visibility",
} as const;

export type DiscountOptionGroupKey = keyof typeof DISCOUNT_OPTION_GROUPS;

export type DiscountFormOptionSeed = {
  valid_from?: string | null;
  valid_until?: string | null;
  notice_text?: string | null;
  source_url?: string | null;
  admin_memo?: string | null;
  status?: string | null;
};

export type DiscountFormOpenGroups = Record<DiscountOptionGroupKey, boolean>;

export function isDiscountOptionGroupEnabled(
  formData: FormData,
  group: DiscountOptionGroupKey,
): boolean {
  return formData.get(DISCOUNT_OPTION_GROUPS[group]) === "on";
}

export function getDiscountFormDefaultOpenGroups(
  values?: DiscountFormOptionSeed,
): DiscountFormOpenGroups {
  if (!values) {
    return {
      notice: false,
      period: false,
      data: false,
      visibility: true,
    };
  }

  return {
    notice: Boolean(values.notice_text?.trim()),
    period: Boolean(values.valid_from || values.valid_until),
    data: Boolean(values.source_url || values.admin_memo),
    visibility: true,
  };
}
