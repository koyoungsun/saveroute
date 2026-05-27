import type { DiscountEstimate, PaymentDiscountEstimate } from "@/lib/search/calculate-discount-estimate";
import { calculateDiscountEstimate } from "@/lib/search/calculate-discount-estimate";
import { isPercentLikeDiscountUnit } from "@/lib/discounts/discount-units";
import { supportsPaymentDiscountEstimate } from "@/lib/search/format-point-benefit-info";
import type { BrandPriceItemResult, DiscountResult } from "@/types/search";

export type PriceInputMode = "per_person" | "ticket_type";
export type PaymentApplyMode = "single" | "per_person" | "split" | "grouped_prepay";

export type TicketSlot = {
  id: string;
  itemId: string;
  label: string;
  price: number;
};

export type SplitPaymentPlan = {
  label: string;
  benefitName: string;
  /** 혜택명 뒤에 붙는 문구 (예: "본인 1명 50% 적용") */
  target: string;
  appliedCount: number;
  discountAmount: number;
  finalAmount: number;
};

export type SplitPaymentResult = {
  paymentPlans: SplitPaymentPlan[];
  remainingCount: number;
  remainingAmount: number;
  remainingNote: string | null;
  totalDiscountAmount: number;
  totalFinalAmount: number;
};

export type CompanionCoverage = {
  selfCount: number;
  companionCount: number;
  maxPeople: number;
};

type ParsedCoverageMeta = CompanionCoverage & {
  includesSelfPhrase: boolean;
};

export type PriceBoardEngineInput = {
  items: BrandPriceItemResult[];
  quantities: Record<string, number>;
  extraAmount: number;
  paymentApplyMode: PaymentApplyMode;
  highlightDiscount: DiscountResult | null;
  availableDiscounts?: DiscountResult[];
  maxDiscountLimitOverride: number | null;
};

export type PriceBoardResult = {
  ticketTotal: number;
  extraAmount: number;
  totalAmount: number;
  ticketCount: number;
  estimate: DiscountEstimate | null;
  splitResult: SplitPaymentResult | null;
  mode: PaymentApplyMode;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function looksTicketCountBased(discount: DiscountResult) {
  const text = normalizeText(
    `${discount.condition_text ?? ""} ${discount.notice_text ?? ""} ${discount.installment_condition ?? ""}`,
  );
  return /(매수|[0-9]+매|1매|매당|1인|인당)/.test(text);
}

function splitBenefitName(discount: DiscountResult): string {
  return (
    discount.provider?.name ??
    discount.benefit_product?.name ??
    discount.title ??
    "혜택"
  );
}

function clampPeople(value: number) {
  return Math.max(1, Number.isFinite(value) ? Math.floor(value) : 1);
}

function buildCoverage(selfCount: number, companionCount: number): ParsedCoverageMeta {
  const safeSelf = Math.max(0, selfCount);
  const safeCompanion = Math.max(0, companionCount);
  const maxPeople = clampPeople(safeSelf + safeCompanion);

  return {
    selfCount: safeSelf > 0 ? safeSelf : 1,
    companionCount: safeCompanion,
    maxPeople,
    includesSelfPhrase: false,
  };
}

function parseCompanionCoverageMeta(discount: DiscountResult): ParsedCoverageMeta {
  const text = `${discount.condition_text ?? ""} ${discount.notice_text ?? ""}`;
  const compact = normalizeText(text);

  // 본인 포함 최대 N인 / 본인 포함 N인
  const selfIncludedMax = compact.match(/본인포함최대(\d+)인/);
  if (selfIncludedMax) {
    const maxPeople = clampPeople(Number(selfIncludedMax[1]));
    return {
      selfCount: 1,
      companionCount: Math.max(0, maxPeople - 1),
      maxPeople,
      includesSelfPhrase: true,
    };
  }

  const selfIncluded = compact.match(/본인포함(\d+)인/);
  if (selfIncluded) {
    const maxPeople = clampPeople(Number(selfIncluded[1]));
    return {
      selfCount: 1,
      companionCount: Math.max(0, maxPeople - 1),
      maxPeople,
      includesSelfPhrase: true,
    };
  }

  // 동반 N인 / 동반인 N명
  const companionExplicit = compact.match(/동반(\d+)인|동반인(\d+)명?/);
  if (companionExplicit) {
    const companionCount = clampPeople(Number(companionExplicit[1] || companionExplicit[2]));
    return {
      selfCount: 1,
      companionCount,
      maxPeople: clampPeople(1 + companionCount),
      includesSelfPhrase: false,
    };
  }

  if (/동반인/.test(compact)) {
    return {
      selfCount: 1,
      companionCount: 1,
      maxPeople: 2,
      includesSelfPhrase: false,
    };
  }

  // 최대 N인
  const maxOnly = compact.match(/최대(\d+)인/);
  if (maxOnly) {
    const maxPeople = clampPeople(Number(maxOnly[1]));
    return {
      selfCount: 1,
      companionCount: Math.max(0, maxPeople - 1),
      maxPeople,
      includesSelfPhrase: /본인/.test(compact),
    };
  }

  if (/동반/.test(compact)) {
    return {
      selfCount: 1,
      companionCount: 1,
      maxPeople: 2,
      includesSelfPhrase: false,
    };
  }

  return { ...buildCoverage(1, 0), includesSelfPhrase: false };
}

/** 동반·최대 N인·본인 포함 등 텍스트에서 적용 가능 인원 구조를 추정한다. */
export function parseCompanionCoverage(discount: DiscountResult): CompanionCoverage {
  const { includesSelfPhrase: _ignored, ...coverage } = parseCompanionCoverageMeta(discount);
  return coverage;
}

function formatSplitBenefitPhrase(discount: DiscountResult): string {
  const unit = discount.discount_unit;
  const raw = Number(discount.discount_value) || 0;
  const rawMax = discount.discount_value_max != null ? Number(discount.discount_value_max) : null;
  const value =
    rawMax != null && Number.isFinite(rawMax) && rawMax >= raw ? rawMax : raw;

  if (isPercentLikeDiscountUnit(unit)) {
    return `${value}%`;
  }

  if (unit === "won" || unit === "amount") {
    return `${value.toLocaleString("ko-KR")}원 할인`;
  }

  if (unit === "free") {
    return "무료";
  }

  if (unit === "special_price") {
    return `${value.toLocaleString("ko-KR")}원 특가`;
  }

  return "혜택";
}

function formatCoverageTarget(
  coverage: ParsedCoverageMeta,
  appliedCount: number,
): string {
  const count = Math.max(1, appliedCount);

  if (coverage.selfCount === 1 && coverage.companionCount === 0) {
    return "본인 1명";
  }

  if (coverage.selfCount === 1 && coverage.companionCount >= 1) {
    if (coverage.includesSelfPhrase && count >= coverage.maxPeople) {
      return `본인 포함 최대 ${coverage.maxPeople}명`;
    }
    return `본인 포함 ${count}명`;
  }

  if (count === 1) {
    return "본인 1명";
  }

  return `본인 포함 ${count}명`;
}

function formatSplitPlanTarget(
  discount: DiscountResult,
  coverage: ParsedCoverageMeta,
  appliedCount: number,
): string {
  const audience = formatCoverageTarget(coverage, appliedCount);
  const benefit = formatSplitBenefitPhrase(discount);
  return `${audience} ${benefit} 적용`;
}

export function expandTicketSlots(
  items: BrandPriceItemResult[],
  quantities: Record<string, number>,
): TicketSlot[] {
  const slots: TicketSlot[] = [];

  for (const item of items) {
    const qty = Math.max(0, quantities[item.id] ?? 0);
    for (let i = 0; i < qty; i++) {
      slots.push({
        id: `${item.id}-${i}`,
        itemId: item.id,
        label: item.label,
        price: Number(item.price) || 0,
      });
    }
  }

  return slots;
}

function estimatePaymentDiscount(
  paymentAmount: number,
  discount: DiscountResult,
  maxDiscountLimitOverride: number | null,
): PaymentDiscountEstimate | null {
  if (paymentAmount <= 0) {
    return null;
  }

  const estimate = calculateDiscountEstimate({
    paymentAmount,
    discount_value: discount.discount_value,
    discount_value_max: discount.discount_value_max,
    max_discount_amount: discount.max_discount_amount,
    max_support_amount_override: maxDiscountLimitOverride,
    discount_unit: discount.discount_unit,
  });

  return estimate?.kind === "payment" ? estimate : null;
}

function scoreDiscountForSlots(
  discount: DiscountResult,
  unassigned: TicketSlot[],
  maxPeople: number,
  maxDiscountLimitOverride: number | null,
): number {
  const sorted = [...unassigned].sort((a, b) => b.price - a.price);
  const selected = sorted.slice(0, maxPeople);
  if (selected.length === 0) {
    return 0;
  }

  const basisAmount = selected.reduce((sum, slot) => sum + slot.price, 0);
  const estimate = estimatePaymentDiscount(basisAmount, discount, maxDiscountLimitOverride);
  return estimate?.discountAmount ?? 0;
}

function emptySplitResult(extraAmount: number): SplitPaymentResult {
  return {
    paymentPlans: [],
    remainingCount: 0,
    remainingAmount: 0,
    remainingNote: null,
    totalDiscountAmount: 0,
    totalFinalAmount: Math.max(0, extraAmount),
  };
}

export function calculateSinglePayment(input: {
  totalAmount: number;
  discount: DiscountResult | null;
  maxDiscountLimitOverride: number | null;
}): DiscountEstimate | null {
  const { totalAmount, discount, maxDiscountLimitOverride } = input;
  if (totalAmount <= 0 || !discount) return null;
  if (!supportsPaymentDiscountEstimate(discount.discount_unit)) return null;

  return calculateDiscountEstimate({
    paymentAmount: totalAmount,
    discount_value: discount.discount_value,
    discount_value_max: discount.discount_value_max,
    max_discount_amount: discount.max_discount_amount,
    max_support_amount_override: maxDiscountLimitOverride,
    discount_unit: discount.discount_unit,
  });
}

export function calculateGroupedPrepay(input: {
  totalAmount: number;
  ticketCount: number;
  discount: DiscountResult | null;
  maxDiscountLimitOverride: number | null;
}): DiscountEstimate | null {
  const { totalAmount, ticketCount, discount, maxDiscountLimitOverride } = input;
  if (totalAmount <= 0 || !discount) return null;
  if (!supportsPaymentDiscountEstimate(discount.discount_unit)) return null;

  if (
    ticketCount > 0 &&
    looksTicketCountBased(discount) &&
    (discount.discount_unit === "won" ||
      discount.discount_unit === "amount")
  ) {
    const perTicket = Math.max(0, Number(discount.discount_value) || 0);
    const raw = perTicket * ticketCount;

    return calculateDiscountEstimate({
      paymentAmount: totalAmount,
      discount_value: raw,
      discount_value_max: null,
      max_discount_amount: discount.max_discount_amount,
      max_support_amount_override: maxDiscountLimitOverride,
      discount_unit: "won",
    });
  }

  return calculateSinglePayment({
    totalAmount,
    discount,
    maxDiscountLimitOverride,
  });
}

export function calculateSplitPayment(input: {
  items: BrandPriceItemResult[];
  quantities: Record<string, number>;
  extraAmount: number;
  discounts: DiscountResult[];
  maxDiscountLimitOverride: number | null;
}): SplitPaymentResult {
  const extraAmount = Math.max(0, input.extraAmount || 0);
  const slots = expandTicketSlots(input.items, input.quantities);

  if (slots.length === 0) {
    return emptySplitResult(extraAmount);
  }

  const ticketTotal = slots.reduce((sum, slot) => sum + slot.price, 0);
  const totalAmount = ticketTotal + extraAmount;

  const eligible = input.discounts.filter((discount) =>
    supportsPaymentDiscountEstimate(discount.discount_unit),
  );

  if (eligible.length === 0) {
    return {
      paymentPlans: [],
      remainingCount: slots.length,
      remainingAmount: ticketTotal,
      remainingNote: `남은 ${slots.length}명: 일반가 적용`,
      totalDiscountAmount: 0,
      totalFinalAmount: totalAmount,
    };
  }

  let unassigned = [...slots].sort((a, b) => b.price - a.price);
  const usedDiscountIds = new Set<number>();
  const paymentPlans: SplitPaymentPlan[] = [];

  while (unassigned.length > 0) {
    const ranked = eligible
      .filter((discount) => !usedDiscountIds.has(discount.id))
      .map((discount) => {
        const coverage = parseCompanionCoverageMeta(discount);
        return {
          discount,
          coverage,
          score: scoreDiscountForSlots(
            discount,
            unassigned,
            coverage.maxPeople,
            input.maxDiscountLimitOverride,
          ),
        };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best) {
      break;
    }

    const { discount, coverage } = best;
    const takeCount = Math.min(coverage.maxPeople, unassigned.length);
    unassigned = unassigned.sort((a, b) => b.price - a.price);
    const selected = unassigned.splice(0, takeCount);
    const basisAmount = selected.reduce((sum, slot) => sum + slot.price, 0);
    const estimate = estimatePaymentDiscount(
      basisAmount,
      discount,
      input.maxDiscountLimitOverride,
    );

    if (!estimate || estimate.discountAmount <= 0) {
      unassigned = [...selected, ...unassigned].sort((a, b) => b.price - a.price);
      usedDiscountIds.add(discount.id);
      continue;
    }

    usedDiscountIds.add(discount.id);
    const planNumber = paymentPlans.length + 1;
    const appliedCount = selected.length;

    paymentPlans.push({
      label: `${planNumber}번 결제`,
      benefitName: splitBenefitName(discount),
      target: formatSplitPlanTarget(discount, coverage, appliedCount),
      appliedCount,
      discountAmount: estimate.discountAmount,
      finalAmount: estimate.paymentAmount,
    });
  }

  const remainingCount = unassigned.length;
  const remainingAmount = unassigned.reduce((sum, slot) => sum + slot.price, 0);
  let totalDiscountAmount = paymentPlans.reduce((sum, plan) => sum + plan.discountAmount, 0);

  if (
    input.maxDiscountLimitOverride != null &&
    input.maxDiscountLimitOverride > 0 &&
    totalDiscountAmount > input.maxDiscountLimitOverride
  ) {
    totalDiscountAmount = input.maxDiscountLimitOverride;
  }

  const totalFinalAmount = Math.max(0, totalAmount - totalDiscountAmount);

  return {
    paymentPlans,
    remainingCount,
    remainingAmount,
    remainingNote:
      remainingCount > 0 ? `남은 ${remainingCount}명: 일반가 적용` : null,
    totalDiscountAmount,
    totalFinalAmount,
  };
}

export function calculatePriceBoardResult(input: PriceBoardEngineInput): PriceBoardResult {
  const ticketTotal = input.items.reduce((sum, item) => {
    const qty = input.quantities[item.id] ?? 0;
    if (qty <= 0) return sum;
    return sum + Number(item.price) * qty;
  }, 0);

  const ticketCount = Object.values(input.quantities).reduce(
    (acc, v) => acc + Math.max(0, v ?? 0),
    0,
  );

  const extraAmount = Math.max(0, input.extraAmount || 0);
  const totalAmount = ticketTotal + extraAmount;

  let estimate: DiscountEstimate | null = null;
  let splitResult: SplitPaymentResult | null = null;

  switch (input.paymentApplyMode) {
    case "grouped_prepay":
      estimate = calculateGroupedPrepay({
        totalAmount,
        ticketCount,
        discount: input.highlightDiscount,
        maxDiscountLimitOverride: input.maxDiscountLimitOverride,
      });
      break;
    case "split":
      splitResult = calculateSplitPayment({
        items: input.items,
        quantities: input.quantities,
        extraAmount,
        discounts: input.availableDiscounts ?? [],
        maxDiscountLimitOverride: input.maxDiscountLimitOverride,
      });

      if (splitResult.totalDiscountAmount > 0) {
        estimate = {
          kind: "payment",
          discountAmount: splitResult.totalDiscountAmount,
          paymentAmount: splitResult.totalFinalAmount,
          appliedLabel: "추천 결제 조합",
        };
      }
      break;
    case "single":
    case "per_person":
    default:
      estimate = calculateSinglePayment({
        totalAmount,
        discount: input.highlightDiscount,
        maxDiscountLimitOverride: input.maxDiscountLimitOverride,
      });
      break;
  }

  return {
    ticketTotal,
    extraAmount,
    totalAmount,
    ticketCount,
    estimate,
    splitResult,
    mode: input.paymentApplyMode,
  };
}
