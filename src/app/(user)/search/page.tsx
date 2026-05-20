import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft } from "lucide-react";

import { BrandFavicon } from "@/components/brand/BrandFavicon";
import { EmptyState } from "@/components/search/EmptyState";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { ThemeParkConditionFilters } from "@/components/search/ThemeParkConditionFilters";
import { performSearch } from "@/lib/search/perform-search";
import { sortDiscountsPrioritizeOwned } from "@/lib/search/helpers";
import { VISITOR_SESSION_COOKIE } from "@/lib/session/visitor-session";
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
    return <EmptyState variant="no_keyword" />;
  }

  let result;
  try {
    const supabase = await createServerSupabaseClient();
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(VISITOR_SESSION_COOKIE)?.value ?? null;
    result = await performSearch(supabase, keyword, { sessionId });
  } catch {
    return <EmptyState keyword={keyword} variant="search_error" />;
  }

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
    <div className="px-4 py-3 pb-10">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition hover:bg-gray-50"
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
            {result.authenticated && ownedSet.size > 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                내 혜택과 연결된 할인 {ownedSet.size}건을 우선 표시합니다.
              </p>
            ) : null}
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
                ? "등록한 혜택으로 받을 수 있는 할인이 아직 없어요."
                : "현재 확인된 할인 정보가 없어요."}
            </p>
            <p className="mt-2 text-xs leading-5 text-gray-500">
              {result.authenticated
                ? "다른 카드나 카드사 전체 혜택을 등록하면 결과가 달라질 수 있어요."
                : "로그인 후 내 혜택을 등록하면 맞춤 할인을 볼 수 있어요."}
            </p>
            {result.authenticated ? (
              <Link
                href="/my-benefits"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-sr-primary px-4 text-sm font-semibold text-white hover:bg-sr-primary-hover"
              >
                내 혜택 등록·수정
              </Link>
            ) : (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent("/my-benefits")}`}
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-sr-primary px-4 text-sm font-semibold text-white hover:bg-sr-primary-hover"
              >
                로그인하고 혜택 등록
              </Link>
            )}
          </div>
        )}

        {result.hasMvnoDiscount ? (
          <p className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs leading-5 text-orange-800">
            알뜰요금제 혜택은 통신사·요금제별로 다를 수 있어 실제 적용 여부를 꼭 확인해 주세요.
          </p>
        ) : null}

        <div className="rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <p className="text-xs leading-5 text-gray-500">
            {result.authenticated
              ? "보유 카드·통신사 혜택을 바꾸면 검색 결과의 «내 할인 가능» 표시가 함께 바뀝니다."
              : "내 혜택을 등록하면 받을 수 있는 할인에 «내 할인 가능» 배지가 표시됩니다."}
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
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#409A53]/40 hover:text-[#409A53] active:scale-[0.98]"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:border-[#409A53]/40 hover:text-[#409A53] active:scale-[0.98]"
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
