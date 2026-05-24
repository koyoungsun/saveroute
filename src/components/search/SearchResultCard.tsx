"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import {
  buildSearchResultDetailRows,
  type SearchResultDetailRow,
} from "@/lib/search/build-search-result-detail-rows";
import {
  getSearchResultAccentLabel,
  getSearchResultCardAccent,
  type SearchResultCardAccent,
} from "@/lib/search/classify-search-discount";
import {
  formatDiscountValue,
} from "@/lib/search/helpers";
import { cn } from "@/lib/utils";
import type { DiscountResult } from "@/types/search";

import { DiscountEstimateSummary } from "./DiscountEstimateSummary";
import { PointBenefitInfoSection } from "./PointBenefitInfoSection";
import { SearchPointBenefitSummary } from "./SearchPointBenefitSummary";

export type SearchResultCardProps = {
  brandName: string;
  officialUrl: string | null;
  discount: DiscountResult;
  isBest: boolean;
  matchesUserBenefit: boolean;
  featured?: boolean;
  sharedPaymentAmount?: number;
  fallbackCalculator?: ReactNode;
  inPointSection?: boolean;
  rank?: number;
};

function splitDiscountLabelForHighlight(label: string) {
  const suffixes = [" 할인", " 포인트 적립", " 특가"];

  for (const suffix of suffixes) {
    if (label.endsWith(suffix)) {
      return {
        value: label.slice(0, -suffix.length),
        suffix,
      };
    }
  }

  return { value: label, suffix: "" };
}

function highlightDiscountNumbers(text: string) {
  const parts = text.split(/(\d[\d,]*(?:\.\d+)?%?)/g);

  return parts.map((part, index) => {
    if (!/^\d/.test(part)) {
      return part;
    }

    const match = part.match(/^(\d[\d,]*(?:\.\d+)?)(%?)$/);
    if (!match) {
      return part;
    }

    const [, numericPart, percentSign] = match;

    return (
      <span key={`${part}-${index}`} className="sr-user-search-result-card__value-num-wrap">
        <span className="sr-user-search-result-card__value-num">{numericPart}</span>
        {percentSign ? (
          <span className="sr-user-search-result-card__value-pct">{percentSign}</span>
        ) : null}
      </span>
    );
  });
}

function getCardDisplayName(discount: DiscountResult) {
  if (discount.provider?.name?.trim()) {
    return discount.provider.name.trim();
  }

  const product = discount.benefit_product;
  if (!product?.name) {
    return "혜택 미지정";
  }

  if (product.is_all_product || product.benefit_type === "all") {
    return `${product.name} · 카드사 전체`;
  }

  return product.name;
}

function formatRankDisplay(rank: number) {
  return String(rank).padStart(2, "0");
}

function normalizeCompareText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function shouldHideDetailRow(
  row: SearchResultDetailRow,
  providerName: string | null,
  benefitProductLabel: string | null,
) {
  if (row.label === "혜택 상품") {
    return true;
  }

  const normalizedValue = normalizeCompareText(row.value);

  if (providerName && normalizedValue.includes(normalizeCompareText(providerName))) {
    return true;
  }

  if (
    benefitProductLabel &&
    normalizedValue.includes(normalizeCompareText(benefitProductLabel))
  ) {
    return true;
  }

  return false;
}

function getBenefitProductLabel(discount: DiscountResult) {
  const product = discount.benefit_product;
  if (!product?.name) {
    return null;
  }

  if (product.is_all_product || product.benefit_type === "all") {
    return `${product.name} · 카드사 전체`;
  }

  return product.name;
}

function buildPrimaryDetailSections(
  discount: DiscountResult,
  detailRows: SearchResultDetailRow[],
): SearchResultDetailRow[] {
  const valueByLabel = new Map(detailRows.map((row) => [row.label, row]));
  const sections: SearchResultDetailRow[] = [];

  const condition =
    valueByLabel.get("조건 요약")?.value ?? discount.condition_text?.trim();
  if (condition) {
    sections.push({ label: "적용 조건", value: condition, preWrap: true });
  }

  const limit =
    valueByLabel.get("결제 조건")?.value ?? discount.installment_condition?.trim();
  if (limit) {
    sections.push({ label: "할인 한도", value: limit, preWrap: true });
  }

  const usage = valueByLabel.get("사용 방법")?.value;
  if (usage) {
    sections.push({ label: "이용 방법", value: usage });
  }

  const notice =
    valueByLabel.get("유의사항")?.value ?? discount.notice_text?.trim();
  if (notice) {
    sections.push({ label: "유의사항", value: notice, preWrap: true });
  }

  return sections;
}

function DetailRow({
  label,
  value,
  preWrap = false,
}: {
  label: string;
  value: string | null | undefined;
  preWrap?: boolean;
}) {
  if (!value?.trim()) {
    return null;
  }

  return (
    <div className="sr-user-search-result-card__detail-section">
      <p className="sr-user-search-result-card__detail-label">{label}</p>
      <p
        className={cn(
          "sr-user-search-result-card__detail-value",
          preWrap && "sr-user-search-pre-wrap",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function accentClassName(accent: SearchResultCardAccent) {
  return `sr-user-search-result-card--accent-${accent}`;
}

export function SearchResultCard({
  discount,
  isBest,
  matchesUserBenefit,
  sharedPaymentAmount = 0,
  fallbackCalculator = null,
  inPointSection = false,
  rank,
}: SearchResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const accent = getSearchResultCardAccent(discount, inPointSection);
  const accentLabel = getSearchResultAccentLabel(accent);

  const discountLabel = formatDiscountValue(
    discount.discount_value,
    discount.discount_unit,
    discount.discount_value_max,
  );
  const { value: discountValueHighlight, suffix: discountSuffix } =
    splitDiscountLabelForHighlight(discountLabel);

  const cardDisplayName = getCardDisplayName(discount);
  const benefitProductLabel = getBenefitProductLabel(discount);
  const providerName = discount.provider?.name?.trim() ?? null;

  const detailRows = buildSearchResultDetailRows({
    discount,
    inPointSection,
    matchesUserBenefit,
    benefitProductLabel,
    showBenefitProductInDetails: false,
  });

  const filterDetailRow = (row: SearchResultDetailRow) =>
    !shouldHideDetailRow(row, providerName, benefitProductLabel);

  const primaryDetailSections = buildPrimaryDetailSections(discount, detailRows).filter(
    filterDetailRow,
  );
  const primarySourceLabels = new Set([
    "조건 요약",
    "결제 조건",
    "사용 방법",
    "유의사항",
  ]);
  const secondaryDetailRows = detailRows
    .filter((row) => !primarySourceLabels.has(row.label))
    .filter(filterDetailRow);

  const showSharedEstimate = !inPointSection && sharedPaymentAmount > 0;

  return (
    <article
      className={cn(
        "sr-user-search-result-card sr-user-card sr-user-card--flush overflow-hidden transition-shadow",
        accentClassName(accent),
        isBest && "sr-user-card--best",
        inPointSection && "sr-user-search-result-card--point-section",
      )}
    >
      {rank != null ? (
        <span
          className={cn(
            "sr-user-search-result-card__rank",
            rank === 1
              ? "sr-user-search-result-card__rank--first"
              : "sr-user-search-result-card__rank--default",
          )}
          aria-hidden="true"
        >
          {formatRankDisplay(rank)}
        </span>
      ) : null}
      <div className="sr-user-search-result-card__body">
        <div className="sr-user-search-result-card__top">
          <div className="sr-user-search-result-card__header">
            <div className="sr-user-search-result-card__header-leading">
              <span
                className={cn(
                  "sr-user-search-result-card__type-badge sr-user-t-badge shrink-0",
                  `sr-user-search-result-card__type-badge--${accent}`,
                )}
              >
                {accentLabel}
              </span>
              <span className="sr-user-search-result-card__provider-name">
                {cardDisplayName}
              </span>
              {isBest ? (
                <span className="sr-user-search-result-card__best-badge shrink-0">
                  BEST
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <p className="sr-user-search-result-card__value">
          <span
            className={cn(
              inPointSection
                ? "sr-user-search-result-card__point-value"
                : "sr-user-search-result-card__value-highlight",
            )}
          >
            {highlightDiscountNumbers(discountValueHighlight)}
          </span>
          {discountSuffix ? (
            <span className="sr-user-search-result-card__value-suffix">{discountSuffix}</span>
          ) : null}
        </p>

        <p className="sr-user-search-result-card__title">{discount.title}</p>

        {inPointSection && !expanded ? <SearchPointBenefitSummary discount={discount} /> : null}

        {showSharedEstimate ? (
          <>
            <div
              className="sr-user-search-result-card__divider sr-user-search-result-card__divider--before-summary"
              aria-hidden="true"
            />
            <DiscountEstimateSummary
              discount={discount}
              paymentAmount={sharedPaymentAmount}
            />
            <div
              className="sr-user-search-result-card__divider sr-user-search-result-card__divider--after-summary"
              aria-hidden="true"
            />
          </>
        ) : null}

        <div
          className={cn(
            "sr-user-search-result-card__expand-panel",
            expanded && "sr-user-search-result-card__expand-panel--open",
          )}
        >
          <div className="sr-user-search-result-card__details">
            {primaryDetailSections.map((row) => (
              <DetailRow
                key={`primary:${row.label}:${row.value}`}
                label={row.label}
                value={row.value}
                preWrap={row.preWrap}
              />
            ))}
            {secondaryDetailRows.map((row) => (
              <DetailRow
                key={`secondary:${row.label}:${row.value}`}
                label={row.label}
                value={row.value}
                preWrap={row.preWrap}
              />
            ))}
            {inPointSection ? <PointBenefitInfoSection discount={discount} /> : null}
            {fallbackCalculator}
          </div>
        </div>
      </div>

      <div className="sr-user-search-result-card__footer">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="sr-user-search-result-card__toggle"
          aria-expanded={expanded}
        >
          <span>{expanded ? "닫기" : "자세히 열기"}</span>
          {expanded ? (
            <ChevronUp className="sr-user-search-result-card__toggle-icon" aria-hidden="true" />
          ) : (
            <ChevronDown className="sr-user-search-result-card__toggle-icon" aria-hidden="true" />
          )}
        </button>
      </div>
    </article>
  );
}
