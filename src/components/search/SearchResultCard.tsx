import type { CSSProperties } from "react";



import { BrandFavicon } from "@/components/brand/BrandFavicon";

import {

  formatDiscountValue,

  formatValidUntil,

  getBenefitTypeLabel,

} from "@/lib/search/helpers";

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

  const discountLabel = formatDiscountValue(discount.discount_value, discount.discount_unit);



  const shellStyle = {

    "--sr-soft-border": `${ACCENT}33`,

    "--sr-soft-bg": `${ACCENT}0f`,

  } as CSSProperties;



  const providerLabel = discount.provider?.name ?? "-";

  const categoryLabel = discount.benefit_category?.name ?? "-";

  const productLabel = discount.benefit_product?.name ?? "전체 상품";

  const validLabel = formatValidUntil(discount);



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

            <span className="rounded-md bg-black/15 px-2 py-0.5 text-[11px] font-black tracking-[0.28em] text-white drop-shadow-sm">

              BEST

            </span>

            <span className="text-[13px] font-bold tracking-wide text-white drop-shadow-sm">

              최고 할인

            </span>

            <span className="hidden text-[11px] font-medium text-white/85 sm:inline">

              이 브랜드에서 가장 유리한 조건

            </span>

          </div>

        </div>

      ) : null}



      <div className="p-4 sm:p-5">

        <div className="flex flex-wrap items-center gap-2">

          <span className="rounded-full bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">

            {getBenefitTypeLabel(discount)}

          </span>

          {matchesUserBenefit ? (

            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-bold text-amber-950 ring-1 ring-amber-300/90 ring-inset dark:bg-amber-950/35 dark:text-amber-100 dark:ring-amber-600/60">

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



        <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] leading-snug text-gray-500 dark:text-gray-400">

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

              적용 방법{" "}

            </span>

            {discount.condition_text}

          </p>

        ) : null}

      </div>

    </article>

  );

}


