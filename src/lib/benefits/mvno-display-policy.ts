import type { MvnoBrandOption } from "@/lib/benefits/load-registration-data";

/** Featured MVNO brands shown in user registration UI (provider.code). */
export const FEATURED_MVNO_PROVIDER_CODES = new Set([
  "kt_m_mobile",
  "sk_7mobile",
  "lg-hello-mobile",
  "uplus_mvno",
]);

/** User-facing display names for featured brands. */
export const FEATURED_MVNO_DISPLAY_NAMES: Record<string, string> = {
  kt_m_mobile: "KT M모바일",
  sk_7mobile: "SK 세븐모바일",
  "lg-hello-mobile": "LG 헬로모바일",
  uplus_mvno: "U+ 유모바일",
};

export function isFeaturedMvnoBrand(option: Pick<MvnoBrandOption, "code">): boolean {
  return FEATURED_MVNO_PROVIDER_CODES.has(option.code);
}

export function filterFeaturedMvnoBrandOptions(options: MvnoBrandOption[]): MvnoBrandOption[] {
  return options.filter((option) => FEATURED_MVNO_PROVIDER_CODES.has(option.code));
}

export function getFeaturedMvnoDisplayName(option: Pick<MvnoBrandOption, "code" | "name">): string {
  return FEATURED_MVNO_DISPLAY_NAMES[option.code] ?? option.name;
}
