import assert from "node:assert/strict";
import test from "node:test";

import { isUserBenefitEligibleForMatching } from "./benefit-product-request-status.ts";

test("pending/rejected user benefits are excluded from discount matching", () => {
  assert.equal(
    isUserBenefitEligibleForMatching({
      benefit_product_id: null,
      approval_status: "pending",
    }),
    false,
  );
  assert.equal(
    isUserBenefitEligibleForMatching({
      benefit_product_id: null,
      approval_status: "rejected",
    }),
    false,
  );
  assert.equal(
    isUserBenefitEligibleForMatching({
      benefit_product_id: 10,
      approval_status: "approved",
    }),
    true,
  );
  assert.equal(
    isUserBenefitEligibleForMatching({
      benefit_product_id: 10,
      approval_status: null,
    }),
    true,
  );
  assert.equal(
    isUserBenefitEligibleForMatching({
      benefit_product_id: null,
      approval_status: null,
    }),
    false,
  );
});
