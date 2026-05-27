"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatPaymentInput,
  parsePaymentInput,
} from "@/lib/search/calculate-discount-estimate";
import {
  calculatePriceBoardResult,
  type PaymentApplyMode,
} from "@/lib/search/price-board-engine";
import type { BrandPriceItemResult, DiscountResult } from "@/types/search";

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

type PriceBoardAccordionProps = {
  items: BrandPriceItemResult[];
  onTotalChange?: (total: number) => void;
  onMaxDiscountLimitChange?: (limit: number | null) => void;
  highlightDiscount?: DiscountResult | null;
  highlightIsBest?: boolean;
  paymentApplyMode?: PaymentApplyMode;
  availableDiscounts?: DiscountResult[];
};

function SummaryRow({
  label,
  amount,
  variant = "default",
}: {
  label: string;
  amount: number;
  variant?: "default" | "total" | "emphasis";
}) {
  return (
    <div
      className={
        variant === "total"
          ? "sr-user-price-board__summary-row sr-user-price-board__summary-row--total"
          : variant === "emphasis"
            ? "sr-user-price-board__summary-row sr-user-price-board__summary-row--emphasis"
            : "sr-user-price-board__summary-row"
      }
    >
      <span className="sr-user-price-board__summary-label">{label}</span>
      <strong className="sr-user-price-board__summary-amount">{formatWon(amount)}</strong>
    </div>
  );
}

function MoneyField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="sr-user-price-board__money-row">
      <label className="sr-user-price-board__money-label" htmlFor={id}>
        {label}
      </label>
      <div className="sr-user-price-board__money-input-wrap">
        <input
          id={id}
          className="sr-user-input sr-user-price-board__money-input"
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            const parsed = parsePaymentInput(e.target.value);
            onChange(parsed ? formatPaymentInput(parsed) : "");
          }}
        />
        <span className="sr-user-price-board__money-suffix" aria-hidden="true">
          원
        </span>
      </div>
    </div>
  );
}

export function PriceBoardAccordion({
  items,
  onTotalChange,
  onMaxDiscountLimitChange,
  highlightDiscount = null,
  highlightIsBest = false,
  paymentApplyMode = "single",
  availableDiscounts = [],
}: PriceBoardAccordionProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [extraFeeInput, setExtraFeeInput] = useState("");
  const [maxDiscountLimitInput, setMaxDiscountLimitInput] = useState("");

  const extraAmount = useMemo(() => parsePaymentInput(extraFeeInput), [extraFeeInput]);

  const maxDiscountLimitOverride = useMemo(() => {
    const parsed = parsePaymentInput(maxDiscountLimitInput);
    return parsed > 0 ? parsed : null;
  }, [maxDiscountLimitInput]);

  const engineResult = useMemo(() => {
    return calculatePriceBoardResult({
      items,
      quantities,
      extraAmount,
      paymentApplyMode,
      highlightDiscount,
      availableDiscounts,
      maxDiscountLimitOverride,
    });
  }, [
    availableDiscounts,
    extraAmount,
    highlightDiscount,
    items,
    maxDiscountLimitOverride,
    paymentApplyMode,
    quantities,
  ]);

  const { ticketTotal, totalAmount, splitResult } = engineResult;
  const paymentEstimate = engineResult.estimate?.kind === "payment" ? engineResult.estimate : null;
  const splitPaymentPlans = splitResult?.paymentPlans ?? [];
  const showSplitPlans = paymentApplyMode === "split" && splitPaymentPlans.length > 0;

  const resolvedMaxDiscountLimit =
    maxDiscountLimitOverride ??
    (highlightDiscount?.max_discount_amount != null &&
    Number(highlightDiscount.max_discount_amount) > 0
      ? Number(highlightDiscount.max_discount_amount)
      : null);

  useEffect(() => {
    onTotalChange?.(totalAmount);
  }, [totalAmount, onTotalChange]);

  useEffect(() => {
    onMaxDiscountLimitChange?.(maxDiscountLimitOverride);
  }, [maxDiscountLimitOverride, onMaxDiscountLimitChange]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("price board totals", {
        ticketTotal,
        extraAmount,
        totalAmount,
        maxDiscountLimit: resolvedMaxDiscountLimit,
        bestDiscountEstimate: engineResult.estimate,
      });
    }
  }, [
    ticketTotal,
    extraAmount,
    totalAmount,
    resolvedMaxDiscountLimit,
    engineResult.estimate,
  ]);

  const discountSummaryLabel = highlightIsBest
    ? "BEST 기준 예상 할인금액"
    : "예상 할인금액";
  const paymentSummaryLabel = highlightIsBest
    ? "BEST 기준 예상 결제금액"
    : "예상 결제금액";

  const maxDiscountLimitPlaceholder =
    highlightDiscount?.max_discount_amount != null &&
    Number(highlightDiscount.max_discount_amount) > 0
      ? `예: ${formatPaymentInput(Number(highlightDiscount.max_discount_amount))}`
      : "예: 10000";

  return (
    <section className="sr-user-price-board" aria-label="이용요금 계산기">
      <h2 className="sr-user-price-board__title">이용요금 계산기</h2>

      <div className="sr-user-price-board__panel">
        <ul className="sr-user-price-board__list">
          {items.map((item, index) => {
            const qty = quantities[item.id] ?? 0;
            const inputId = `price-item-${index}-${item.id}`;

            return (
              <li key={item.id} className="sr-user-price-board__item">
                <div className="sr-user-price-board__item-main">
                  <span className="sr-user-price-board__item-label">{item.label}</span>
                  <span className="sr-user-price-board__item-price">{formatWon(item.price)}</span>
                </div>

                <div className="sr-user-price-board__qty" role="group" aria-label={`${item.label} 인원`}>
                  <button
                    type="button"
                    className="sr-user-price-board__qty-btn"
                    onClick={() => {
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1),
                      }));
                    }}
                    aria-label={`${item.label} 인원 감소`}
                  >
                    -
                  </button>
                  <input
                    id={inputId}
                    className="sr-user-input sr-user-price-board__qty-input"
                    inputMode="numeric"
                    maxLength={3}
                    value={String(qty)}
                    onChange={(e) => {
                      const next = Number(e.target.value.replace(/[^\d]/g, "").slice(0, 3));
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: Number.isFinite(next) ? Math.min(999, Math.max(0, next)) : 0,
                      }));
                    }}
                    aria-label={`${item.label} 인원`}
                  />
                  <button
                    type="button"
                    className="sr-user-price-board__qty-btn"
                    onClick={() => {
                      setQuantities((prev) => ({
                        ...prev,
                        [item.id]: Math.min(999, (prev[item.id] ?? 0) + 1),
                      }));
                    }}
                    aria-label={`${item.label} 인원 증가`}
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="sr-user-price-board__extras">
          <MoneyField
            id="price-board-extra-fee"
            label="기타요금 추가"
            value={extraFeeInput}
            onChange={setExtraFeeInput}
            placeholder="예: 5,000"
          />
          <MoneyField
            id="price-board-max-discount-limit"
            label="최대 할인제한금액"
            value={maxDiscountLimitInput}
            onChange={setMaxDiscountLimitInput}
            placeholder={maxDiscountLimitPlaceholder}
          />
        </div>

        <div className="sr-user-price-board__summary">
          <SummaryRow label="총 이용요금" amount={totalAmount} variant="total" />

          {showSplitPlans ? (
            <>
              <div className="sr-user-price-board__split-plans">
                <h3 className="sr-user-price-board__split-plans-title">추천 결제 방식</h3>
                <ul className="sr-user-price-board__split-plans-list">
                  {splitPaymentPlans.map((plan) => (
                    <li key={plan.label} className="sr-user-price-board__split-plan">
                      <div className="sr-user-price-board__split-plan-head">
                        <span className="sr-user-price-board__split-plan-label">{plan.label}</span>
                        <span className="sr-user-price-board__split-plan-amounts">
                          할인 {formatWon(plan.discountAmount)} · 결제 {formatWon(plan.finalAmount)}
                        </span>
                      </div>
                      <p className="sr-user-price-board__split-plan-line">
                        {plan.benefitName}: {plan.target}
                      </p>
                    </li>
                  ))}
                </ul>
                {splitResult?.remainingNote ? (
                  <p className="sr-user-price-board__split-remaining">{splitResult.remainingNote}</p>
                ) : null}
              </div>

              {paymentEstimate ? (
                <>
                  <SummaryRow label={discountSummaryLabel} amount={paymentEstimate.discountAmount} />
                  <SummaryRow
                    label={paymentSummaryLabel}
                    amount={paymentEstimate.paymentAmount}
                    variant="emphasis"
                  />
                </>
              ) : null}

              <p className="sr-user-price-board__summary-note">
                혜택별로 나눠 결제하는 추천 조합입니다. 실제 적용 조건은 아래 할인 카드를
                확인해 주세요.
              </p>
            </>
          ) : paymentEstimate ? (
            <>
              {paymentApplyMode === "grouped_prepay" ? (
                <>
                  <SummaryRow
                    label={highlightIsBest ? "BEST 기준 예상 예매 할인" : "예상 예매 할인"}
                    amount={paymentEstimate.discountAmount}
                  />
                  <SummaryRow
                    label={paymentSummaryLabel}
                    amount={paymentEstimate.paymentAmount}
                    variant="emphasis"
                  />
                </>
              ) : (
                <>
                  <SummaryRow label={discountSummaryLabel} amount={paymentEstimate.discountAmount} />
                  <SummaryRow
                    label={paymentSummaryLabel}
                    amount={paymentEstimate.paymentAmount}
                    variant="emphasis"
                  />
                </>
              )}
              {highlightDiscount ? (
                <p className="sr-user-price-board__summary-note">
                  {highlightIsBest ? "BEST" : highlightDiscount.provider?.name ?? "대표"} 혜택
                  기준입니다. 카드별 금액은 아래 할인 결과에서 확인하세요.
                </p>
              ) : null}
            </>
          ) : totalAmount > 0 ? (
            <p className="sr-user-price-board__summary-note">
              {highlightDiscount
                ? "이 혜택은 간단 계산으로 예상 금액을 표시하기 어렵습니다. 아래 할인 카드를 확인해 주세요."
                : "아래 할인 카드에서 혜택별 예상 금액을 확인할 수 있습니다."}
            </p>
          ) : (
            <p className="sr-user-price-board__summary-note">
              이용권 수량 또는 기타요금을 입력해 주세요.
            </p>
          )}
        </div>

        <p className="sr-user-price-board__notice">
          실제 가격은 업데이트 시점에 따라 다를 수 있습니다.
          <br />
          성수기, 현장 정책, 매장 특이 사항에 따라 이용요금이 달라질 수 있습니다.
        </p>
      </div>
    </section>
  );
}
