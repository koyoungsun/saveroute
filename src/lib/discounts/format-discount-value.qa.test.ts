import assert from "node:assert/strict";

import { parseDiscountValueFields } from "@/lib/admin/parse-discount-value-fields";
import {
  formatDiscountValueDisplay,
  getEffectiveDiscountValueForSort,
  hasDiscountValueRange,
} from "@/lib/discounts/format-discount-value";
import { formatAdminDiscountListValue } from "@/lib/ui/format-money";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }
  return data;
}

assert.equal(formatAdminDiscountListValue(20, "percent"), "20%");
assert.equal(formatAdminDiscountListValue(5, "point_percent"), "5% 포인트");
assert.equal(formatAdminDiscountListValue(20, "percent", 30), "20% ~ 30%");
assert.equal(formatAdminDiscountListValue(5, "point_percent", 10), "5% ~ 10% 포인트");
assert.equal(formatAdminDiscountListValue(5000, "won", 10000), "5,000원 ~ 10,000원");
assert.equal(
  formatAdminDiscountListValue(50, "per_amount", null, 1000),
  "1,000원당 50원 할인",
);

assert.equal(
  formatDiscountValueDisplay({
    value: 5,
    unit: "point_percent",
    style: "search",
  }),
  "5% 포인트 적립",
);

assert.equal(
  formatDiscountValueDisplay({
    value: 20,
    valueMax: 30,
    unit: "percent",
    style: "search",
  }),
  "최소 20% ~ 최대 30% 할인",
);

assert.equal(
  formatDiscountValueDisplay({
    value: 5000,
    valueMax: 10000,
    unit: "won",
    style: "search",
  }),
  "최소 5,000원 ~ 최대 10,000원 할인",
);

assert.equal(hasDiscountValueRange(null), false);
assert.equal(hasDiscountValueRange(30), true);

assert.equal(
  getEffectiveDiscountValueForSort({
    discount_value: 20,
    discount_value_max: 30,
    discount_unit: "percent",
  }),
  30,
);

const singlePercent = parseDiscountValueFields(
  form({
    discount_value_mode: "single",
    discount_value: "20",
  }),
  "percent",
);
assert.equal(singlePercent.ok, true);
if (singlePercent.ok) {
  assert.equal(singlePercent.value.discountValue, 20);
  assert.equal(singlePercent.value.discountValueMax, null);
}

const rangePercent = parseDiscountValueFields(
  form({
    discount_value_mode: "range",
    discount_value: "20",
    discount_value_max: "30",
  }),
  "percent",
);
assert.equal(rangePercent.ok, true);
if (rangePercent.ok) {
  assert.equal(rangePercent.value.discountValue, 20);
  assert.equal(rangePercent.value.discountValueMax, 30);
}

const rangeAmount = parseDiscountValueFields(
  form({
    discount_value_mode: "range",
    discount_value: "5,000",
    discount_value_max: "10,000",
  }),
  "won",
);
assert.equal(rangeAmount.ok, true);
if (rangeAmount.ok) {
  assert.equal(rangeAmount.value.discountValue, 5000);
  assert.equal(rangeAmount.value.discountValueMax, 10000);
}

const invalidRange = parseDiscountValueFields(
  form({
    discount_value_mode: "range",
    discount_value: "30",
    discount_value_max: "20",
  }),
  "percent",
);
assert.equal(invalidRange.ok, false);

console.log("discount-value-range QA: PASS");
