import assert from "node:assert/strict";

import {
  buildAnonymizedVisitorLabel,
  formatProfileAgeLabel,
  formatProfileGenderLabel,
} from "@/lib/admin/ops-panel-anonymize";

assert.equal(
  buildAnonymizedVisitorLabel({
    userId: "11111111-2222-3333-4444-555555a13f",
    sessionId: null,
  }),
  "로그인 사용자 #A13F",
);

assert.equal(
  buildAnonymizedVisitorLabel({
    userId: null,
    sessionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeee9f01",
  }),
  "비로그인 사용자 #9F01",
);

assert.equal(
  buildAnonymizedVisitorLabel({ userId: null, sessionId: null }),
  "비로그인 사용자",
);

assert.equal(formatProfileGenderLabel("male"), "남성");
assert.equal(formatProfileGenderLabel(null), "정보 없음");
assert.equal(formatProfileAgeLabel("30s"), "30대");
assert.equal(formatProfileAgeLabel(undefined), "정보 없음");

console.log("admin-ops-panel QA: PASS");
