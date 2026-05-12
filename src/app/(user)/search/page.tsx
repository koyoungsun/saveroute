import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BrandFavicon } from "@/components/brand/BrandFavicon";
import { EmptyState } from "@/components/search/EmptyState";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { ThemeParkConditionFilters } from "@/components/search/ThemeParkConditionFilters";
import { performSearch } from "@/lib/search/perform-search";
import { sortDiscountsPrioritizeOwned } from "@/lib/search/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SearchPageProps = {
  searchParams: Promise<{
    keyword?: string | string[];
  }>;
};

function getKeyword(keyword?: string | string[]) {
  if (Array.isArray(keyword)) {
    return keyword[0]?.trim() ?? "";
  }

  return keyword?.trim() ?? "";
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const keyword = getKeyword(params.keyword);

  if (!keyword) {
    return <EmptyState keyword="" />;
  }

  const supabase = await createServerSupabaseClient();
  const result = await performSearch(supabase, keyword);

  if (!result.matchedBrand) {
    return <EmptyState keyword={keyword} variant="unregistered_brand" />;
  }

  const ownedSet = new Set(result.ownedDiscountIds);
  const displayDiscounts = sortDiscountsPrioritizeOwned(result.discounts, ownedSet);
  const { matchedBrand: brand } = result;
  const hasDiscounts = displayDiscounts.length > 0;
  const showThemeParkFilters =
    result.brandCategoryCode === "amusement_park" ||
    result.brandCategoryCode === "theme_park";

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm">
          <span className="block truncate">{keyword}</span>
        </div>
      </div>

      <section className="mt-5">
        <div className="flex items-center gap-3">
          <BrandFavicon
            brandName={brand.name}
            officialUrl={brand.official_url}
            size={32}
          />
          <h1 className="min-w-0 truncate text-xl font-bold text-gray-900">{brand.name}</h1>
        </div>
        {result.brandCategoryName ? (
          <p className="mt-1 text-xs text-gray-500">{result.brandCategoryName}</p>
        ) : null}
      </section>

      <section className="mt-4 space-y-4">
        {showThemeParkFilters ? <ThemeParkConditionFilters /> : null}

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#409A53]">
              할인 결과
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-gray-950">
              {result.authenticated ? "내가 받을 수 있는 할인" : "전체 할인 결과"}
            </h2>
          </div>
          <p className="shrink-0 text-xs font-semibold text-gray-400">
            {displayDiscounts.length}개
          </p>
        </div>

        {hasDiscounts ? (
          <div className="space-y-3">
            {displayDiscounts.map((discount, index) => (
              <SearchResultCard
                key={discount.id}
                brandName={brand.name}
                officialUrl={brand.official_url}
                discount={discount}
                isBest={result.bestDiscountId === discount.id}
                matchesUserBenefit={ownedSet.has(discount.id)}
                featured={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">
              {result.authenticated
                ? "현재 등록된 혜택으로 받을 수 있는 할인이 없습니다."
                : "현재 확인된 할인 정보가 없습니다."}
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {result.authenticated
                ? "보유혜택을 추가하거나 수정하면 맞춤 할인 결과가 달라질 수 있어요."
                : "내 혜택을 등록하면 맞춤 할인을 볼 수 있어요."}
            </p>
          </div>
        )}

        {result.hasMvnoDiscount ? (
          <p className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs leading-5 text-orange-800 dark:border-orange-900/40 dark:bg-orange-950/40 dark:text-orange-200">
            알뜰요금제 혜택은 통신사/요금제별로 다를 수 있어 실제 적용 여부 확인이 필요합니다.
          </p>
        ) : null}

        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs leading-5 text-gray-500">
            {result.authenticated
              ? "보유카드를 바꾸거나 통신사 혜택을 추가하면 검색 결과가 다시 맞춰집니다."
              : "내 혜택을 등록하면 맞춤 할인을 볼 수 있어요."}
          </p>
          {result.authenticated ? (
            <Link
              href="/my-benefits"
              className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#409A53]/40 hover:text-[#409A53] active:scale-[0.98]"
            >
              내 혜택 수정하기
            </Link>
          ) : (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/auth/login?redirect=${encodeURIComponent("/my-benefits")}`}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#409A53]/40 hover:text-[#409A53] active:scale-[0.98]"
              >
                로그인하고 혜택 등록
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#409A53]/40 hover:text-[#409A53] active:scale-[0.98]"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
