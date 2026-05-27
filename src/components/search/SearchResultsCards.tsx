"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { splitSearchResultDiscounts } from "@/lib/search/classify-search-discount";
import { supportsPaymentDiscountEstimate } from "@/lib/search/format-point-benefit-info";
import type { DiscountResult } from "@/types/search";

import { ThemeParkConditionFilters } from "./ThemeParkConditionFilters";
import { DiscountCalculator } from "./DiscountCalculator";
import { PriceBoardAccordion } from "./PriceBoardAccordion";
import { SearchGuestLoginPrompt } from "./SearchGuestLoginPrompt";
import { SearchResultCard } from "./SearchResultCard";
import {
  SharedPaymentAmountInput,
  useSharedPaymentAmount,
} from "./SharedPaymentAmountInput";
import type { BrandPriceItemResult } from "@/types/search";

const RESULTS_PAGE_SIZE = 5;
const GUEST_PREVIEW_LIMIT = 5;

type SearchResultsCardsProps = {
  keyword: string;
  brandName: string;
  officialUrl: string | null;
  discounts: DiscountResult[];
  catalogDiscounts: DiscountResult[];
  totalCount: number;
  bestDiscountId: number | null;
  ownedDiscountIds: number[];
  brandHasPriceBoard?: boolean;
  brandPriceItems?: BrandPriceItemResult[];
  showThemeParkFilters?: boolean;
  authenticated?: boolean;
  hasRegisteredBenefits?: boolean;
  loginRedirect?: string;
};

function renderDiscountCard(
  discount: DiscountResult,
  options: {
    brandName: string;
    officialUrl: string | null;
    isBest: boolean;
    matchesUserBenefit: boolean;
    basisPaymentAmount: number;
    maxDiscountLimitOverride: number | null;
    inPointSection: boolean;
    usePriceBoard: boolean;
    rank?: number;
  },
) {
  const {
    brandName,
    officialUrl,
    isBest,
    matchesUserBenefit,
    basisPaymentAmount,
    maxDiscountLimitOverride,
    inPointSection,
    rank,
    usePriceBoard,
  } = options;

  return (
    <SearchResultCard
      key={discount.id}
      brandName={brandName}
      officialUrl={officialUrl}
      discount={discount}
      isBest={isBest}
      matchesUserBenefit={matchesUserBenefit}
      sharedPaymentAmount={basisPaymentAmount}
      maxDiscountLimitOverride={maxDiscountLimitOverride}
      inPointSection={inPointSection}
      rank={rank}
      fallbackCalculator={
        !usePriceBoard &&
        !inPointSection &&
        basisPaymentAmount <= 0 &&
        supportsPaymentDiscountEstimate(discount.discount_unit) ? (
          <DiscountCalculator discount={discount} />
        ) : null
      }
    />
  );
}

export function SearchResultsCards({
  keyword,
  brandName,
  officialUrl,
  discounts,
  catalogDiscounts,
  totalCount,
  bestDiscountId,
  ownedDiscountIds,
  brandHasPriceBoard = false,
  brandPriceItems = [],
  showThemeParkFilters = false,
  authenticated = true,
  hasRegisteredBenefits = false,
  loginRedirect = "/search",
}: SearchResultsCardsProps) {
  const [paymentInput, setPaymentInput] = useState("");
  const [priceBoardTotal, setPriceBoardTotal] = useState(0);
  const [maxDiscountLimitOverride, setMaxDiscountLimitOverride] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);
  const sharedPaymentAmount = useSharedPaymentAmount(paymentInput);

  const usePriceBoard = brandHasPriceBoard && brandPriceItems.length > 0;
  const basisPaymentAmount = usePriceBoard ? priceBoardTotal : sharedPaymentAmount;

  const showCatalogAll =
    discounts.length === 0 && catalogDiscounts.length > 0;

  const activeDiscounts = showCatalogAll ? catalogDiscounts : discounts;

  const handlePriceBoardTotalChange = useCallback((total: number) => {
    setPriceBoardTotal(total);
  }, []);

  const handleMaxDiscountLimitChange = useCallback((limit: number | null) => {
    setMaxDiscountLimitOverride(limit);
  }, []);

  const ownedSet = useMemo(() => new Set(ownedDiscountIds), [ownedDiscountIds]);

  const { immediateDiscounts, pointBenefits } = useMemo(
    () => splitSearchResultDiscounts(activeDiscounts),
    [activeDiscounts],
  );

  useEffect(() => {
    setVisibleCount(RESULTS_PAGE_SIZE);
  }, [activeDiscounts]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("search render debug", {
        keyword,
        brandName,
        hasPriceBoard: usePriceBoard,
        priceItemsLength: brandPriceItems.length,
        resultsLength: activeDiscounts.length,
        personalizedLength: discounts.length,
        catalogLength: catalogDiscounts.length,
        showCatalogAll,
        isLoggedIn: authenticated,
        hasRegisteredBenefits,
        userBenefitsCount: ownedDiscountIds.length,
      });
    }
  }, [
    activeDiscounts.length,
    authenticated,
    brandName,
    brandPriceItems.length,
    catalogDiscounts.length,
    discounts.length,
    hasRegisteredBenefits,
    keyword,
    ownedDiscountIds.length,
    showCatalogAll,
    usePriceBoard,
  ]);

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
      : bestDiscountId;

  const highlightDiscount = useMemo(() => {
    const preferredId = displayBestDiscountId;
    if (preferredId != null) {
      const preferred = immediateDiscounts.find((d) => d.id === preferredId);
      if (preferred) {
        return preferred;
      }
    }

    return (
      immediateDiscounts.find((d) => supportsPaymentDiscountEstimate(d.discount_unit)) ??
      immediateDiscounts[0] ??
      null
    );
  }, [displayBestDiscountId, immediateDiscounts]);

  const highlightIsBest =
    bestDiscountId != null && highlightDiscount?.id === bestDiscountId;

  const cardOptions = {
    brandName,
    officialUrl,
    basisPaymentAmount,
    maxDiscountLimitOverride: usePriceBoard ? maxDiscountLimitOverride : null,
    usePriceBoard,
  };

  const listTotalCount = showCatalogAll ? catalogDiscounts.length : totalCount;

  return (
    <>
      {!usePriceBoard ? (
        <SharedPaymentAmountInput value={paymentInput} onChange={setPaymentInput} />
      ) : null}

      {showThemeParkFilters ? <ThemeParkConditionFilters /> : null}

      {usePriceBoard ? (
        <PriceBoardAccordion
          items={brandPriceItems}
          onTotalChange={handlePriceBoardTotalChange}
          onMaxDiscountLimitChange={handleMaxDiscountLimitChange}
          highlightDiscount={highlightDiscount}
          highlightIsBest={highlightIsBest}
        />
      ) : null}

      {showCatalogAll ? (
        <div className="sr-user-search-catalog-notice" role="status">
          <p className="sr-user-search-catalog-notice__title">
            {hasRegisteredBenefits
              ? "내 보유 혜택 기준으로 적용 가능한 할인이 없습니다."
              : "내 혜택이 등록되지 않아 맞춤 할인을 표시할 수 없습니다."}
          </p>
          <p className="sr-user-search-catalog-notice__body">
            {hasRegisteredBenefits
              ? `아래는 ${brandName} 전체 활성 할인 목록입니다. 다른 카드·멤버십을 등록하면 맞춤 결과가 달라질 수 있습니다.`
              : `아래는 ${brandName} 전체 활성 할인 목록입니다. 내 혜택을 등록하면 맞춤 할인만 볼 수 있습니다.`}
          </p>
          {hasRegisteredBenefits ? (
            <Link href="/my-benefits" className="sr-user-search-catalog-notice__link">
              내 혜택 수정하기
            </Link>
          ) : (
            <Link href="/my-benefits" className="sr-user-search-catalog-notice__link">
              내 혜택 등록하기
            </Link>
          )}
        </div>
      ) : null}

      {immediateDiscounts.length > 0 ? (
        <section className="sr-user-search-immediate-discounts" aria-label="즉시 할인">
          <p className="sr-user-search-results-count sr-user-canvas-text-muted">
            총{" "}
            <span className="sr-user-search-results-count__highlight">
              {listTotalCount}건
            </span>{" "}
            {showCatalogAll ? "전체 할인" : "검색"}
            {!authenticated && listTotalCount > GUEST_PREVIEW_LIMIT ? (
              <span className="sr-user-search-results-count__note"> · 미리보기 5개</span>
            ) : null}
          </p>
          <div className="sr-user-search-results-cards">
            {visibleImmediateDiscounts.map((discount, index) =>
              renderDiscountCard(discount, {
                ...cardOptions,
                isBest: bestDiscountId === discount.id,
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
      ) : discounts.length === 0 && catalogDiscounts.length === 0 ? (
        <div className="sr-user-search-panel sr-user-search-panel--empty">
          <p className="sr-user-search-panel__title">
            {authenticated
              ? "현재 확인된 할인 정보가 없습니다."
              : "현재 확인된 할인 정보가 없어요."}
          </p>
          <p className="sr-user-search-panel__body">
            {authenticated
              ? "다른 카드 멤버십을 등록하면 결과가 달라질 수 있어요."
              : "로그인 후 내 혜택을 등록하면 맞춤 할인을 볼 수 있어요."}
          </p>
        </div>
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
