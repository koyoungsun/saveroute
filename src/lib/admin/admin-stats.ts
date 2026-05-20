import type { SupabaseClient } from "@supabase/supabase-js";

import {
  describeSupabaseQueryFailure,
  type SupabaseLikeError,
} from "@/lib/admin/format-db-error";
import { getSearchLogsTodayWindow, type StatsDayWindow } from "@/lib/admin/search-logs-stats-window";

export type AdminStatsPeriodKey = "today" | "7d" | "30d" | "all";

export type AdminStatsPeriod = {
  key: AdminStatsPeriodKey;
  label: string;
  start: Date | null;
  end: Date;
};

export type SearchLogStatsRow = {
  keyword: string;
  normalized_keyword: string;
  matched_brand_id: number | null;
  gender_group: string | null;
  age_group: string | null;
  result_status: string;
  result_count: number | null;
  created_at: string;
};

export type ResultClickStatsRow = {
  brand_id: number;
  discount_id: number;
  action_type: string;
  created_at: string;
};

export type BrandRequestStatsRow = {
  keyword: string;
  request_count: number;
  status: string;
  last_requested_at: string;
};

export type RankCountRow = {
  keyword?: string;
  brandName?: string;
  brandId?: number;
  productName?: string;
  providerName?: string;
  count: number;
};

export type NoResultKeywordRow = {
  keyword: string;
  totalCount: number;
  zeroCount: number;
  zeroRate: number;
};

export type BrandRankingRow = {
  brandName: string;
  searches: number;
  detailViews: number;
  clicks: number;
};

export type CategoryRegistrationRow = {
  categoryName: string;
  categoryCode: string;
  count: number;
};

export type CategoryDiscountRow = {
  categoryName: string;
  categoryCode: string;
  brandCount: number;
  discountCount: number;
};

export type DailyCountRow = {
  date: string;
  count: number;
};

export type LabeledCountRow = {
  label: string;
  count: number;
};

export type AdminStatsTotals = {
  totalBrands: number;
  activeBrands: number;
  totalDiscounts: number;
  activeDiscounts: number;
  totalProfiles: number;
  totalUserBenefits: number;
  activeUserBenefits: number;
  totalBrandRequests: number;
  brandRequestsNeedingWork: number;
  todaySearches: number;
  todayDistinctLoginUsers: number;
  todayDistinctKeywords: number;
  periodSearches: number;
  periodDetailClicks: number;
  periodUseClicks: number;
  updateRequestSum: number;
  requestsTouchedInPeriod: number;
  newBenefitsInPeriod: number;
};

export type AdminStatsSnapshot = {
  period: AdminStatsPeriod;
  searchLogsTodayWindow: StatsDayWindow;
  warnings: string[];
  logSampleCapped: boolean;
  totals: AdminStatsTotals;
  popularKeywords: RankCountRow[];
  popularSearchBrands: RankCountRow[];
  popularClickBrands: RankCountRow[];
  topRegisteredCards: RankCountRow[];
  noResultKeywords: NoResultKeywordRow[];
  brandDiscountCounts: RankCountRow[];
  benefitCategoryRegistrations: CategoryRegistrationRow[];
  categoryDiscountRows: CategoryDiscountRow[];
  recentSearchLogs: SearchLogStatsRow[];
  recentClickLogs: ResultClickStatsRow[];
  recentBrandRequests: BrandRequestStatsRow[];
  dailySearchTrend: DailyCountRow[];
  brandSearchChart: LabeledCountRow[];
  brandRequestChart: LabeledCountRow[];
  categorySearchChart: LabeledCountRow[];
  ageGroupChart: LabeledCountRow[];
  genderChart: LabeledCountRow[];
  brandRankingRows: BrandRankingRow[];
  brandNameById: Map<number, string>;
};

const LOG_AGGREGATION_LIMIT = 15_000;

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

function getRows<T>(items: T[] | null | undefined) {
  return items ?? [];
}

function increment(map: Map<string | number, number>, key: string | number, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

export function isActiveDiscountRecord(
  row: { status?: string | null; is_active?: boolean | null },
): boolean {
  if (row.is_active === true) {
    return true;
  }

  return row.status === "active";
}

export function resolveAdminStatsPeriod(
  periodParam?: string,
  defaultKey: AdminStatsPeriodKey = "30d",
): AdminStatsPeriod {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (periodParam === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { key: "today", label: "오늘", start, end };
  }

  if (periodParam === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { key: "7d", label: "최근 7일", start, end };
  }

  if (periodParam === "all") {
    return { key: "all", label: "전체", start: null, end };
  }

  if (periodParam === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { key: "30d", label: "최근 30일", start, end };
  }

  if (defaultKey === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { key: "today", label: "오늘", start, end };
  }

  if (defaultKey === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { key: "7d", label: "최근 7일", start, end };
  }

  if (defaultKey === "all") {
    return { key: "all", label: "전체", start: null, end };
  }

  const start = new Date(now);
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);
  return { key: "30d", label: "최근 30일", start, end };
}

function toLocalDateKey(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(
    new Date(iso),
  );
}

function formatGenderLabel(value: string) {
  const labels: Record<string, string> = {
    male: "남성",
    female: "여성",
    other: "기타",
  };

  return labels[value] ?? value;
}

function formatAgeLabel(value: string) {
  const labels: Record<string, string> = {
    "10s": "10대",
    "20s": "20대",
    "30s": "30대",
    "40s": "40대",
    "50s": "50대",
    "60s+": "60대+",
  };

  return labels[value] ?? value;
}

function buildDailySearchTrend(
  period: AdminStatsPeriod,
  searchLogs: SearchLogStatsRow[],
): DailyCountRow[] {
  const countsByDate = new Map<string, number>();

  for (const log of searchLogs) {
    const key = toLocalDateKey(log.created_at);
    increment(countsByDate, key);
  }

  if (period.start == null) {
    return [...countsByDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }

  const rows: DailyCountRow[] = [];
  const cursor = new Date(period.start);
  const end = new Date(period.end);

  while (cursor <= end) {
    const date = toLocalDateKey(cursor.toISOString());
    rows.push({ date, count: countsByDate.get(date) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return rows;
}

function applyPeriodFilter<T extends { gte: Function; lte: Function }>(
  query: T,
  period: AdminStatsPeriod,
  column: string,
) {
  if (period.start) {
    query = query.gte(column, period.start.toISOString()) as T;
  }

  return query.lte(column, period.end.toISOString()) as T;
}

export async function loadAdminStatsSnapshot(
  supabase: SupabaseClient,
  periodParam?: string,
  defaultPeriod: AdminStatsPeriodKey = "30d",
): Promise<AdminStatsSnapshot> {
  const warnings: string[] = [];
  const period = resolveAdminStatsPeriod(periodParam, defaultPeriod);

  const searchLogsTodayWindow = getSearchLogsTodayWindow();

  const [
    resProfilesTotal,
    resSearchToday,
    resSearchTodayRows,
    resBrandsTotal,
    resBrandsActive,
    resDiscountsTotal,
    resDiscountsActive,
    resUserBenefitsTotal,
    resUserBenefitsActive,
    resBrandRequestsTotal,
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
      .gte("created_at", searchLogsTodayWindow.startIso)
      .lt("created_at", searchLogsTodayWindow.endExclusiveIso),
    supabase
      .from("search_logs")
      .select("user_id,normalized_keyword")
      .gte("created_at", searchLogsTodayWindow.startIso)
      .lt("created_at", searchLogsTodayWindow.endExclusiveIso),
    supabase.from("brands").select("*", { count: "exact", head: true }),
    supabase
      .from("brands")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("discounts").select("*", { count: "exact", head: true }),
    supabase
      .from("discounts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("user_benefits").select("*", { count: "exact", head: true }),
    supabase
      .from("user_benefits")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("brand_requests").select("*", { count: "exact", head: true }),
    applyPeriodFilter(
      supabase.from("search_logs").select("*", { count: "exact", head: true }),
      period,
      "created_at",
    ),
    applyPeriodFilter(
      supabase
        .from("result_click_logs")
        .select("*", { count: "exact", head: true })
        .eq("action_type", "view_detail"),
      period,
      "created_at",
    ),
    applyPeriodFilter(
      supabase
        .from("result_click_logs")
        .select("*", { count: "exact", head: true })
        .eq("action_type", "use_discount"),
      period,
      "created_at",
    ),
    supabase
      .from("brand_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "reviewing"]),
    applyPeriodFilter(
      supabase.from("brand_requests").select("*", { count: "exact", head: true }),
      period,
      "last_requested_at",
    ),
    applyPeriodFilter(
      supabase
        .from("user_benefits")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      period,
      "created_at",
    ),
  ]);

  recordDbIssue(warnings, "profiles count", resProfilesTotal.error);
  recordDbIssue(warnings, "search_logs today count", resSearchToday.error);
  recordDbIssue(warnings, "search_logs today distinct rows", resSearchTodayRows.error);
  recordDbIssue(warnings, "brands total count", resBrandsTotal.error);
  recordDbIssue(warnings, "brands active count", resBrandsActive.error);
  recordDbIssue(warnings, "discounts total count", resDiscountsTotal.error);
  recordDbIssue(warnings, "discounts active count", resDiscountsActive.error);
  recordDbIssue(warnings, "user_benefits total count", resUserBenefitsTotal.error);
  recordDbIssue(warnings, "user_benefits active count", resUserBenefitsActive.error);
  recordDbIssue(warnings, "brand_requests total count", resBrandRequestsTotal.error);
  recordDbIssue(
    warnings,
    `search_logs period count (${period.label})`,
    resSearchPeriod.error,
  );
  recordDbIssue(
    warnings,
    `result_click_logs view_detail period count (${period.label})`,
    resClickDetail.error,
  );
  recordDbIssue(
    warnings,
    `result_click_logs use_discount period count (${period.label})`,
    resClickUse.error,
  );
  recordDbIssue(warnings, "brand_requests attention count", resRequestsAttention.error);
  recordDbIssue(
    warnings,
    `brand_requests period activity (${period.label})`,
    resRequestsPeriodActivity.error,
  );
  recordDbIssue(
    warnings,
    `user_benefits new in period (${period.label})`,
    resUserBenefitsNewInPeriod.error,
  );

  let searchLogsQuery = supabase
    .from("search_logs")
    .select(
      "keyword,normalized_keyword,matched_brand_id,gender_group,age_group,result_status,result_count,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(LOG_AGGREGATION_LIMIT);

  searchLogsQuery = applyPeriodFilter(searchLogsQuery, period, "created_at");

  let clickLogsQuery = supabase
    .from("result_click_logs")
    .select("brand_id,discount_id,action_type,created_at")
    .order("created_at", { ascending: false })
    .limit(LOG_AGGREGATION_LIMIT);

  clickLogsQuery = applyPeriodFilter(clickLogsQuery, period, "created_at");

  const [
    resRequestCounts,
    resSearchLogAgg,
    resBrandsRows,
    resUserBenefitsRows,
    resBenefitProducts,
    resProviders,
    resDiscountRows,
    resBrandCategories,
    resBenefitCategories,
    resRecentRequests,
    resClickLogsPeriod,
    resBrandRequestsAll,
  ] = await Promise.all([
    supabase.from("brand_requests").select("request_count").range(0, 50_000),
    searchLogsQuery,
    supabase.from("brands").select("id,name,category_id").range(0, 9999),
    supabase
      .from("user_benefits")
      .select("benefit_category_id,benefit_product_id")
      .eq("is_active", true),
    supabase.from("benefit_products").select("id,name,provider_id,product_type").range(0, 9999),
    supabase.from("providers").select("id,name").range(0, 9999),
    supabase.from("discounts").select("brand_id,status").range(0, 9999),
    supabase.from("brand_categories").select("id,name,code").order("sort_order", {
      ascending: true,
    }),
    supabase.from("benefit_categories").select("id,name,code").order("sort_order", {
      ascending: true,
    }),
    supabase
      .from("brand_requests")
      .select("keyword,request_count,status,last_requested_at")
      .order("last_requested_at", { ascending: false })
      .limit(10),
    clickLogsQuery,
    supabase
      .from("brand_requests")
      .select("keyword,request_count")
      .order("request_count", { ascending: false })
      .limit(10),
  ]);

  recordDbIssue(warnings, "brand_requests request_count sum", resRequestCounts.error);
  recordDbIssue(
    warnings,
    `search_logs aggregation rows (${period.label})`,
    resSearchLogAgg.error,
  );
  recordDbIssue(warnings, "brands rows", resBrandsRows.error);
  recordDbIssue(warnings, "user_benefits rows", resUserBenefitsRows.error);
  recordDbIssue(warnings, "benefit_products rows", resBenefitProducts.error);
  recordDbIssue(warnings, "providers rows", resProviders.error);
  recordDbIssue(warnings, "discounts rows", resDiscountRows.error);
  recordDbIssue(warnings, "brand_categories rows", resBrandCategories.error);
  recordDbIssue(warnings, "benefit_categories rows", resBenefitCategories.error);
  recordDbIssue(warnings, "brand_requests recent rows", resRecentRequests.error);
  recordDbIssue(
    warnings,
    `result_click_logs aggregation rows (${period.label})`,
    resClickLogsPeriod.error,
  );
  recordDbIssue(warnings, "brand_requests ranking rows", resBrandRequestsAll.error);

  const searchLogs = getRows(resSearchLogAgg.data as SearchLogStatsRow[] | null);
  const clickLogs = getRows(resClickLogsPeriod.data as ResultClickStatsRow[] | null);
  const logSampleCapped =
    searchLogs.length >= LOG_AGGREGATION_LIMIT || clickLogs.length >= LOG_AGGREGATION_LIMIT;

  const brands = getRows(
    resBrandsRows.data as Array<{ id: number; name: string; category_id: number | null }> | null,
  );
  const brandById = new Map(brands.map((brand) => [brand.id, brand]));
  const brandCategories = getRows(
    resBrandCategories.data as Array<{ id: number; name: string; code: string }> | null,
  );
  const brandCategoryById = new Map(brandCategories.map((category) => [category.id, category]));
  const benefitCategories = getRows(
    resBenefitCategories.data as Array<{ id: number; name: string; code: string }> | null,
  );
  const benefitCategoryById = new Map(
    benefitCategories.map((category) => [category.id, category]),
  );
  const benefitProducts = getRows(
    resBenefitProducts.data as Array<{
      id: number;
      name: string;
      provider_id: number;
      product_type: string;
    }> | null,
  );
  const productById = new Map(benefitProducts.map((product) => [product.id, product]));
  const providerById = new Map(
    getRows(resProviders.data as Array<{ id: number; name: string }> | null).map(
      (provider) => [provider.id, provider],
    ),
  );

  const brandSearchCount = new Map<number, number>();
  const keywordSearchCount = new Map<string, { keyword: string; count: number }>();
  const brandCategorySearchCount = new Map<number, number>();
  const genderSearchCount = new Map<string, number>();
  const ageSearchCount = new Map<string, number>();

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
      const brand = brandById.get(log.matched_brand_id);
      if (brand?.category_id) {
        increment(brandCategorySearchCount, brand.category_id);
      }
    }

    if (log.gender_group) {
      increment(genderSearchCount, log.gender_group);
    }

    if (log.age_group) {
      increment(ageSearchCount, log.age_group);
    }
  }

  const popularKeywords = [...keywordSearchCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((row) => ({ keyword: row.keyword, count: row.count }));

  const popularSearchBrands = [...brandSearchCount.entries()]
    .map(([brandId, count]) => ({
      brandId,
      brandName: brandById.get(brandId)?.name ?? `#${brandId}`,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const brandDetailClickCount = new Map<number, number>();
  const brandUseClickCount = new Map<number, number>();
  const brandClickCount = new Map<number, number>();

  for (const row of clickLogs) {
    increment(brandClickCount, row.brand_id);
    if (row.action_type === "view_detail") {
      increment(brandDetailClickCount, row.brand_id);
    }
    if (row.action_type === "use_discount") {
      increment(brandUseClickCount, row.brand_id);
    }
  }

  const popularClickBrands = [...brandClickCount.entries()]
    .map(([brandId, count]) => ({
      brandId,
      brandName: brandById.get(brandId)?.name ?? `#${brandId}`,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const cardProductCount = new Map<number, number>();
  const benefitCategoryRegistrationCount = new Map<number, number>();

  for (const row of getRows(
    resUserBenefitsRows.data as Array<{
      benefit_category_id: number;
      benefit_product_id: number | null;
    }> | null,
  )) {
    increment(benefitCategoryRegistrationCount, row.benefit_category_id);

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

  const topRegisteredCards = [...cardProductCount.entries()]
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

  const benefitCategoryRegistrations = benefitCategories.map((category) => ({
    categoryName: category.name,
    categoryCode: category.code,
    count: benefitCategoryRegistrationCount.get(category.id) ?? 0,
  }));

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

  const activeDiscounts = getRows(
    resDiscountRows.data as Array<{ brand_id: number; status: string }> | null,
  ).filter(isActiveDiscountRecord);

  const activeDiscountCountByBrand = new Map<number, number>();
  const activeDiscountCountByCategory = new Map<number, number>();
  const brandCountByCategory = new Map<number, number>();

  for (const brand of brands) {
    if (brand.category_id) {
      increment(brandCountByCategory, brand.category_id);
    }
  }

  for (const discount of activeDiscounts) {
    increment(activeDiscountCountByBrand, discount.brand_id);
    const brand = brandById.get(discount.brand_id);
    if (brand?.category_id) {
      increment(activeDiscountCountByCategory, brand.category_id);
    }
  }

  const brandDiscountCounts = [...activeDiscountCountByBrand.entries()]
    .map(([brandId, count]) => ({
      brandId,
      brandName: brandById.get(brandId)?.name ?? `#${brandId}`,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const categoryDiscountRows = brandCategories.map((category) => ({
    categoryName: category.name,
    categoryCode: category.code,
    brandCount: brandCountByCategory.get(category.id) ?? 0,
    discountCount: activeDiscountCountByCategory.get(category.id) ?? 0,
  }));

  const brandRankingMap = new Map<string, BrandRankingRow>();

  for (const [brandId, searches] of brandSearchCount.entries()) {
    const brandName = brandById.get(brandId)?.name ?? `#${brandId}`;
    brandRankingMap.set(brandName, {
      brandName,
      searches,
      detailViews: brandDetailClickCount.get(brandId) ?? 0,
      clicks: brandUseClickCount.get(brandId) ?? 0,
    });
  }

  for (const [brandId, detailViews] of brandDetailClickCount.entries()) {
    const brandName = brandById.get(brandId)?.name ?? `#${brandId}`;
    const existing = brandRankingMap.get(brandName) ?? {
      brandName,
      searches: brandSearchCount.get(brandId) ?? 0,
      detailViews: 0,
      clicks: brandUseClickCount.get(brandId) ?? 0,
    };
    existing.detailViews = detailViews;
    brandRankingMap.set(brandName, existing);
  }

  for (const [brandId, clicks] of brandUseClickCount.entries()) {
    const brandName = brandById.get(brandId)?.name ?? `#${brandId}`;
    const existing = brandRankingMap.get(brandName) ?? {
      brandName,
      searches: brandSearchCount.get(brandId) ?? 0,
      detailViews: brandDetailClickCount.get(brandId) ?? 0,
      clicks: 0,
    };
    existing.clicks = clicks;
    brandRankingMap.set(brandName, existing);
  }

  const brandRankingRows = [...brandRankingMap.values()]
    .sort((a, b) => b.searches - a.searches || b.detailViews - a.detailViews)
    .slice(0, 50);

  const updateRequestSum = getRows(
    resRequestCounts.data as Array<{ request_count: number }> | null,
  ).reduce((sum, row) => sum + row.request_count, 0);

  const todaySearchRows = getRows(
    resSearchTodayRows.data as Array<{
      user_id: string | null;
      normalized_keyword: string;
    }> | null,
  );
  const todayDistinctLoginUsers = new Set(
    todaySearchRows.filter((row) => row.user_id).map((row) => row.user_id),
  ).size;
  const todayDistinctKeywords = new Set(
    todaySearchRows.map((row) => row.normalized_keyword),
  ).size;

  return {
    period,
    searchLogsTodayWindow,
    warnings,
    logSampleCapped,
    totals: {
      totalBrands: resBrandsTotal.count ?? 0,
      activeBrands: resBrandsActive.count ?? 0,
      totalDiscounts: resDiscountsTotal.count ?? 0,
      activeDiscounts: resDiscountsActive.count ?? 0,
      totalProfiles: resProfilesTotal.count ?? 0,
      totalUserBenefits: resUserBenefitsTotal.count ?? 0,
      activeUserBenefits: resUserBenefitsActive.count ?? 0,
      totalBrandRequests: resBrandRequestsTotal.count ?? 0,
      brandRequestsNeedingWork: resRequestsAttention.count ?? 0,
      todaySearches: resSearchToday.count ?? 0,
      todayDistinctLoginUsers,
      todayDistinctKeywords,
      periodSearches: resSearchPeriod.count ?? 0,
      periodDetailClicks: resClickDetail.count ?? 0,
      periodUseClicks: resClickUse.count ?? 0,
      updateRequestSum,
      requestsTouchedInPeriod: resRequestsPeriodActivity.count ?? 0,
      newBenefitsInPeriod: resUserBenefitsNewInPeriod.count ?? 0,
    },
    popularKeywords,
    popularSearchBrands,
    popularClickBrands,
    topRegisteredCards,
    noResultKeywords,
    brandDiscountCounts,
    benefitCategoryRegistrations,
    categoryDiscountRows,
    recentSearchLogs: searchLogs.slice(0, 12),
    recentClickLogs: clickLogs.slice(0, 12),
    recentBrandRequests: getRows(resRecentRequests.data as BrandRequestStatsRow[] | null),
    dailySearchTrend: buildDailySearchTrend(period, searchLogs),
    brandSearchChart: popularSearchBrands.slice(0, 5).map((row) => ({
      label: row.brandName ?? "-",
      count: row.count,
    })),
    brandRequestChart: getRows(
      resBrandRequestsAll.data as Array<{ keyword: string; request_count: number }> | null,
    ).map((row) => ({
      label: row.keyword,
      count: row.request_count,
    })),
    categorySearchChart: [...brandCategorySearchCount.entries()]
      .map(([categoryId, count]) => ({
        label: brandCategoryById.get(categoryId)?.name ?? `#${categoryId}`,
        count,
      }))
      .sort((a, b) => b.count - a.count),
    ageGroupChart: [...ageSearchCount.entries()]
      .map(([value, count]) => ({ label: formatAgeLabel(value), count }))
      .sort((a, b) => b.count - a.count),
    genderChart: [...genderSearchCount.entries()]
      .map(([value, count]) => ({ label: formatGenderLabel(value), count }))
      .sort((a, b) => b.count - a.count),
    brandRankingRows,
    brandNameById: new Map(brands.map((brand) => [brand.id, brand.name])),
  };
}

export function formatAdminStatsNumber(value: number) {
  return value.toLocaleString("ko-KR");
}

export function formatAdminStatsDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export const ADMIN_STATS_PERIOD_OPTIONS = [
  ["today", "오늘"],
  ["7d", "7일"],
  ["30d", "30일"],
  ["all", "전체"],
] as const;

export function toChartSeries(rows: LabeledCountRow[]) {
  return {
    labels: rows.map((row) => row.label),
    values: rows.map((row) => row.count),
  };
}

export function toDailyChartSeries(rows: DailyCountRow[]) {
  return {
    labels: rows.map((row) => row.date.slice(5)),
    values: rows.map((row) => row.count),
  };
}
