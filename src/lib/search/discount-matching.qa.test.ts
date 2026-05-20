/**
 * User QA #6 — discount matching rules (unit-level, no DB).
 */
import assert from "node:assert/strict";
import {
  matchDiscountToBenefits,
  matchDiscountToUserBenefit,
  userHoldsProviderAllProduct,
  type BenefitProductMatchMeta,
} from "./discount-matching";

const CARD_CAT = 2;
const SAMSUNG = 10;
const ALL_PRODUCT_ID = 9001;
const SPECIFIC_CARD_ID = 9002;

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

// Card regression via matchDiscountToBenefits
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SAMSUNG,
      benefit_product_id: SPECIFIC_CARD_ID,
    },
    [userSpecificBenefit],
    new Map<number, BenefitProductMatchMeta>([
      [ALL_PRODUCT_ID, allProductMeta],
      [SPECIFIC_CARD_ID, specificProductMeta],
    ]),
  ),
  true,
);

const SPECIFIC_CARD_ID_2 = 9003;
const specificProductMeta2 = {
  id: SPECIFIC_CARD_ID_2,
  benefit_type: "debit",
  is_all_product: false,
};

const userSpecificBenefit2 = {
  benefit_category_id: CARD_CAT,
  provider_id: SAMSUNG,
  benefit_product_id: SPECIFIC_CARD_ID_2,
  benefit_type: "debit",
  product: specificProductMeta2,
};

const cardProductById = new Map<number, BenefitProductMatchMeta>([
  [ALL_PRODUCT_ID, allProductMeta],
  [SPECIFIC_CARD_ID, specificProductMeta],
  [SPECIFIC_CARD_ID_2, specificProductMeta2],
]);

const multiCardDiscount = {
  benefit_category_id: CARD_CAT,
  provider_id: SAMSUNG,
  benefit_product_id: ALL_PRODUCT_ID,
  benefit_product_ids: [ALL_PRODUCT_ID, SPECIFIC_CARD_ID, SPECIFIC_CARD_ID_2],
};

assert.equal(
  matchDiscountToBenefits(multiCardDiscount, [userSpecificBenefit], cardProductById),
  true,
);
assert.equal(
  matchDiscountToBenefits(multiCardDiscount, [userSpecificBenefit2], cardProductById),
  true,
);
assert.equal(
  matchDiscountToBenefits(multiCardDiscount, [userAllBenefit], cardProductById),
  true,
);
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SAMSUNG,
      benefit_product_id: SPECIFIC_CARD_ID,
      benefit_product_ids: [SPECIFIC_CARD_ID],
    },
    [userAllBenefit],
    cardProductById,
  ),
  false,
);

// --- Telecom membership (same all-product semantics, separate provider scope) ---
const TELECOM_CAT = 1;
const SKT = 1;
const SKT_ALL_ID = 7001;
const SKT_VIP_ID = 7002;
const SKT_VVIP_ID = 7003;
const SKT_NORMAL_ID = 7004;

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

const sktVvipMeta = {
  id: SKT_VVIP_ID,
  benefit_type: null,
  is_all_product: false,
};

const sktNormalMeta = {
  id: SKT_NORMAL_ID,
  benefit_type: null,
  is_all_product: false,
};

const telecomProductById = new Map<number, BenefitProductMatchMeta>([
  [SKT_ALL_ID, sktAllMeta],
  [SKT_VIP_ID, sktVipMeta],
  [SKT_VVIP_ID, sktVvipMeta],
  [SKT_NORMAL_ID, sktNormalMeta],
]);

const userSktVip = {
  benefit_category_id: TELECOM_CAT,
  provider_id: SKT,
  benefit_product_id: SKT_VIP_ID,
  benefit_type: null,
  product: sktVipMeta,
};

const userSktVvip = {
  benefit_category_id: TELECOM_CAT,
  provider_id: SKT,
  benefit_product_id: SKT_VVIP_ID,
  benefit_type: null,
  product: sktVvipMeta,
};

const userSktNormal = {
  benefit_category_id: TELECOM_CAT,
  provider_id: SKT,
  benefit_product_id: SKT_NORMAL_ID,
  benefit_type: null,
  product: sktNormalMeta,
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

// VIP + VVIP 복수 등급 할인
const multiTierDiscount = {
  benefit_category_id: TELECOM_CAT,
  provider_id: SKT,
  benefit_product_id: SKT_VIP_ID,
  benefit_product_ids: [SKT_VIP_ID, SKT_VVIP_ID],
};

assert.equal(
  matchDiscountToBenefits(multiTierDiscount, [userSktVip], telecomProductById),
  true,
);
assert.equal(
  matchDiscountToBenefits(multiTierDiscount, [userSktVvip], telecomProductById),
  true,
);
assert.equal(
  matchDiscountToBenefits(multiTierDiscount, [userSktNormal], telecomProductById),
  false,
);
assert.equal(
  matchDiscountToBenefits(multiTierDiscount, [userSktAll], telecomProductById),
  false,
);

// SKT 일반 사용자는 VIP/VVIP 전용 할인에 매칭되지 않음
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: TELECOM_CAT,
      provider_id: SKT,
      benefit_product_id: SKT_VIP_ID,
    },
    [userSktNormal],
    telecomProductById,
  ),
  false,
);
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: TELECOM_CAT,
      provider_id: SKT,
      benefit_product_id: SKT_VVIP_ID,
    },
    [userSktNormal],
    telecomProductById,
  ),
  false,
);

// SKT 일반 사용자는 SKT 전체 할인만 매칭
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: TELECOM_CAT,
      provider_id: SKT,
      benefit_product_id: SKT_ALL_ID,
    },
    [userSktNormal],
    telecomProductById,
  ),
  true,
);

// --- Shinhan card: Love vs Deep Dream (no credit-type-wide matching) ---
const SHINHAN = 20;
const SHINHAN_ALL_ID = 8001;
const SHINHAN_LOVE_ID = 8002;
const SHINHAN_DEEP_DREAM_ID = 8003;

const shinhanAllMeta = {
  id: SHINHAN_ALL_ID,
  benefit_type: "all",
  is_all_product: true,
};

const shinhanLoveMeta = {
  id: SHINHAN_LOVE_ID,
  benefit_type: "credit",
  is_all_product: false,
};

const shinhanDeepDreamMeta = {
  id: SHINHAN_DEEP_DREAM_ID,
  benefit_type: "credit",
  is_all_product: false,
};

const userShinhanLove = {
  benefit_category_id: CARD_CAT,
  provider_id: SHINHAN,
  benefit_product_id: SHINHAN_LOVE_ID,
  benefit_type: "credit",
  product: shinhanLoveMeta,
};

const shinhanProductById = new Map<number, BenefitProductMatchMeta>([
  [SHINHAN_ALL_ID, shinhanAllMeta],
  [SHINHAN_LOVE_ID, shinhanLoveMeta],
  [SHINHAN_DEEP_DREAM_ID, shinhanDeepDreamMeta],
]);

// Love user matches Shinhan 전체 (all-product) discount
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SHINHAN,
      benefit_product_id: SHINHAN_ALL_ID,
    },
    [userShinhanLove],
    shinhanProductById,
  ),
  true,
);

// Love user matches Love-specific discount
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SHINHAN,
      benefit_product_id: SHINHAN_LOVE_ID,
    },
    [userShinhanLove],
    shinhanProductById,
  ),
  true,
);

// Love user does NOT match Deep Dream-specific discount
assert.equal(
  matchDiscountToBenefits(
    {
      benefit_category_id: CARD_CAT,
      provider_id: SHINHAN,
      benefit_product_id: SHINHAN_DEEP_DREAM_ID,
    },
    [userShinhanLove],
    shinhanProductById,
  ),
  false,
);

console.log("discount-matching QA: PASS");
