import { describe, expect, it } from "vitest";

import { calculateDiscountEstimate } from "./calculate-discount-estimate";

describe("calculateDiscountEstimate max_discount_amount", () => {
  it("caps percent discount by max_discount_amount", () => {
    const result = calculateDiscountEstimate({
      paymentAmount: 178_000,
      discount_value: 50,
      discount_unit: "percent",
      max_support_amount_override: 10_000,
    });

    expect(result?.kind).toBe("payment");
    if (result?.kind === "payment") {
      expect(result.discountAmount).toBe(10_000);
      expect(result.paymentAmount).toBe(168_000);
    }
  });

  it("caps fixed amount discount by max_discount_amount", () => {
    const result = calculateDiscountEstimate({
      paymentAmount: 100_000,
      discount_value: 15_000,
      discount_unit: "won",
      max_support_amount_override: 10_000,
    });

    expect(result?.kind).toBe("payment");
    if (result?.kind === "payment") {
      expect(result.discountAmount).toBe(10_000);
      expect(result.paymentAmount).toBe(90_000);
    }
  });

  it("supports fixed_amount unit", () => {
    const result = calculateDiscountEstimate({
      paymentAmount: 50_000,
      discount_value: 5_000,
      discount_unit: "fixed_amount",
    });

    expect(result?.kind).toBe("payment");
    if (result?.kind === "payment") {
      expect(result.discountAmount).toBe(5_000);
      expect(result.paymentAmount).toBe(45_000);
    }
  });
});
