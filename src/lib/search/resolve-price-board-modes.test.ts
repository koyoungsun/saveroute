/**
 * 실행: npx tsx src/lib/search/resolve-price-board-modes.test.ts
 */
import assert from "node:assert/strict";

import { resolvePriceBoardModes } from "@/lib/search/resolve-price-board-modes";

const brandOnly = resolvePriceBoardModes({
  brandPriceInputMode: "ticket_type",
  brandPaymentApplyMode: "split",
  brandCategoryCode: "food",
  brandName: "테스트",
});

assert.equal(brandOnly.priceInputMode, "ticket_type");
assert.equal(brandOnly.paymentApplyMode, "split");
assert.equal(brandOnly.priceInputSource, "brand");
assert.equal(brandOnly.paymentApplySource, "brand");

const inferredOnly = resolvePriceBoardModes({
  brandPriceInputMode: null,
  brandPaymentApplyMode: null,
  brandCategoryCode: "theme_park",
  brandName: "서울랜드",
});

assert.equal(inferredOnly.priceInputSource, "inferred");
assert.equal(inferredOnly.paymentApplySource, "inferred");
assert.equal(inferredOnly.paymentApplyMode, "split");

const mixed = resolvePriceBoardModes({
  brandPaymentApplyMode: "single",
  brandCategoryCode: "theme_park",
  brandName: "서울랜드",
});

assert.equal(mixed.paymentApplyMode, "single");
assert.equal(mixed.paymentApplySource, "brand");
assert.equal(mixed.priceInputSource, "inferred");

console.log("resolve-price-board-modes.test.ts: ok");
