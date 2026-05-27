import {
  hasDiscountValueRange,
} from "@/lib/discounts/format-discount-value";
import { isPercentLikeDiscountUnit } from "@/lib/discounts/discount-units";
import type { DiscountUnit } from "@/types/search";

import { isPointRelatedDiscountUnit } from "@/lib/search/format-point-benefit-info";

export type DiscountEstimateInput = {
  paymentAmount: number;
  discount_value: number | string;
  discount_value_max?: number | string | null;
  max_discount_amount?: number | string | null;
  /** 계산기 최대 할인제한금액 — 있으면 max_discount_amount보다 우선 (할인액 상한) */
  max_support_amount_override?: number | string | null;
  discount_unit: DiscountUnit | string;
};

export type PaymentDiscountEstimate = {
  kind: "payment";
  discountAmount: number;
  paymentAmount: number;
  appliedLabel: string;
};

export type InfoDiscountEstimate = {
  kind: "info";
  message: string;
  appliedLabel: string;
};

export type DiscountEstimate = PaymentDiscountEstimate | InfoDiscountEstimate;

function pickUpperBound(value: number | string, valueMax?: number | string | null) {
  const min = Number(value) || 0;
  const max = hasDiscountValueRange(valueMax) ? Number(valueMax) : null;

  if (max != null && max >= min) {
    return { min, max, use: max };
  }

  return { min, max: null, use: min };
}

function readMaxDiscountCap(maxDiscountAmount?: number | string | null) {
  if (maxDiscountAmount == null || maxDiscountAmount === "") {
    return null;
  }

  const parsed = Number(maxDiscountAmount);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function resolveMaxDiscountCap(input: DiscountEstimateInput) {
  const override = readMaxDiscountCap(input.max_support_amount_override);
  if (override != null) {
    return override;
  }

  return readMaxDiscountCap(input.max_discount_amount);
}

function applyMaxDiscountCap(discountAmount: number, input: DiscountEstimateInput) {
  const cap = resolveMaxDiscountCap(input);
  if (cap == null) {
    return discountAmount;
  }

  return Math.min(discountAmount, cap);
}

export function calculateDiscountEstimate(
  input: DiscountEstimateInput,
): DiscountEstimate | null {
  const paymentAmount = input.paymentAmount;

  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return null;
  }

  const unit = input.discount_unit;
  const bounds = pickUpperBound(input.discount_value, input.discount_value_max);

  if (isPointRelatedDiscountUnit(unit)) {
    return null;
  }

  if (unit === "percent") {
    let discountAmount = Math.round((paymentAmount * bounds.use) / 100);
    discountAmount = applyMaxDiscountCap(discountAmount, input);
    const finalPayment = Math.max(0, paymentAmount - discountAmount);

    return {
      kind: "payment",
      discountAmount,
      paymentAmount: finalPayment,
      appliedLabel:
        bounds.max != null && bounds.max > bounds.min
          ? `최대 ${bounds.use}% 할인`
          : `${bounds.use}% 할인`,
    };
  }

  if (unit === "won" || unit === "amount" || unit === "fixed_amount") {
    let discountAmount = applyMaxDiscountCap(bounds.use, input);
    discountAmount = Math.min(paymentAmount, discountAmount);
    const finalPayment = Math.max(0, paymentAmount - discountAmount);

    return {
      kind: "payment",
      discountAmount,
      paymentAmount: finalPayment,
      appliedLabel:
        bounds.max != null && bounds.max > bounds.min
          ? `최대 ${bounds.use.toLocaleString("ko-KR")}원 할인`
          : `${bounds.use.toLocaleString("ko-KR")}원 할인`,
    };
  }

  if (unit === "special_price") {
    return {
      kind: "info",
      message: `${bounds.use.toLocaleString("ko-KR")}원 특가 혜택입니다. 실제 결제금액은 특가 조건을 확인해 주세요.`,
      appliedLabel: `${bounds.use.toLocaleString("ko-KR")}원 특가`,
    };
  }

  if (unit === "free") {
    return {
      kind: "info",
      message: "무료 혜택은 결제금액 할인 계산에 반영되지 않습니다.",
      appliedLabel: "무료",
    };
  }

  if (isPercentLikeDiscountUnit(unit)) {
    return null;
  }

  return {
    kind: "info",
    message: "이 혜택은 간단 계산기로 예상 금액을 표시하기 어렵습니다.",
    appliedLabel: "할인 혜택",
  };
}

export function parsePaymentInput(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) {
    return 0;
  }

  const parsed = Number(digits);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatPaymentInput(value: number) {
  if (!value) {
    return "";
  }

  return value.toLocaleString("ko-KR");
}
