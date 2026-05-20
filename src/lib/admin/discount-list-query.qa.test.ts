import assert from "node:assert/strict";

import {
  getDiscountFormDefaultOpenGroups,
  isDiscountOptionGroupEnabled,
} from "@/lib/admin/discount-form-option-groups";
import {
  parseDiscountListQuery,
  sortDiscountListRows,
  formatAdminDiscountTimestamp,
  type DiscountListRow,
} from "@/lib/admin/discount-list-query";
import {
  formatAdminDiscountListValue,
  formatMoneyInputDisplay,
  parseNumericInput,
  shouldFormatDiscountValueWithComma,
} from "@/lib/ui/format-money";

assert.equal(parseNumericInput("10,000"), 10000);
assert.equal(parseNumericInput("10000"), 10000);
assert.equal(parseNumericInput("12.5"), 12.5);
assert.equal(parseNumericInput(""), null);
assert.equal(parseNumericInput("abc"), null);

assert.equal(formatMoneyInputDisplay("10000"), "10,000");
assert.equal(formatMoneyInputDisplay("1234567"), "1,234,567");

assert.equal(shouldFormatDiscountValueWithComma("won"), true);
assert.equal(shouldFormatDiscountValueWithComma("percent"), false);

assert.equal(formatAdminDiscountListValue(20, "percent"), "20%");
assert.equal(formatAdminDiscountListValue(20, "percent", 30), "20% ~ 30%");
assert.equal(formatAdminDiscountListValue(5000, "won", 10000), "5,000원 ~ 10,000원");
assert.equal(formatAdminDiscountListValue(12000, "won"), "12,000원");
assert.equal(formatAdminDiscountListValue(0, "free"), "무료");

const parsed = parseDiscountListQuery({ sort: "brand_asc", brand: "megabox", q: "vip" });
assert.equal(parsed.sort, "brand_asc");
assert.equal(parsed.brandSlug, "megabox");
assert.equal(parsed.q, "vip");
assert.equal(parseDiscountListQuery({ sort: "invalid" }).sort, "newest");
assert.equal(parseDiscountListQuery({ sort: "updated_desc" }).sort, "updated_desc");

assert.match(formatAdminDiscountTimestamp("2026-05-20T10:30:00.000Z"), /^2026-05-20 \d{2}:\d{2}$/);
assert.equal(formatAdminDiscountTimestamp(null), "-");

assert.equal(
  getDiscountFormDefaultOpenGroups({
    valid_until: "2026-05-20",
    notice_text: "중복 불가",
    source_url: "https://example.com",
    status: "hidden",
  }).notice,
  true,
);
assert.equal(
  getDiscountFormDefaultOpenGroups({
    valid_until: "2026-05-20",
    source_url: "https://example.com",
    status: "hidden",
  }).period,
  true,
);
assert.equal(
  getDiscountFormDefaultOpenGroups({ source_url: "https://example.com" }).data,
  true,
);
assert.equal(
  getDiscountFormDefaultOpenGroups({ status: "active" }).visibility,
  true,
);

const optionFormData = new FormData();
optionFormData.set("enable_period", "on");
assert.equal(isDiscountOptionGroupEnabled(optionFormData, "period"), true);
assert.equal(isDiscountOptionGroupEnabled(optionFormData, "data"), false);

const rows: DiscountListRow[] = [
  {
    id: 1,
    title: "A",
    discount_value: 10,
    discount_unit: "percent",
    usage_type: "unknown",
    usage_channel: null,
    status: "hidden",
    data_confidence: "medium",
    valid_until: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-03-01T00:00:00.000Z",
    brand: { name: "나브랜드", slug: "brand-b" },
    benefit_category: null,
    provider: null,
    benefit_product: null,
  },
  {
    id: 2,
    title: "B",
    discount_value: 30,
    discount_unit: "percent",
    usage_type: "unknown",
    usage_channel: null,
    status: "active",
    data_confidence: "medium",
    valid_until: null,
    created_at: "2026-02-01T00:00:00.000Z",
    updated_at: "2026-05-20T00:00:00.000Z",
    brand: { name: "가브랜드", slug: "brand-a" },
    benefit_category: null,
    provider: null,
    benefit_product: null,
  },
  {
    id: 3,
    title: "C",
    discount_value: 15,
    discount_unit: "percent",
    usage_type: "unknown",
    usage_channel: null,
    status: "active",
    data_confidence: "medium",
    valid_until: null,
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    brand: { name: "다브랜드", slug: "brand-c" },
    benefit_category: null,
    provider: null,
    benefit_product: null,
  },
];

assert.deepEqual(
  sortDiscountListRows(rows, "value_desc").map((row) => row.id),
  [2, 3, 1],
);
assert.deepEqual(
  sortDiscountListRows(rows, "brand_asc").map((row) => row.id),
  [2, 1, 3],
);
assert.deepEqual(
  sortDiscountListRows(rows, "status_asc").map((row) => row.id),
  [2, 3, 1],
);
assert.deepEqual(
  sortDiscountListRows(rows, "updated_desc").map((row) => row.id),
  [2, 3, 1],
);
assert.deepEqual(
  sortDiscountListRows(rows, "updated_asc").map((row) => row.id),
  [1, 3, 2],
);

console.log("admin-discount-list QA: PASS");
