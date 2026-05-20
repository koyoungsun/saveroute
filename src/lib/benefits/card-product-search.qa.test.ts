import assert from "node:assert/strict";

import {
  filterCardProductsForSearch,
  matchesCardProductSearch,
  normalizeCardProductSearchKey,
  partitionCardDiscountProducts,
} from "@/lib/benefits/card-product-search";
import { normalizeCardProductSearchKey as normalizeKey } from "@/lib/benefits/card-product-name-normalize";
import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";
import { resolveInlineCardProductFields } from "@/lib/admin/create-card-benefit-product";

assert.equal(
  normalizeKey("삼성 iD ON 카드"),
  "삼성 id on",
  "standalone 카드 token removed",
);
assert.equal(
  normalizeKey("신한카드 Deep Dream"),
  "신한 deep dream",
  "suffix 카드 removed from token",
);
assert.equal(
  normalizeKey("KB국민 굿데이카드"),
  "kb국민 굿데이",
  "attached 카드 suffix removed",
);
assert.equal(normalizeCardProductSearchKey("  Deep   Dream "), "deep dream");

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
  name_normalized: "삼성 전체",
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
  name_normalized: "삼성 taptap o",
};

const idOnCard: DiscountBenefitProductOption = {
  id: 4,
  name: "삼성 iD ON 카드",
  benefit_category_id: 2,
  provider_id: 10,
  benefit_type: "credit",
  is_all_product: false,
  product_type: "credit_card",
  grade: null,
  code: "samsung_id_on",
  name_normalized: "삼성 id on",
};

const shinhanDeepDream: DiscountBenefitProductOption = {
  id: 5,
  name: "신한카드 Deep Dream",
  benefit_category_id: 2,
  provider_id: 11,
  benefit_type: "credit",
  is_all_product: false,
  product_type: "credit_card",
  grade: null,
  code: "shinhan_deep_dream",
  name_normalized: "신한 deep dream",
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
  name_normalized: "삼성 체크",
};

const products = [allProduct, creditCard, debitCard, idOnCard, shinhanDeepDream];

const partitioned = partitionCardDiscountProducts(products);
assert.equal(partitioned.allProducts.length, 1);
assert.equal(partitioned.specificProducts.length, 4);

assert.equal(matchesCardProductSearch(creditCard, "taptap"), true, "name search");
assert.equal(matchesCardProductSearch(creditCard, "abc12345"), true, "code search");
assert.equal(matchesCardProductSearch(creditCard, "삼성"), true, "normalized name search");
assert.equal(matchesCardProductSearch(creditCard, "카드"), false, "카드 stopword query");
assert.equal(matchesCardProductSearch(idOnCard, "id on"), true, "id on without 카드");
assert.equal(
  matchesCardProductSearch(shinhanDeepDream, "deep dream"),
  true,
  "deep dream without 신한카드 suffix",
);
assert.equal(
  matchesCardProductSearch(shinhanDeepDream, "신한 deep"),
  true,
  "provider prefix search",
);
assert.equal(matchesCardProductSearch(creditCard, ""), false, "empty query");

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

const deepDreamSearch = filterCardProductsForSearch(products, "deep dream");
assert.deepEqual(
  deepDreamSearch.map((product) => product.id),
  [1, 5],
  "stopword-normalized query finds Deep Dream card",
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
