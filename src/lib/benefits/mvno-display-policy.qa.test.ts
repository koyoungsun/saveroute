import assert from "node:assert/strict";

import {
  FEATURED_MVNO_PROVIDER_CODES,
  filterFeaturedMvnoBrandOptions,
  getFeaturedMvnoDisplayName,
} from "@/lib/benefits/mvno-display-policy";

const sampleOptions = [
  { providerId: 1, name: "KT엠모바일", code: "kt_m_mobile", defaultProductId: 10 },
  { providerId: 2, name: "SK세븐모바일", code: "sk_7mobile", defaultProductId: 11 },
  { providerId: 3, name: "LG헬로모바일", code: "lg-hello-mobile", defaultProductId: 12 },
  { providerId: 4, name: "U+유모바일", code: "uplus_mvno", defaultProductId: 13 },
  { providerId: 5, name: "토스모바일", code: "toss-mobile", defaultProductId: 14 },
  { providerId: 6, name: "프리티", code: "pretty", defaultProductId: 15 },
];

assert.equal(FEATURED_MVNO_PROVIDER_CODES.size, 4, "four featured MVNO brands");

const featured = filterFeaturedMvnoBrandOptions(sampleOptions);
assert.equal(featured.length, 4, "only featured brands remain visible");
assert.equal(
  featured.every((option) => FEATURED_MVNO_PROVIDER_CODES.has(option.code)),
  true,
  "filtered options are featured codes only",
);
assert.equal(
  featured.some((option) => option.code === "toss-mobile"),
  false,
  "non-featured brands are hidden from UI",
);

assert.equal(
  getFeaturedMvnoDisplayName({ code: "kt_m_mobile", name: "KT엠모바일" }),
  "KT M모바일",
  "featured display name uses user-facing label",
);

console.log("mvno-display-policy.qa.test.ts: all assertions passed");
