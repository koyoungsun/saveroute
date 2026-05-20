import assert from "node:assert/strict";

import {
  filterCardProductsForSearch,
  matchesCardProductSearch,
  partitionCardDiscountProducts,
} from "@/lib/benefits/card-product-search";
import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import { resolveInlineCardProductFields } from "@/lib/admin/create-card-benefit-product";

const allProduct: DiscountBenefitProductOption = {
  id: 1,
  name: "삼성카드 전체",
  benefit_category_id: 2,
  provider_id: 10,
  benefit_type: "all",
  is_all_product: true,
  product_type: "credit_card",
  grade: null,
  code: "samsung_card_all",
};

const creditCard: DiscountBenefitProductOption = {
  id: 2,
  name: "삼성카드 taptap O",
  benefit_category_id: 2,
  provider_id: 10,
  benefit_type: "credit",
  is_all_product: false,
  product_type: "credit_card",
  grade: null,
  code: "samsung_taptap_o_abc12345",
  name_normalized: "삼성카드 taptap O",
};

const debitCard: DiscountBenefitProductOption = {
  id: 3,
  name: "삼성카드 체크",
  benefit_category_id: 2,
  provider_id: 10,
  benefit_type: "debit",
  is_all_product: false,
  product_type: "debit_card",
  grade: null,
  code: "samsung_debit_xyz",
};

const products = [allProduct, creditCard, debitCard];

const partitioned = partitionCardDiscountProducts(products);
assert.equal(partitioned.allProducts.length, 1);
assert.equal(partitioned.specificProducts.length, 2);

assert.equal(
  matchesCardProductSearch(creditCard, "taptap"),
  true,
  "name search",
);
assert.equal(
  matchesCardProductSearch(creditCard, "abc12345"),
  true,
  "code search",
);
assert.equal(
  matchesCardProductSearch(creditCard, "삼"),
  true,
  "normalized name search",
);
assert.equal(
  matchesCardProductSearch(creditCard, ""),
  false,
  "empty query should not match",
);

const withoutSearch = filterCardProductsForSearch(products, "");
assert.deepEqual(
  withoutSearch.map((product) => product.id),
  [1],
  "only all products without search query",
);

const withSearch = filterCardProductsForSearch(products, "체크");
assert.deepEqual(
  withSearch.map((product) => product.id),
  [1, 3],
  "all product stays on top with specific search results",
);

const creditFields = resolveInlineCardProductFields("credit");
assert.equal(creditFields.productType, "credit_card");
assert.equal(creditFields.benefitType, "credit");
assert.equal(creditFields.isAllProduct, false);
assert.equal(creditFields.grade, null);

const debitFields = resolveInlineCardProductFields("debit");
assert.equal(debitFields.productType, "debit_card");
assert.equal(debitFields.benefitType, "debit");
assert.equal(debitFields.cardType, "debit");

console.log("card-product-search QA: PASS");
