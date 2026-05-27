import type { DiscountResult } from "@/types/search";

import { inferPriceBoardModes } from "@/lib/search/infer-price-board-modes";
import type { PaymentApplyMode, PriceInputMode } from "@/lib/search/infer-price-board-modes";
import {
  isBrandPaymentApplyMode,
  isBrandPriceInputMode,
  type BrandPaymentApplyMode,
  type BrandPriceInputMode,
} from "@/lib/search/price-board-mode-types";

export type ResolvedPriceBoardModes = {
  priceInputMode: BrandPriceInputMode | PriceInputMode;
  paymentApplyMode: PaymentApplyMode | BrandPaymentApplyMode;
  reason: string;
  priceInputSource: "brand" | "inferred";
  paymentApplySource: "brand" | "inferred";
};

export function resolvePriceBoardModes(input: {
  brandPriceInputMode?: string | null;
  brandPaymentApplyMode?: string | null;
  brandCategoryCode: string;
  brandName: string;
  brandAliases?: string[] | null;
  discount?: DiscountResult | null;
}): ResolvedPriceBoardModes {
  const inferred = inferPriceBoardModes({
    brandCategoryCode: input.brandCategoryCode,
    brandName: input.brandName,
    brandAliases: input.brandAliases,
    discount: input.discount ?? null,
  });

  const brandPriceInput = isBrandPriceInputMode(input.brandPriceInputMode)
    ? input.brandPriceInputMode
    : null;
  const brandPaymentApply = isBrandPaymentApplyMode(input.brandPaymentApplyMode)
    ? input.brandPaymentApplyMode
    : null;

  const priceInputSource = brandPriceInput ? "brand" : "inferred";
  const paymentApplySource = brandPaymentApply ? "brand" : "inferred";

  const priceInputMode = brandPriceInput ?? inferred.priceInputMode;
  const paymentApplyMode = brandPaymentApply ?? inferred.paymentApplyMode;

  const reasonParts: string[] = [];
  if (brandPriceInput) {
    reasonParts.push(`brand_price_input_mode=${brandPriceInput}`);
  }
  if (brandPaymentApply) {
    reasonParts.push(`brand_payment_apply_mode=${brandPaymentApply}`);
  }
  if (!brandPriceInput || !brandPaymentApply) {
    reasonParts.push(`inferred:${inferred.reason}`);
  }

  return {
    priceInputMode,
    paymentApplyMode,
    reason: reasonParts.join(";") || inferred.reason,
    priceInputSource,
    paymentApplySource,
  };
}
