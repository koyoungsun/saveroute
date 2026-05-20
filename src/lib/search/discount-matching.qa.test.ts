/**
 * User QA #6 — discount matching rules (unit-level, no DB).
 */
import assert from "node:assert/strict";
import {
  matchDiscountToUserBenefit,
  userHoldsProviderAllProduct,
} from "./discount-matching";

const CARD_CAT = 2;
const SAMSUNG = 10;
const ALL_PRODUCT_ID = 9001;
const SPECIFIC_CARD_ID = 9002;
const DISCOUNT_ALL_ID = 8001;
const DISCOUNT_SPECIFIC_ID = 8002;

const allProductMeta = {
  id: ALL_PRODUCT_ID,
  benefit_type: "all",
  is_all_product: true,
};

const specificProductMeta = {
  id: SPECIFIC_CARD_ID,
  benefit_type: "credit",
  is_all_product: false,
};

// User holds card company "all" only
const userAllBenefit = {
  benefit_category_id: CARD_CAT,
  provider_id: SAMSUNG,
  benefit_product_id: ALL_PRODUCT_ID,
  benefit_type: "all",
  product: allProductMeta,
};

assert.equal(userHoldsProviderAllProduct(userAllBenefit), true);

// All-product user sees company-wide discount
assert.equal(
  matchDiscountToUserBenefit(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SAMSUNG,
      benefit_product_id: ALL_PRODUCT_ID,
    },
    userAllBenefit,
    allProductMeta,
  ),
  true,
);

// All-product user does NOT see specific-card discount
assert.equal(
  matchDiscountToUserBenefit(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SAMSUNG,
      benefit_product_id: SPECIFIC_CARD_ID,
    },
    userAllBenefit,
    specificProductMeta,
  ),
  false,
);

// Specific card user sees company-wide discount
const userSpecificBenefit = {
  benefit_category_id: CARD_CAT,
  provider_id: SAMSUNG,
  benefit_product_id: SPECIFIC_CARD_ID,
  benefit_type: "credit",
  product: specificProductMeta,
};

assert.equal(
  matchDiscountToUserBenefit(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SAMSUNG,
      benefit_product_id: ALL_PRODUCT_ID,
    },
    userSpecificBenefit,
    allProductMeta,
  ),
  true,
);

assert.equal(
  matchDiscountToUserBenefit(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SAMSUNG,
      benefit_product_id: SPECIFIC_CARD_ID,
    },
    userSpecificBenefit,
    specificProductMeta,
  ),
  true,
);

// --- Telecom membership (same all-product semantics, separate provider scope) ---
const TELECOM_CAT = 1;
const SKT = 1;
const SKT_ALL_ID = 7001;
const SKT_VIP_ID = 7002;

const sktAllMeta = {
  id: SKT_ALL_ID,
  benefit_type: "all",
  is_all_product: true,
};

const sktVipMeta = {
  id: SKT_VIP_ID,
  benefit_type: null,
  is_all_product: false,
};

const userSktVip = {
  benefit_category_id: TELECOM_CAT,
  provider_id: SKT,
  benefit_product_id: SKT_VIP_ID,
  benefit_type: null,
  product: sktVipMeta,
};

const userSktAll = {
  benefit_category_id: TELECOM_CAT,
  provider_id: SKT,
  benefit_product_id: SKT_ALL_ID,
  benefit_type: "all",
  product: sktAllMeta,
};

assert.equal(userHoldsProviderAllProduct(userSktAll), true);
assert.equal(userHoldsProviderAllProduct(userSktVip), false);

// VIP user matches SKT 전체 discount
assert.equal(
  matchDiscountToUserBenefit(
    {
      benefit_category_id: TELECOM_CAT,
      provider_id: SKT,
      benefit_product_id: SKT_ALL_ID,
    },
    userSktVip,
    sktAllMeta,
  ),
  true,
);

// SKT 전체 user does NOT match VIP-only discount
assert.equal(
  matchDiscountToUserBenefit(
    {
      benefit_category_id: TELECOM_CAT,
      provider_id: SKT,
      benefit_product_id: SKT_VIP_ID,
    },
    userSktAll,
    sktVipMeta,
  ),
  false,
);

// SKT 전체 user matches SKT 전체 discount
assert.equal(
  matchDiscountToUserBenefit(
    {
      benefit_category_id: TELECOM_CAT,
      provider_id: SKT,
      benefit_product_id: SKT_ALL_ID,
    },
    userSktAll,
    sktAllMeta,
  ),
  true,
);

console.log("discount-matching QA: PASS");
