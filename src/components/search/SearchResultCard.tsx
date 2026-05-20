import type { CSSProperties } from "react";



import { BrandFavicon } from "@/components/brand/BrandFavicon";

import {

  formatDiscountValue,

  formatValidUntil,

  getBenefitTypeLabel,

} from "@/lib/search/helpers";

import { buildDiscountMetaSummary } from "@/lib/discounts/discount-detail-fields";

import type { DiscountResult } from "@/types/search";



const ACCENT = "#409A53";



export type SearchResultCardProps = {

  brandName: string;

  officialUrl: string | null;

  discount: DiscountResult;

  isBest: boolean;

  matchesUserBenefit: boolean;

  /** 적용 가능한 혜택 목록 첫 카드 — 할인 수치 오렌지 표시 */

  featured?: boolean;

};



export function SearchResultCard({

  brandName,

  officialUrl,

  discount,

  isBest,

  matchesUserBenefit,

  featured,

}: SearchResultCardProps) {

  const discountLabel = formatDiscountValue(
    discount.discount_value,
    discount.discount_unit,
    discount.discount_value_max,
  );



  const shellStyle = {

    "--sr-soft-border": `${ACCENT}33`,

    "--sr-soft-bg": `${ACCENT}0f`,

  } as CSSProperties;



  const providerLabel = discount.provider?.name ?? "-";

  const categoryLabel = discount.benefit_category?.name ?? "-";

  const productLabel = (() => {
    const product = discount.benefit_product;
    if (!product?.name) return "혜택 상품 미지정";
    if (product.is_all_product || product.benefit_type === "all") {
      return `${product.name} · 카드사 전체`;
    }
    return product.name;
  })();

  const validLabel = formatValidUntil(discount);

  const metaSummary = buildDiscountMetaSummary(discount);

  const hasDetailContent = Boolean(
    discount.notice_text ||
      discount.installment_condition ||
      metaSummary.length > 0,
  );



  const shellBorder = isBest

    ? "border-orange-400/60 shadow-[0_4px_18px_rgba(234,88,12,0.28)] ring-1 ring-orange-300/35 dark:border-orange-500/55 dark:shadow-[0_4px_22px_rgba(251,146,60,0.2)] dark:ring-orange-400/30"

    : featured

      ? "border-[#409A53]/45 shadow-[0_2px_12px_rgba(64,154,83,0.12)] dark:border-[#409A53]/50"

      : "border-gray-100 dark:border-gray-800";



  return (

    <article

      style={shellStyle}

      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow dark:bg-gray-900 dark:shadow-none ${shellBorder}`}

    >

      {isBest ? (

        <div className="relative overflow-hidden bg-gradient-to-r from-orange-700 via-orange-500 to-amber-400 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] sm:py-3">

          <div

            className="pointer-events-none absolute inset-0 opacity-40"

            style={{

              background:

                "linear-gradient(115deg, transparent 0%, rgba(255,255,255,0.35) 45%, transparent 70%)",

            }}

            aria-hidden

          />

          <div className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-1">

            <span className="rounded-md bg-black/15 px-2 py-0.5 text-xs font-black tracking-[0.28em] text-white drop-shadow-sm">

              BEST

            </span>

            <span className="text-[13px] font-bold tracking-wide text-white drop-shadow-sm">

              최고 할인

            </span>

            <span className="hidden text-xs font-medium text-white/85 sm:inline">

              이 브랜드에서 가장 유리한 조건

            </span>

          </div>

        </div>

      ) : null}



      <div className="p-4 sm:p-5">

        <div className="flex flex-wrap items-center gap-2">

          <span className="rounded-full bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">

            {getBenefitTypeLabel(discount)}

          </span>

          {matchesUserBenefit ? (

            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-950 ring-1 ring-amber-300/90 ring-inset dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-600/60">

              내 할인 가능

            </span>

          ) : null}

        </div>



        <p

          className={`mt-4 text-[1.85rem] font-extrabold leading-none tracking-tight sm:text-[2.35rem] ${

            featured || isBest ? "text-orange-600 dark:text-orange-400" : ""

          }`}

          style={featured || isBest ? undefined : { color: ACCENT }}

        >

          {discountLabel}

        </p>



        <h3 className="mt-3 text-lg font-bold leading-snug text-gray-950 dark:text-gray-50 sm:text-[1.25rem]">

          {discount.title}

        </h3>



        <div className="mt-2 flex min-h-11 items-center gap-2">

          <BrandFavicon brandName={brandName} officialUrl={officialUrl} size={22} />

          <span className="min-w-0 truncate text-xs font-medium text-gray-500 dark:text-gray-400">

            {brandName}

          </span>

        </div>



        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-snug text-gray-500 dark:text-gray-400">

          <span className="font-medium text-gray-600 dark:text-gray-300">{providerLabel}</span>

          <span className="select-none text-gray-300 dark:text-gray-600" aria-hidden>

            ·

          </span>

          <span>{categoryLabel}</span>

          <span className="select-none text-gray-300 dark:text-gray-600" aria-hidden>

            ·

          </span>

          <span className="max-w-[11rem] truncate sm:max-w-none">{productLabel}</span>

          <span className="select-none text-gray-300 dark:text-gray-600" aria-hidden>

            ·

          </span>

          <span>{validLabel}</span>

        </p>



        {discount.condition_text ? (

          <p className="mt-3 line-clamp-2 rounded-xl border border-[color:var(--sr-soft-border)] bg-[color:var(--sr-soft-bg)] px-3 py-2.5 text-xs leading-relaxed text-gray-700 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300">

            <span className="font-semibold" style={{ color: ACCENT }}>

              조건 요약{" "}

            </span>

            {discount.condition_text}

          </p>

        ) : null}

        {hasDetailContent ? (
          <details className="group mt-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/40">
            <summary className="cursor-pointer list-none text-xs font-semibold text-gray-600 marker:content-none dark:text-gray-300 [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">자세히 보기</span>
              <span className="hidden group-open:inline">접기</span>
            </summary>
            <div className="mt-2 space-y-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              {metaSummary.length > 0 ? (
                <p>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    적용 정보{" "}
                  </span>
                  {metaSummary.join(" · ")}
                </p>
              ) : null}
              {discount.installment_condition ? (
                <p>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    결제 조건{" "}
                  </span>
                  {discount.installment_condition}
                </p>
              ) : null}
              {discount.notice_text ? (
                <p>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">
                    주의사항{" "}
                  </span>
                  {discount.notice_text}
                </p>
              ) : null}
            </div>
          </details>
        ) : null}

      </div>

    </article>

  );

}


