import type { ReactNode } from "react";

import { KpiCard } from "@/components/admin/KpiCard";
import { StatsExportForm } from "@/components/admin/StatsExportForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  describeSupabaseQueryFailure,
  type SupabaseLikeError,
} from "@/lib/admin/format-db-error";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SearchLogRow = {
  keyword: string;
  normalized_keyword: string;
  matched_brand_id: number | null;
  result_status: string;
  result_count: number | null;
  created_at: string;
};

type ResultClickRow = {
  brand_id: number;
  discount_id: number;
  action_type: string;
  created_at: string;
};

type BrandRow = {
  id: number;
  name: string;
  category_id: number | null;
};

type BrandCategoryRow = {
  id: number;
  name: string;
  code: string;
};

type UserBenefitCardRow = {
  benefit_product_id: number | null;
};

type BenefitProductRow = {
  id: number;
  name: string;
  provider_id: number;
  product_type: string;
};

type ProviderRow = {
  id: number;
  name: string;
};

type DiscountRow = {
  brand_id: number;
  status: string;
};

type BrandRequestRow = {
  keyword: string;
  request_count: number;
  status: string;
  last_requested_at: string;
};

type DashboardSearchParams = {
  period?: string | string[];
};

type DashboardPageProps = {
  searchParams: Promise<DashboardSearchParams>;
};

function isDbError(error: unknown): error is SupabaseLikeError {
  return (
    !!error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

function recordDbIssue(warnings: string[], operationLabel: string, error: unknown) {
  if (isDbError(error)) {
    warnings.push(describeSupabaseQueryFailure(operationLabel, error));
  }
}

function formatNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRows<T>(items: T[] | null | undefined) {
  return items ?? [];
}

function increment(map: Map<string | number, number>, key: string | number, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function getSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function resolvePeriod(periodParam?: string) {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  let label = "오늘";
  let period = "today";

  if (periodParam === "7d") {
    start.setDate(start.getDate() - 6);
    label = "최근 7일";
    period = "7d";
  } else if (periodParam === "30d") {
    start.setDate(start.getDate() - 29);
    label = "최근 30일";
    period = "30d";
  } else if (periodParam === "month") {
    start.setDate(1);
    label = "이번 달";
    period = "month";
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { period, label, start, end };
}

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const warnings: string[] = [];

  const params = await searchParams;
  const selectedPeriod = resolvePeriod(getSearchParam(params.period));
  const supabase = createSupabaseAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isoStart = selectedPeriod.start.toISOString();
  const isoEnd = selectedPeriod.end.toISOString();

  const [
    resProfilesTotal,
    resSearchToday,
    resBrandsTotal,
    resDiscountsTotal,
    resUserBenefitsActive,
    resSearchPeriod,
    resClickDetail,
    resClickUse,
    resRequestsAttention,
    resRequestsPeriodActivity,
    resUserBenefitsNewInPeriod,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("search_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())
      .lt("created_at", tomorrow.toISOString()),
    supabase.from("brands").select("*", { count: "exact", head: true }),
    supabase.from("discounts").select("*", { count: "exact", head: true }),
    supabase
      .from("user_benefits")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("search_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd),
    supabase
      .from("result_click_logs")
      .select("*", { count: "exact", head: true })
      .eq("action_type", "view_detail")
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd),
    supabase
      .from("result_click_logs")
      .select("*", { count: "exact", head: true })
      .eq("action_type", "use_discount")
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd),
    supabase
      .from("brand_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "reviewing"]),
    supabase
      .from("brand_requests")
      .select("*", { count: "exact", head: true })
      .gte("last_requested_at", isoStart)
      .lte("last_requested_at", isoEnd),
    supabase
      .from("user_benefits")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd),
  ]);

  recordDbIssue(
    warnings,
    "profiles (전체 가입자 수, 테이블: profiles, 카운트 쿼리)",
    resProfilesTotal.error,
  );
  recordDbIssue(
    warnings,
    "search_logs (오늘 검색 수, 컬럼: created_at)",
    resSearchToday.error,
  );
  recordDbIssue(
    warnings,
    "brands (등록 브랜드 수, 테이블: brands)",
    resBrandsTotal.error,
  );
  recordDbIssue(
    warnings,
    "discounts (등록 할인 수, 테이블: discounts)",
    resDiscountsTotal.error,
  );
  recordDbIssue(
    warnings,
    "user_benefits (현재 활성 보유혜택 수, 컬럼: is_active)",
    resUserBenefitsActive.error,
  );
  recordDbIssue(
    warnings,
    `search_logs (선택 기간 검색 수, 테이블: search_logs, 기간 필터 컬럼: created_at) — ${selectedPeriod.label}`,
    resSearchPeriod.error,
  );
  recordDbIssue(
    warnings,
    `result_click_logs (선택 기간 상세보기 클릭 수, 컬럼: action_type, created_at) — 값: view_detail — ${selectedPeriod.label}`,
    resClickDetail.error,
  );
  recordDbIssue(
    warnings,
    `result_click_logs (선택 기간 할인 활용 클릭 수, 컬럼: action_type, created_at) — 값: use_discount — ${selectedPeriod.label}`,
    resClickUse.error,
  );
  recordDbIssue(
    warnings,
    "brand_requests (처리 필요 요청: pending·reviewing, 컬럼: status)",
    resRequestsAttention.error,
  );
  recordDbIssue(
    warnings,
    `brand_requests (선택 기간 요청 활동 건수, 컬럼: last_requested_at) — ${selectedPeriod.label}`,
    resRequestsPeriodActivity.error,
  );
  recordDbIssue(
    warnings,
    `user_benefits (선택 기간 신규 보유혜택 등록, 컬럼: created_at, is_active=true) — ${selectedPeriod.label}`,
    resUserBenefitsNewInPeriod.error,
  );

  const totalUsers = resProfilesTotal.count ?? 0;
  const todaySearches = resSearchToday.count ?? 0;
  const totalBrands = resBrandsTotal.count ?? 0;
  const totalDiscounts = resDiscountsTotal.count ?? 0;
  const totalUserBenefits = resUserBenefitsActive.count ?? 0;
  const periodSearches = resSearchPeriod.count ?? 0;
  const clickDetailPeriod = resClickDetail.count ?? 0;
  const clickUsePeriod = resClickUse.count ?? 0;
  const requestsNeedingWork = resRequestsAttention.count ?? 0;
  const requestsTouchedInPeriod = resRequestsPeriodActivity.count ?? 0;
  const newBenefitsInPeriod = resUserBenefitsNewInPeriod.count ?? 0;

  const [
    resRequestCounts,
    resSearchLogAgg,
    resBrandsRows,
    resUserBenefitsCards,
    resBenefitProducts,
    resProviders,
    resDiscountRows,
    resBrandCategories,
    resRecentRequests,
    resClickLogsPeriod,
  ] = await Promise.all([
    supabase.from("brand_requests").select("request_count").range(0, 50_000),
    supabase
      .from("search_logs")
      .select(
        "keyword,normalized_keyword,matched_brand_id,result_status,result_count,created_at",
      )
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd)
      .order("created_at", { ascending: false })
      .range(0, 9999),
    supabase.from("brands").select("id,name,category_id").range(0, 9999),
    supabase
      .from("user_benefits")
      .select("benefit_product_id")
      .eq("is_active", true),
    supabase.from("benefit_products").select("id,name,provider_id,product_type").range(0, 9999),
    supabase.from("providers").select("id,name").range(0, 9999),
    supabase.from("discounts").select("brand_id,status").range(0, 9999),
    supabase.from("brand_categories").select("id,name,code").order("sort_order", {
      ascending: true,
    }),
    supabase
      .from("brand_requests")
      .select("keyword,request_count,status,last_requested_at")
      .order("last_requested_at", { ascending: false })
      .limit(10),
    supabase
      .from("result_click_logs")
      .select("brand_id,discount_id,action_type,created_at")
      .gte("created_at", isoStart)
      .lte("created_at", isoEnd)
      .order("created_at", { ascending: false })
      .range(0, 7999),
  ]);

  recordDbIssue(
    warnings,
    "brand_requests (누적 request_count 로드용, 컬럼: request_count)",
    resRequestCounts.error,
  );
  recordDbIssue(
    warnings,
    `search_logs (표·TOP용 로우, 컬럼: keyword, normalized_keyword, matched_brand_id, result_status, result_count, created_at) — ${selectedPeriod.label}`,
    resSearchLogAgg.error,
  );
  recordDbIssue(
    warnings,
    "brands (브랜드명 조인)",
    resBrandsRows.error,
  );
  recordDbIssue(
    warnings,
    "user_benefits (등록 카드 TOP용, 컬럼: benefit_product_id)",
    resUserBenefitsCards.error,
  );
  recordDbIssue(
    warnings,
    "benefit_products",
    resBenefitProducts.error,
  );
  recordDbIssue(
    warnings,
    "providers",
    resProviders.error,
  );
  recordDbIssue(
    warnings,
    "discounts (카테고리별 활성 분포)",
    resDiscountRows.error,
  );
  recordDbIssue(
    warnings,
    "brand_categories",
    resBrandCategories.error,
  );
  recordDbIssue(
    warnings,
    "brand_requests (최근 요청 목록)",
    resRecentRequests.error,
  );
  recordDbIssue(
    warnings,
    `result_click_logs (클릭 TOP·목록용, 컬럼: brand_id, discount_id, action_type, created_at) — ${selectedPeriod.label}`,
    resClickLogsPeriod.error,
  );

  const updateRequestSum = getRows(
    resRequestCounts.data as { request_count: number }[] | null,
  ).reduce((sum, row) => sum + row.request_count, 0);

  const searchLogs = getRows(resSearchLogAgg.data as SearchLogRow[] | null);

  const clickLogsSorted = [...getRows(resClickLogsPeriod.data as ResultClickRow[] | null)].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const brands = getRows(resBrandsRows.data as BrandRow[] | null);
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));
  const benefitProducts = getRows(resBenefitProducts.data as BenefitProductRow[] | null);
  const productById = new Map(benefitProducts.map((product) => [product.id, product]));
  const providerById = new Map(
    getRows(resProviders.data as ProviderRow[] | null).map((provider) => [provider.id, provider]),
  );
  const brandCategories = getRows(resBrandCategories.data as BrandCategoryRow[] | null);

  const brandSearchCount = new Map<number, number>();
  const keywordSearchCount = new Map<string, { keyword: string; count: number }>();
  for (const log of searchLogs) {
    const keywordKey = log.normalized_keyword || log.keyword.trim().toLowerCase();
    const keywordRow = keywordSearchCount.get(keywordKey) ?? {
      keyword: log.keyword,
      count: 0,
    };
    keywordRow.count += 1;
    keywordSearchCount.set(keywordKey, keywordRow);

    if (log.matched_brand_id) {
      increment(brandSearchCount, log.matched_brand_id);
    }
  }
  const popularKeywords = [...keywordSearchCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const popularBrands = [...brandSearchCount.entries()]
    .map(([brandId, count]) => ({
      brandName: brandById.get(brandId)?.name ?? `#${brandId}`,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const brandClickCount = new Map<number, number>();
  for (const row of clickLogsSorted) {
    increment(brandClickCount, row.brand_id);
  }
  const popularClickBrands = [...brandClickCount.entries()]
    .map(([brandId, count]) => ({
      brandName: brandById.get(brandId)?.name ?? `#${brandId}`,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const cardProductCount = new Map<number, number>();
  for (const row of getRows(resUserBenefitsCards.data as UserBenefitCardRow[] | null)) {
    const product =
      row.benefit_product_id == null ? null : productById.get(row.benefit_product_id);
    const isCardProduct =
      product?.product_type === "credit_card" ||
      product?.product_type === "debit_card" ||
      product?.product_type === "prepaid_card";
    if (row.benefit_product_id && isCardProduct) {
      increment(cardProductCount, row.benefit_product_id);
    }
  }
  const topCards = [...cardProductCount.entries()]
    .map(([productId, count]) => {
      const product = productById.get(productId);
      return {
        productName: product?.name ?? `#${productId}`,
        providerName: product ? providerById.get(product.provider_id)?.name ?? "-" : "-",
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const noResultByKeyword = new Map<
    string,
    { keyword: string; totalCount: number; zeroCount: number }
  >();
  for (const log of searchLogs) {
    const key = log.normalized_keyword || log.keyword.trim().toLowerCase();
    const existing = noResultByKeyword.get(key) ?? {
      keyword: log.keyword,
      totalCount: 0,
      zeroCount: 0,
    };
    existing.totalCount += 1;
    if (log.result_status === "unmatched" || log.result_count === 0) {
      existing.zeroCount += 1;
    }
    noResultByKeyword.set(key, existing);
  }
  const noResultKeywords = [...noResultByKeyword.values()]
    .filter((row) => row.zeroCount > 0)
    .map((row) => ({
      ...row,
      zeroRate: row.totalCount > 0 ? row.zeroCount / row.totalCount : 0,
    }))
    .sort((a, b) => b.zeroCount - a.zeroCount || b.zeroRate - a.zeroRate)
    .slice(0, 10);

  const activeDiscounts = getRows(resDiscountRows.data as DiscountRow[] | null).filter(
    (discount) => discount.status === "active",
  );
  const activeDiscountCountByCategory = new Map<number, number>();
  const brandCountByCategory = new Map<number, number>();
  for (const brand of brands) {
    if (brand.category_id) {
      increment(brandCountByCategory, brand.category_id);
    }
  }
  for (const discount of activeDiscounts) {
    const brand = brandById.get(discount.brand_id);
    if (brand?.category_id) {
      increment(activeDiscountCountByCategory, brand.category_id);
    }
  }
  const categoryDiscountRows = brandCategories.map((category) => ({
    categoryName: category.name,
    categoryCode: category.code,
    brandCount: brandCountByCategory.get(category.id) ?? 0,
    discountCount: activeDiscountCountByCategory.get(category.id) ?? 0,
  }));
  const maxCategoryDiscount = Math.max(
    ...categoryDiscountRows.map((row) => row.discountCount),
    1,
  );

  const recentRequests = getRows(resRecentRequests.data as BrandRequestRow[] | null);
  const recentSearchLogs = searchLogs.slice(0, 12);
  const recentClickLogs = clickLogsSorted.slice(0, 12);

  const catalogKpis = [
    ["총 가입자 수", formatNumber(totalUsers), "primary", "bi-people"],
    ["오늘 검색 수", formatNumber(todaySearches), "success", "bi-search"],
    ["등록된 브랜드 수", formatNumber(totalBrands), "secondary", "bi-shop"],
    ["등록된 할인 수", formatNumber(totalDiscounts), "info", "bi-tags"],
  ] as const;

  const opsKpis = [
    [
      `선택 기간 검색 수 (${selectedPeriod.label})`,
      formatNumber(periodSearches),
      "success",
      "bi-graph-up",
    ],
    ["활성 보유혜택 수", formatNumber(totalUserBenefits), "danger", "bi-wallet2"],
    [
      `${selectedPeriod.label} · 결과 상세 클릭`,
      formatNumber(clickDetailPeriod),
      "info",
      "bi-eye",
    ],
    [
      `${selectedPeriod.label} · 할인 활용 클릭`,
      formatNumber(clickUsePeriod),
      "warning",
      "bi-mouse2-fill",
    ],
    ["처리 필요 업데이트 요청(pending/reviewing)", formatNumber(requestsNeedingWork), "warning", "bi-inboxes"],
    [
      `${selectedPeriod.label} · 요청 최근 활동 건수`,
      formatNumber(requestsTouchedInPeriod),
      "secondary",
      "bi-megaphone",
    ],
    [
      `${selectedPeriod.label} · 신규 보유혜택 등록`,
      formatNumber(newBenefitsInPeriod),
      "primary",
      "bi-plus-circle",
    ],
    ["누적 요청 카운터 합Σ(request_count)", formatNumber(updateRequestSum), "info", "bi-list-ol"],
  ] as const;

  return (
    <>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Dashboard</h1>
          <p className="text-muted mb-0">
            search_logs, result_click_logs, brand_requests, user_benefits 및 카탈로그 테이블을 기준으로
            실제 집계를 표시합니다.
          </p>
        </div>
        <span className="badge text-bg-light text-dark border">
          기준: {formatDateTime(new Date().toISOString())}
        </span>
      </div>

      {warnings.length > 0 ? (
        <div className="alert alert-warning shadow-sm border-0 mb-4" role="alert">
          <div className="fw-bold">
            데이터베이스 조회 오류 {warnings.length}건 — 참고용 수치만 표시됩니다
          </div>
          <div className="small text-muted mt-1 mb-3">
            아래 블록에 테이블/컬럼명을 포함하여 어떤 쿼리가 실패했는지 확인할 수 있습니다. 해당 쿼리의
            관련 카드·표 값은 부정확하거나 비어 있을 수 있습니다.
          </div>
          <div className="d-flex flex-column gap-2">
            {warnings.map((detail, idx) => (
              <pre
                key={idx}
                className="mb-0 small p-3 bg-white border rounded shadow-sm text-break"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {detail}
              </pre>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-3 fw-semibold text-muted small">카탈로그 · 회원 규모</div>
      <div className="row g-4 mb-2">
        {catalogKpis.map(([title, value, variant, icon]) => (
          <div key={title} className="col-6 col-xl-3">
            <KpiCard title={title} value={value} variant={variant} icon={icon} />
          </div>
        ))}
      </div>

      <div className="mb-3 fw-semibold text-muted small mt-4">선택 기간 운영 (검색·클릭·요청·보유혜택)</div>
      <div className="row g-4 mb-4">
        {opsKpis.map(([title, value, variant, icon]) => (
          <div key={title} className="col-6 col-md-4 col-xl-3">
            <KpiCard title={title} value={value} variant={variant} icon={icon} />
          </div>
        ))}
      </div>

      <StatsExportForm />

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="fw-bold">Dashboard 기간 필터</div>
            <div className="small text-muted">
              현재 분석 구간: {selectedPeriod.label}. 직접 기간 선택은 추후 확장 예정입니다.
            </div>
          </div>
          <div className="btn-group" role="group" aria-label="Dashboard 기간 필터">
            {[
              ["today", "오늘"],
              ["7d", "7일"],
              ["30d", "30일"],
              ["month", "이번 달"],
            ].map(([periodKey, label]) => (
              <a
                key={periodKey}
                href={`/admin/dashboard?period=${periodKey}`}
                className={`btn btn-sm ${
                  selectedPeriod.period === periodKey ? "btn-success" : "btn-outline-secondary"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-4">
        <DashboardTable
          title="인기 검색어 TOP 10"
          description={`search_logs.keyword (${selectedPeriod.label})`}
          columns={["순위", "검색어", "검색 수"]}
          emptyText="선택한 기간에 저장된 검색 로그가 없습니다. 검색 기능이 실행 중인지 확인해 보세요."
          rows={popularKeywords.map((row, index) => [
            index + 1,
            <span key={row.keyword} className="fw-semibold">
              {row.keyword}
            </span>,
            <span key={`${row.keyword}-count`} className="d-block text-end">
              {formatNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="인기 검색 브랜드 TOP 10"
          description={`search_logs.matched_brand_id (${selectedPeriod.label})`}
          columns={["순위", "브랜드", "검색 수"]}
          emptyText="브랜드에 매칭된 검색 기록이 없습니다. 브랜드명 매칭·검색 로그 적재 상태를 확인해 보세요."
          rows={popularBrands.map((row, index) => [
            index + 1,
            <span key={row.brandName} className="fw-semibold">
              {row.brandName}
            </span>,
            <span key={`${row.brandName}-count`} className="d-block text-end">
              {formatNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="결과 클릭 많은 브랜드 TOP 10"
          description={`result_click_logs.brand_id 집계 (${selectedPeriod.label}, 최신 8000건 기준 표본)`}
          columns={["순위", "브랜드", "클릭 수"]}
          emptyText="선택한 기간에 result_click_logs에 기록된 클릭이 없거나, 해당 테이블을 읽을 수 없었습니다."
          rows={popularClickBrands.map((row, index) => [
            index + 1,
            <span key={row.brandName} className="fw-semibold">
              {row.brandName}
            </span>,
            <span key={`${row.brandName}-c`} className="d-block text-end">
              {formatNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="많이 등록된 카드 TOP 10"
          description="user_benefits (활성) + 신용·체크·선불 카드형 benefit_products만"
          columns={["순위", "카드", "카드사", "등록 수"]}
          emptyText="활성 user_benefits 중 카드 상품 매핑 건수가 부족합니다. 보유혜택 또는 상품 카탈로그를 확인해 보세요."
          rows={topCards.map((row, index) => [
            index + 1,
            <span key={row.productName} className="fw-semibold">
              {row.productName}
            </span>,
            row.providerName,
            <span key={`${row.productName}-count`} className="d-block text-end">
              {formatNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="무결과 비율이 높은 검색어 TOP 10"
          description={`search_logs의 result_status=unmatched 또는 result_count=0 (${selectedPeriod.label})`}
          columns={["키워드", "검색 수", "0건 수", "0건 비율"]}
          emptyText="무결과로 분류된 검색 로그 샘플이 없습니다."
          rows={noResultKeywords.map((row) => [
            <span key={`${row.keyword}-keyword`} className="fw-semibold">
              {row.keyword}
            </span>,
            formatNumber(row.totalCount),
            formatNumber(row.zeroCount),
            `${Math.round(row.zeroRate * 100)}%`,
          ])}
        />

        <DashboardTable
          title="최근 업데이트 요청 (brand_requests)"
          description="테이블: brand_requests, 최근 활동 순 10건"
          columns={["키워드", "누적 요청", "상태", "최근 요청 시각"]}
          emptyText="업데이트 요청 레코드가 없습니다."
          rows={recentRequests.map((row) => [
            <span key={`${row.keyword}-keyword`} className="fw-semibold">
              {row.keyword}
            </span>,
            formatNumber(row.request_count),
            <StatusBadge key={`${row.keyword}-status`} status={row.status} />,
            formatDateTime(row.last_requested_at),
          ])}
        />

        <DashboardTable
          title="최근 검색 로그 (search_logs)"
          description={`테이블: search_logs, 선택 기간에서 최근 12건 (${selectedPeriod.label})`}
          columns={["검색어", "상태", "결과 수", "시각"]}
          emptyText="선택 기간 안에 검색 로그 행이 없습니다."
          rows={recentSearchLogs.map((row) => [
            <span key={`${row.created_at}-kw`} className="fw-semibold">
              {row.keyword}
            </span>,
            <StatusBadge key={`${row.created_at}-rs`} status={row.result_status} />,
            row.result_count ?? "—",
            formatDateTime(row.created_at),
          ])}
        />

        <DashboardTable
          title="최근 결과 클릭 로그 (result_click_logs)"
          description={`선택 기간에서 최근 12건 (${selectedPeriod.label})`}
          columns={["브랜드", "할인 id", "유형", "시각"]}
          emptyText="선택 기간 안에 결과 클릭 로그가 없습니다."
          rows={recentClickLogs.map((row, index) => {
            const bn = brandById.get(row.brand_id)?.name ?? `#${row.brand_id}`;
            return [
              <span key={`${row.created_at}-b-${index}`} className="fw-semibold">
                {bn}
              </span>,
              String(row.discount_id),
              <StatusBadge key={`${row.created_at}-a-${index}`} status={row.action_type} />,
              formatDateTime(row.created_at),
            ];
          })}
        />

        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="fw-bold">카테고리별 브랜드 / 활성 할인 수</div>
              <div className="small text-muted mt-1">
                브랜드는 brands.category_id 기준·할인은 discounts.status = active 분포입니다.
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {categoryDiscountRows.map((row) => {
                  const pct = Math.round((row.discountCount / maxCategoryDiscount) * 100);
                  return (
                    <div key={row.categoryCode} className="col-md-6 col-xl-4">
                      <div className="rounded-3 border p-3 h-100">
                        <div className="d-flex justify-content-between align-items-center gap-3">
                          <div>
                            <div className="fw-semibold">{row.categoryName}</div>
                            <div className="small text-muted">{row.categoryCode}</div>
                          </div>
                          <div className="text-end">
                            <div className="fs-4 fw-bold">{formatNumber(row.discountCount)}</div>
                            <div className="small text-muted">
                              브랜드 {formatNumber(row.brandCount)}개
                            </div>
                          </div>
                        </div>
                        <div className="progress mt-3" style={{ height: 8 }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: `${pct}%` }}
                            aria-label={`${row.categoryName} 활성 할인 비교 막대`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardTable({
  title,
  description,
  columns,
  rows,
  emptyText,
}: {
  title: string;
  description: string;
  columns: string[];
  rows: ReactNode[][];
  emptyText: string;
}) {
  return (
    <div className="col-xl-6">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <div className="fw-bold">{title}</div>
          <div className="small text-muted mt-1">{description}</div>
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="py-4 text-center text-muted">
                    {emptyText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
