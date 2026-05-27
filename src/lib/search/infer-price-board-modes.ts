import type { DiscountResult } from "@/types/search";

export type PriceInputMode = "per_person" | "ticket_type";
export type PaymentApplyMode = "single" | "per_person" | "split" | "grouped_prepay";

export type PriceBoardModes = {
  priceInputMode: PriceInputMode;
  paymentApplyMode: PaymentApplyMode;
  reason: string;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function includesAny(haystack: string, needles: string[]) {
  for (const n of needles) {
    if (haystack.includes(n)) return true;
  }
  return false;
}

function inferFromCategory(brandCategoryCode: string): PriceBoardModes {
  const code = (brandCategoryCode ?? "").trim().toLowerCase();

  // 놀이동산/테마파크
  if (code === "amusement_park" || code === "theme_park") {
    return { priceInputMode: "ticket_type", paymentApplyMode: "split", reason: "brand_keyword_themepark" };
  }

  // 뷔페/음식점
  if (code === "food" || code === "buffet" || code === "restaurant") {
    return { priceInputMode: "per_person", paymentApplyMode: "single", reason: "fallback_default" };
  }

  // default
  return { priceInputMode: "per_person", paymentApplyMode: "single", reason: "fallback_default" };
}

function readExplicitPaymentApplyMode(discount?: DiscountResult | null): PaymentApplyMode | null {
  if (!discount) return null;
  const raw = (discount as unknown as { payment_apply_mode?: string | null }).payment_apply_mode;
  const value = (raw ?? "").trim();
  if (value === "single" || value === "per_person" || value === "split" || value === "grouped_prepay") {
    return value;
  }
  return null;
}

export function inferPriceBoardModes(input: {
  brandCategoryCode: string;
  brandName: string;
  brandAliases?: string[] | null;
  discount?: DiscountResult | null;
}): PriceBoardModes {
  const explicit = readExplicitPaymentApplyMode(input.discount ?? null);
  if (explicit) {
    return {
      priceInputMode: explicit === "single" ? "per_person" : "ticket_type",
      paymentApplyMode: explicit,
      reason: "explicit_discount_payment_apply_mode",
    };
  }

  const base = inferFromCategory(input.brandCategoryCode);

  const brandTokens = [
    input.brandName,
    ...(input.brandAliases ?? []),
  ]
    .filter(Boolean)
    .map((t) => normalizeText(String(t)));
  const brandText = brandTokens.join(" ");

  const discountTextRaw = `${input.discount?.title ?? ""}\n${input.discount?.condition_text ?? ""}\n${input.discount?.notice_text ?? ""}\n${input.discount?.installment_condition ?? ""}`;
  const discountText = normalizeText(discountTextRaw);

  const looksMovieBrand = includesAny(brandText, [
    "영화관",
    "cgv",
    "롯데시네마",
    "메가박스",
    "cinema",
    "movie",
    "theater",
    "theatre",
  ].map(normalizeText));

  const looksThemeParkBrand = includesAny(brandText, [
    "놀이공원",
    "테마파크",
    "서울랜드",
    "에버랜드",
    "롯데월드",
    "seoulland",
    "everland",
    "lotteworld",
  ].map(normalizeText));

  // brand 성격 우선 (충돌 시)
  if (looksMovieBrand) {
    return { priceInputMode: "ticket_type", paymentApplyMode: "grouped_prepay", reason: "brand_keyword_cinema" };
  }

  if (looksThemeParkBrand) {
    return { priceInputMode: "ticket_type", paymentApplyMode: "split", reason: "brand_keyword_themepark" };
  }

  // 문구 기반 후보
  const splitCandidate = includesAny(discountText, [
    "동반",
    "동반인",
    "자유이용권",
    "입장권",
    "종일권",
  ].map(normalizeText));

  const groupedPrepayCandidate = includesAny(discountText, [
    "예매",
    "영화",
    "관람권",
    "티켓",
    "1매",
    "매당",
  ].map(normalizeText));

  if (groupedPrepayCandidate && base.paymentApplyMode !== "split") {
    return { priceInputMode: "ticket_type", paymentApplyMode: "grouped_prepay", reason: "discount_text_ticket_count" };
  }

  if (splitCandidate) {
    return { priceInputMode: "ticket_type", paymentApplyMode: "split", reason: "discount_text_ticket_count" };
  }

  // category movie hint (optional codes)
  const code = (input.brandCategoryCode ?? "").trim().toLowerCase();
  if (
    code === "movie" ||
    code === "cinema" ||
    code === "movie_theater" ||
    code === "movie_theatre" ||
    code === "theater" ||
    code === "theatre"
  ) {
    return { priceInputMode: "ticket_type", paymentApplyMode: "grouped_prepay", reason: "brand_category_movie" };
  }

  return base;
}

