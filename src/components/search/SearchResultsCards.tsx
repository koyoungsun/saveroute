"use client";

import { useEffect, useMemo, useState } from "react";

import {
  splitSearchResultDiscounts,
} from "@/lib/search/classify-search-discount";
import { supportsPaymentDiscountEstimate } from "@/lib/search/format-point-benefit-info";
import type { DiscountResult } from "@/types/search";

import { ThemeParkConditionFilters } from "./ThemeParkConditionFilters";
import { DiscountCalculator } from "./DiscountCalculator";
import { SearchGuestLoginPrompt } from "./SearchGuestLoginPrompt";
import { SearchResultCard } from "./SearchResultCard";
import {
  SharedPaymentAmountInput,
  useSharedPaymentAmount,
} from "./SharedPaymentAmountInput";

const RESULTS_PAGE_SIZE = 5;
const GUEST_PREVIEW_LIMIT = 5;

type SearchResultsCardsProps = {
  brandName: string;
  officialUrl: string | null;
  discounts: DiscountResult[];
  totalCount: number;
  bestDiscountId: number | null;
  ownedDiscountIds: number[];
  showThemeParkFilters?: boolean;
  authenticated?: boolean;
  loginRedirect?: string;
};

function renderDiscountCard(
  discount: DiscountResult,
  options: {
    brandName: string;
    officialUrl: string | null;
    isBest: boolean;
    matchesUserBenefit: boolean;
    sharedPaymentAmount: number;
    inPointSection: boolean;
    rank?: number;
  },
) {
  const { brandName, officialUrl, isBest, matchesUserBenefit, sharedPaymentAmount, inPointSection, rank } =
    options;

  return (
    <SearchResultCard
      key={discount.id}
      brandName={brandName}
      officialUrl={officialUrl}
      discount={discount}
      isBest={isBest}
      matchesUserBenefit={matchesUserBenefit}
      sharedPaymentAmount={sharedPaymentAmount}
      inPointSection={inPointSection}
      rank={rank}
      fallbackCalculator={
        !inPointSection &&
        sharedPaymentAmount <= 0 &&
        supportsPaymentDiscountEstimate(discount.discount_unit) ? (
          <DiscountCalculator discount={discount} />
        ) : null
      }
    />
  );
}

export function SearchResultsCards({
  brandName,
  officialUrl,
  discounts,
  totalCount,
  bestDiscountId,
  ownedDiscountIds,
  showThemeParkFilters = false,
  authenticated = true,
  loginRedirect = "/search",
}: SearchResultsCardsProps) {
  const [paymentInput, setPaymentInput] = useState("");
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);
  const sharedPaymentAmount = useSharedPaymentAmount(paymentInput);

  const ownedSet = useMemo(() => new Set(ownedDiscountIds), [ownedDiscountIds]);

  const { immediateDiscounts, pointBenefits } = useMemo(
    () => splitSearchResultDiscounts(discounts),
    [discounts],
  );

  useEffect(() => {
    setVisibleCount(RESULTS_PAGE_SIZE);
  }, [discounts]);

  const visibleImmediateDiscounts = authenticated
    ? immediateDiscounts.slice(0, visibleCount)
    : immediateDiscounts.slice(0, GUEST_PREVIEW_LIMIT);

  const showLoadMoreButton =
    authenticated &&
    immediateDiscounts.length > RESULTS_PAGE_SIZE &&
    visibleCount < immediateDiscounts.length;

  const displayBestDiscountId =
    authenticated && immediateDiscounts.some((discount) => discount.id === bestDiscountId)
      ? bestDiscountId
      : null;

  const cardOptions = {
    brandName,
    officialUrl,
    sharedPaymentAmount,
  };

  return (
    <>
      <SharedPaymentAmountInput value={paymentInput} onChange={setPaymentInput} />

      {showThemeParkFilters ? <ThemeParkConditionFilters /> : null}

      {immediateDiscounts.length > 0 ? (
        <section className="sr-user-search-immediate-discounts" aria-label="즉시 할인">
          <p className="sr-user-search-results-count sr-user-canvas-text-muted">
            총{" "}
            <span className="sr-user-search-results-count__highlight">
              {totalCount}건
            </span>{" "}
            검색
            {!authenticated && totalCount > GUEST_PREVIEW_LIMIT ? (
              <span className="sr-user-search-results-count__note"> · 미리보기 5개</span>
            ) : null}
          </p>
          <div className="sr-user-search-results-cards">
            {visibleImmediateDiscounts.map((discount, index) =>
              renderDiscountCard(discount, {
                ...cardOptions,
                isBest: displayBestDiscountId === discount.id,
                matchesUserBenefit: authenticated && ownedSet.has(discount.id),
                inPointSection: false,
                rank: index + 1,
              }),
            )}
          </div>

          {showLoadMoreButton ? (
            <div className="sr-user-search-results-load-more">
              <button
                type="button"
                className="sr-user-btn-secondary sr-user-btn-secondary--block"
                onClick={() => {
                  setVisibleCount((current) =>
                    Math.min(current + RESULTS_PAGE_SIZE, immediateDiscounts.length),
                  );
                }}
              >
                더보기
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {!authenticated ? (
        <SearchGuestLoginPrompt loginRedirect={loginRedirect} />
      ) : null}

      {pointBenefits.length > 0 ? (
        <section className="sr-user-search-point-benefits" aria-label="포인트 혜택">
          <div className="sr-user-search-point-benefits__header">
            <h2 className="sr-user-search-point-benefits__title sr-user-t-section-title sr-user-canvas-text">
              포인트 혜택
            </h2>
            <p className="sr-user-search-point-benefits__helper sr-user-t-muted sr-user-canvas-text-muted">
              적립/포인트 사용 혜택은 결제 조건에 따라 달라질 수 있습니다.
            </p>
          </div>

          <div className="sr-user-search-results-cards sr-user-search-point-benefits__cards">
            {pointBenefits.map((discount) =>
              renderDiscountCard(discount, {
                ...cardOptions,
                isBest: false,
                matchesUserBenefit: authenticated && ownedSet.has(discount.id),
                inPointSection: true,
              }),
            )}
          </div>
        </section>
      ) : null}
    </>
  );
}
