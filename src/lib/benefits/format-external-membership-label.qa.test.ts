import assert from "node:assert/strict";

import {
  formatExternalMembershipOptionLabel,
  isRedundantExternalMembershipSuffix,
  normalizeBenefitLabelKey,
} from "@/lib/benefits/format-external-membership-label";

assert.equal(
  normalizeBenefitLabelKey("마이신한 포인트"),
  normalizeBenefitLabelKey("마이신한포인트"),
  "whitespace differences normalize to the same key",
);

assert.equal(
  formatExternalMembershipOptionLabel({
    providerName: "마이신한 포인트",
    name: "마이신한포인트 전체",
  }),
  "마이신한 포인트",
  "hide repeated all-product suffix",
);

assert.equal(
  formatExternalMembershipOptionLabel({
    providerName: "CJ ONE",
    name: "CJ ONE 전체",
  }),
  "CJ ONE",
  "hide provider repeat with 전체 suffix",
);

assert.equal(
  formatExternalMembershipOptionLabel({
    providerName: "해피포인트",
    name: "파리바게뜨 전용",
  }),
  "해피포인트 · 파리바게뜨 전용",
  "keep meaningful product variant",
);

assert.equal(
  formatExternalMembershipOptionLabel({
    providerName: "L.POINT",
    name: "롯데시네마 전용",
  }),
  "L.POINT · 롯데시네마 전용",
  "keep partner-specific label",
);

assert.equal(
  formatExternalMembershipOptionLabel({
    providerName: "CJ ONE",
    name: "CJ ONE ALL",
  }),
  "CJ ONE",
  "hide english all suffix",
);

assert.equal(
  formatExternalMembershipOptionLabel({ name: "마이신한포인트 전체" }),
  "마이신한포인트",
  "provider-less option still strips redundant suffix",
);

assert.equal(isRedundantExternalMembershipSuffix("CJ ONE 전체"), true);
assert.equal(isRedundantExternalMembershipSuffix("파리바게뜨 전용"), false);

console.log("format-external-membership-label.qa.test.ts: all assertions passed");
