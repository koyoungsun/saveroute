import {
  AgeGroupBarChart,
  BrandRequestTopBarChart,
  BrandTopBarChart,
  CategoryPieChart,
  DailySearchLineChart,
} from "@/components/admin/AdminCharts";
import { ChartCard } from "@/components/admin/ChartCard";
import { KpiCard } from "@/components/admin/KpiCard";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import {
  ADMIN_STATS_PERIOD_OPTIONS,
  formatAdminStatsNumber,
  loadAdminStatsSnapshot,
  toChartSeries,
  toDailyChartSeries,
} from "@/lib/admin/admin-stats";
import { formatRank, getRankedItems } from "@/lib/admin/rank-items";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type StatsPageProps = {
  searchParams: Promise<{
    period?: string;
  }>;
};

function getSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function StatsPage({ searchParams }: StatsPageProps) {
  const params = await searchParams;
  const supabase = createSupabaseAdminClient();
  const stats = await loadAdminStatsSnapshot(supabase, getSearchParam(params.period), "30d");

  const rankedRows = getRankedItems(stats.brandRankingRows, "searches");
  const dailySearchSeries = toDailyChartSeries(stats.dailySearchTrend);
  const brandSearchSeries = toChartSeries(stats.brandSearchChart);
  const brandRequestSeries = toChartSeries(stats.brandRequestChart);
  const categorySearchSeries = toChartSeries(stats.categorySearchChart);
  const ageGroupSeries = toChartSeries(stats.ageGroupChart);

  const summaryKpis = [
    ["총 브랜드", stats.totals.totalBrands, "secondary", "bi-shop"],
    ["활성 브랜드", stats.totals.activeBrands, "success", "bi-check-circle"],
    ["총 할인", stats.totals.totalDiscounts, "info", "bi-tags"],
    ["활성 할인", stats.totals.activeDiscounts, "primary", "bi-tag"],
    ["총 가입자", stats.totals.totalProfiles, "secondary", "bi-people"],
    ["등록 보유혜택", stats.totals.totalUserBenefits, "danger", "bi-wallet2"],
    ["업데이트 요청", stats.totals.totalBrandRequests, "warning", "bi-megaphone"],
    [`${stats.period.label} 검색 횟수`, stats.totals.periodSearches, "success", "bi-search"],
  ] as const;

  return (
    <>
      {stats.warnings.length > 0 ? (
        <div className="alert alert-warning shadow-sm border-0 mb-4" role="alert">
          <div className="fw-bold">데이터베이스 조회 오류 {stats.warnings.length}건</div>
          <div className="small text-muted mt-1 mb-2">
            일부 통계가 비어 있거나 부정확할 수 있습니다.
          </div>
          {stats.warnings.map((detail, idx) => (
            <pre
              key={idx}
              className="mb-2 small p-3 bg-white border rounded shadow-sm text-break"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {detail}
            </pre>
          ))}
        </div>
      ) : null}

      <div className="sr-block card mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="admin-section-title">기간 필터</div>
            <div className="small text-muted">현재 분석 구간: {stats.period.label}</div>
            {stats.logSampleCapped ? (
              <div className="small text-warning mt-1">
                로그 집계는 최대 15,000건 샘플 기준입니다.
              </div>
            ) : null}
          </div>
          <div className="btn-group" role="group" aria-label="Statistics 기간 필터">
            {ADMIN_STATS_PERIOD_OPTIONS.map(([periodKey, label]) => (
              <a
                key={periodKey}
                href={`/admin/stats?period=${periodKey}`}
                className={`btn btn-sm ${
                  stats.period.key === periodKey ? "btn-success" : "btn-outline-secondary"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {summaryKpis.map(([title, value, variant, icon]) => (
          <div key={title} className="col-6 col-md-4 col-xl-3">
            <KpiCard
              title={title}
              value={formatAdminStatsNumber(value)}
              variant={variant}
              icon={icon}
            />
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-12">
          <ChartCard title="전체 검색 추이" description={`search_logs 행 수 (${stats.period.label})`}>
            <DailySearchLineChart data={dailySearchSeries} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="브랜드별 검색 순위"
            description={`matched_brand_id TOP 5 (${stats.period.label})`}
          >
            <BrandTopBarChart data={brandSearchSeries} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="연령대 검색 분포"
            description={`search_logs.age_group (${stats.period.label})`}
          >
            <AgeGroupBarChart data={ageGroupSeries} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="카테고리별 검색 비율"
            description={`브랜드 카테고리 기준 (${stats.period.label})`}
          >
            <CategoryPieChart data={categorySearchSeries} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="업데이트 요청 TOP"
            titleClassName="admin-card-title"
            description="brand_requests.request_count 기준"
          >
            <BrandRequestTopBarChart data={brandRequestSeries} />
          </ChartCard>
        </div>
      </div>

      {rankedRows.length > 0 ? (
        <PaginatedTable
          title={`기간 내 브랜드별 검색 순위 (${stats.period.label})`}
          pageSize={10}
          fixedRows={10}
          className="sr-block mt-4"
          columns={[
            { header: "순위" },
            { header: "브랜드명" },
            { header: "검색 수" },
            { header: "상세 조회" },
            { header: "할인 클릭" },
          ]}
          rowKeys={rankedRows.map((row) => row.brandName)}
          rows={rankedRows.map((row) => [
            <span
              key={`${row.brandName}-rank`}
              className="badge text-bg-light text-dark border fw-semibold"
              style={{ minWidth: "52px" }}
            >
              {formatRank(row.rank)}
            </span>,
            row.brandName,
            formatAdminStatsNumber(row.searches),
            formatAdminStatsNumber(row.detailViews),
            formatAdminStatsNumber(row.clicks),
          ])}
        />
      ) : (
        <div className="sr-block card mt-4">
          <div className="card-header sr-card-header fw-semibold admin-card-title">
            기간 내 브랜드별 검색 순위 ({stats.period.label})
          </div>
          <div className="card-body py-4 text-center text-muted">
            데이터 없음 — 아직 수집된 검색·클릭 기록이 없습니다.
          </div>
        </div>
      )}

      <PaginatedTable
        title="혜택 카테고리별 등록 수 (활성 user_benefits)"
        pageSize={10}
        fixedRows={5}
        className="sr-block mt-4"
        columns={[
          { header: "카테고리" },
          { header: "code" },
          { header: "등록 수" },
        ]}
        rowKeys={stats.benefitCategoryRegistrations.map((row) => row.categoryCode)}
        rows={
          stats.benefitCategoryRegistrations.length > 0
            ? stats.benefitCategoryRegistrations.map((row) => [
                row.categoryName,
                row.categoryCode,
                formatAdminStatsNumber(row.count),
              ])
            : [
                [
                  <span key="empty-benefits" className="text-muted">
                    등록된 보유혜택이 없습니다.
                  </span>,
                  "-",
                  "0",
                ],
              ]
        }
      />
    </>
  );
}
