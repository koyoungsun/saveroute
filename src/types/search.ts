/**
 * Search domain types (API + UI).
 * Keep serializable for JSON responses from `/api/search`.
 */

export type DiscountUnit =
  | "percent"
  | "point_percent"
  | "won"
  | "amount"
  | "per_amount"
  | "special_price"
  | "free"
  | "unknown";

export type BenefitCategorySummary = {
  id: number;
  name: string;
  code: string;
};

export type ProviderSummary = {
  id: number;
  name: string;
};

export type BenefitProductSummary = {
  id: number;
  name: string;
  is_mvno: boolean;
  mvno_notice_required: boolean;
  is_all_product?: boolean;
  benefit_type?: string | null;
};

/** Flat discount row enriched for cards / consumers */
export type DiscountResult = {
  id: number;
  brand_id: number;
  title: string;
  condition_text: string | null;
  notice_text: string | null;
  apply_basis: string | null;
  stackable_policy: string | null;
  usage_channel: string | null;
  installment_condition: string | null;
  discount_value: number | string;
  discount_value_max?: number | string | null;
  /** per_amount 기준금액 (예: 1000원당) */
  condition_amount?: number | null;
  /** Maximum discount amount (KRW) when applying this benefit */
  max_discount_amount?: number | null;
  discount_unit: DiscountUnit;
  usage_type: string;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_product_ids?: number[] | null;
  valid_until: string | null;
  has_no_expiry: boolean;
  benefit_category: BenefitCategorySummary | null;
  provider: ProviderSummary | null;
  benefit_product: BenefitProductSummary | null;
};

export type BrandResult = {
  id: number;
  name: string;
  slug: string;
  official_url: string | null;
  category_id: number | null;
  aliases?: string[] | null;
  has_price_board: boolean;
  /** Admin: manual_total | per_person | ticket_type. null = search infers */
  price_input_mode?: string | null;
  /** Admin: single | grouped_prepay | split. null = search infers */
  payment_apply_mode?: string | null;
};

export type BrandPriceItemResult = {
  id: string;
  brand_id: number;
  label: string;
  price: number;
  sort_order: number;
  is_active: boolean;
};

/** GET /api/search JSON body */
export type SearchApiPayload = {
  keyword: string;
  normalizedKeyword: string;
  matchedBrand: BrandResult | null;
  /** Active price items (sorted) for matchedBrand when price board enabled */
  brandPriceItems: BrandPriceItemResult[];
  /** Personalized discounts (user benefits match); may be empty when logged in */
  discounts: DiscountResult[];
  /** All active discounts for matched brand (before personalization) */
  catalogDiscounts: DiscountResult[];
  /** Discount IDs where user benefits match this discount */
  ownedDiscountIds: number[];
  bestDiscountId: number | null;
  brandCategoryName: string;
  brandCategoryCode: string;
  hasMvnoDiscount: boolean;
  /** Session present — personalization (`ownedDiscountIds`) may apply */
  authenticated: boolean;
  /** Authenticated user has at least one active row in user_benefits */
  hasRegisteredBenefits: boolean;
};
