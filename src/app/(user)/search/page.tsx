import Link from "next/link";
import { cookies } from "next/headers";

import { UserPage } from "@/components/layout/UserPage";
import { EmptyState } from "@/components/search/EmptyState";
import { SearchHubChrome } from "@/components/search/SearchHubChrome";
import { SearchResultsCards } from "@/components/search/SearchResultsCards";
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
  const displayDiscounts = result.authenticated
    ? sortDiscountsPrioritizeOwned(result.discounts, ownedSet)
    : result.discounts;
  const { matchedBrand: brand } = result;
  const hasDiscounts = displayDiscounts.length > 0;
  const searchRedirect = `/search?keyword=${encodeURIComponent(keyword)}`;
  const showThemeParkFilters =
    result.brandCategoryCode === "amusement_park" ||
    result.brandCategoryCode === "theme_park";

  return (
    <UserPage tone="comfortable" className="sr-user-search-results-page">
      <div className="sr-user-search-results-rail sr-user-content-width">
        <SearchHubChrome variant="results" defaultValue={keyword} hideSuggestions />

        <section className="sr-user-search-results-list">
        {hasDiscounts ? (
          <SearchResultsCards
            brandName={brand.name}
            officialUrl={brand.official_url}
            discounts={displayDiscounts}
            totalCount={displayDiscounts.length}
            bestDiscountId={result.bestDiscountId}
            ownedDiscountIds={result.ownedDiscountIds}
            showThemeParkFilters={showThemeParkFilters}
            authenticated={result.authenticated}
            loginRedirect={searchRedirect}
          />
        ) : (
          <div className="sr-user-search-panel sr-user-search-panel--empty text-center">
            <p className="sr-user-t-card-title sr-user-search-panel__title">
              {result.authenticated
                ? "등록한 혜택으로 받을 수 있는 할인이 아직 없어요."
                : "현재 확인된 할인 정보가 없어요."}
            </p>
            <p className="sr-user-t-muted sr-user-search-panel__body mt-2">
              {result.authenticated
                ? "다른 카드나 카드사 전체 혜택을 등록하면 결과가 달라질 수 있어요."
                : "로그인 후 내 혜택을 등록하면 맞춤 할인을 볼 수 있어요."}
            </p>
            {result.authenticated ? (
              <Link
                href="/my-benefits"
                className="sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--compact sr-user-btn-primary--block mt-4"
              >
                내 혜택 등록·수정
              </Link>
            ) : (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent("/my-benefits")}`}
                className="sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--compact sr-user-btn-primary--block mt-4"
              >
                로그인하고 혜택 등록
              </Link>
            )}
          </div>
        )}

        {result.hasMvnoDiscount ? (
          <p className="sr-user-search-panel sr-user-search-panel--note sr-user-t-muted">
            알뜰요금제 혜택은 통신사·요금제별로 다를 수 있어 실제 적용 여부를 꼭 확인해 주세요.
          </p>
        ) : null}

        {result.authenticated ? (
          <div className="sr-user-search-results-benefits-cta">
            <Link
              href="/my-benefits"
              className="sr-user-btn-primary sr-user-btn-primary--block sr-user-search-results-benefits-cta__button"
            >
              내 혜택 수정하기
            </Link>
          </div>
        ) : null}
        </section>
      </div>
    </UserPage>
  );
}
