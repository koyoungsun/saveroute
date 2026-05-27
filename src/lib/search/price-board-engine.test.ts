/**
 * 이용요금 계산기 split 모드 회귀 테스트.
 * 실행: npx tsx src/lib/search/price-board-engine.test.ts
 */
import assert from "node:assert/strict";

import {
  calculateSplitPayment,
  expandTicketSlots,
  parseCompanionCoverage,
} from "@/lib/search/price-board-engine";
import type { BrandPriceItemResult, DiscountResult } from "@/types/search";

const adultItem: BrandPriceItemResult = {
  id: "adult",
  brand_id: 30,
  label: "성인 종일권",
  price: 56000,
  sort_order: 0,
  is_active: true,
};

const childItem: BrandPriceItemResult = {
  id: "child",
  brand_id: 30,
  label: "어린이 종일권",
  price: 46000,
  sort_order: 1,
  is_active: true,
};

function makeDiscount(
  partial: Partial<DiscountResult> & Pick<DiscountResult, "id" | "discount_value">,
): DiscountResult {
  return {
    brand_id: 30,
    title: "테스트 할인",
    condition_text: null,
    notice_text: null,
    apply_basis: null,
    stackable_policy: null,
    usage_channel: null,
    installment_condition: null,
    discount_value_max: null,
    max_discount_amount: null,
    discount_unit: "won",
    usage_type: "payment",
    benefit_category_id: 1,
    provider_id: 1,
    benefit_product_id: null,
    valid_until: null,
    has_no_expiry: true,
    benefit_category: null,
    provider: partial.provider ?? { id: 1, name: "삼성카드" },
    benefit_product: null,
    ...partial,
  } as DiscountResult;
}

const slots = expandTicketSlots([adultItem, childItem], { adult: 2, child: 1 });
assert.equal(slots.length, 3);

const defaultCoverage = parseCompanionCoverage(makeDiscount({ id: 1, discount_value: 5000 }));
assert.deepEqual(defaultCoverage, { selfCount: 1, companionCount: 0, maxPeople: 1 });

const cases: Array<{ text: string; expected: { selfCount: number; companionCount: number; maxPeople: number } }> = [
  { text: "동반 1인", expected: { selfCount: 1, companionCount: 1, maxPeople: 2 } },
  { text: "동반 2인", expected: { selfCount: 1, companionCount: 2, maxPeople: 3 } },
  { text: "동반 3인", expected: { selfCount: 1, companionCount: 3, maxPeople: 4 } },
  { text: "최대 2인", expected: { selfCount: 1, companionCount: 1, maxPeople: 2 } },
  { text: "최대 3인", expected: { selfCount: 1, companionCount: 2, maxPeople: 3 } },
  { text: "본인 포함 2인", expected: { selfCount: 1, companionCount: 1, maxPeople: 2 } },
  { text: "본인 포함 최대 4인", expected: { selfCount: 1, companionCount: 3, maxPeople: 4 } },
];

for (const { text, expected } of cases) {
  const coverage = parseCompanionCoverage(
    makeDiscount({ id: 99, discount_value: 5000, notice_text: text }),
  );
  assert.deepEqual(coverage, expected, `coverage for "${text}"`);
}

const splitResult = calculateSplitPayment({
  items: [adultItem, childItem],
  quantities: { adult: 2, child: 0 },
  extraAmount: 0,
  maxDiscountLimitOverride: null,
  discounts: [
    makeDiscount({ id: 10, discount_value: 28000, provider: { id: 1, name: "삼성카드" } }),
    makeDiscount({ id: 11, discount_value: 20000, provider: { id: 2, name: "현대카드" } }),
  ],
});

assert.equal(splitResult.paymentPlans.length, 2);
assert.equal(splitResult.remainingNote, null);
assert.match(splitResult.paymentPlans[0].target, /본인 1명.*적용/);

const groupedSameBenefit = calculateSplitPayment({
  items: [adultItem],
  quantities: { adult: 2 },
  extraAmount: 0,
  maxDiscountLimitOverride: null,
  discounts: [
    makeDiscount({
      id: 10,
      discount_value: 50,
      discount_unit: "percent",
      notice_text: "동반 1인",
      provider: { id: 1, name: "삼성카드" },
    }),
  ],
});

assert.equal(groupedSameBenefit.paymentPlans.length, 1);
assert.equal(groupedSameBenefit.paymentPlans[0].appliedCount, 2);
assert.match(groupedSameBenefit.paymentPlans[0].target, /본인 포함 2명.*50% 적용/);
assert.equal(groupedSameBenefit.remainingNote, null);

const selfIncludedPlan = calculateSplitPayment({
  items: [adultItem, childItem],
  quantities: { adult: 2, child: 2 },
  extraAmount: 0,
  maxDiscountLimitOverride: null,
  discounts: [
    makeDiscount({
      id: 20,
      discount_value: 30,
      discount_unit: "percent",
      notice_text: "본인 포함 최대 4인",
      provider: { id: 3, name: "KT 멤버십" },
    }),
  ],
});

assert.equal(selfIncludedPlan.paymentPlans.length, 1);
assert.equal(selfIncludedPlan.paymentPlans[0].appliedCount, 4);
assert.match(selfIncludedPlan.paymentPlans[0].target, /본인 포함 최대 4명.*30% 적용/);

const splitWithRemainder = calculateSplitPayment({
  items: [adultItem],
  quantities: { adult: 2 },
  extraAmount: 0,
  maxDiscountLimitOverride: null,
  discounts: [makeDiscount({ id: 10, discount_value: 28000, provider: { id: 1, name: "삼성카드" } })],
});

assert.equal(splitWithRemainder.paymentPlans.length, 1);
assert.equal(splitWithRemainder.paymentPlans[0].benefitName, "삼성카드");
assert.match(splitWithRemainder.paymentPlans[0].target, /본인 1명.*28,000원 할인 적용/);
assert.equal(splitWithRemainder.remainingNote, "남은 1명: 일반가 적용");
assert.equal(splitWithRemainder.remainingCount, 1);
assert.equal(splitWithRemainder.totalFinalAmount, 84000);

const emptyQty = calculateSplitPayment({
  items: [adultItem],
  quantities: { adult: 0 },
  extraAmount: 0,
  maxDiscountLimitOverride: null,
  discounts: [makeDiscount({ id: 1, discount_value: 10000 })],
});
assert.equal(emptyQty.paymentPlans.length, 0);
assert.equal(emptyQty.remainingNote, null);
assert.equal(emptyQty.totalFinalAmount, 0);

console.log("price-board-engine.test.ts: ok");
