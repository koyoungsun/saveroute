import type { ReactNode } from "react";

import { KpiCard } from "@/components/admin/KpiCard";
import { StatsExportForm } from "@/components/admin/StatsExportForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  ADMIN_STATS_PERIOD_OPTIONS,
  formatAdminStatsDateTime,
  formatAdminStatsNumber,
  loadAdminStatsSnapshot,
} from "@/lib/admin/admin-stats";
import {
  formatAuditTargetLabel,
  readAuditSummary,
} from "@/lib/admin/audit-log-display";
import { loadAdminAuditLogs } from "@/lib/admin/load-admin-audit-logs";
import { formatRank, getRankedItems } from "@/lib/admin/rank-items";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DashboardSearchParams = {
  period?: string | string[];
};

type DashboardPageProps = {
  searchParams: Promise<DashboardSearchParams>;
};

function getSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = createSupabaseAdminClient();
  const [stats, recentAuditLogs] = await Promise.all([
    loadAdminStatsSnapshot(supabase, getSearchParam(params.period), "today"),
    loadAdminAuditLogs(supabase, { limit: 10 }),
  ]);

  const maxCategoryDiscount = Math.max(
    ...stats.categoryDiscountRows.map((row) => row.discountCount),
    1,
  );

  const catalogKpis = [
    ["총 가입자 수", stats.totals.totalProfiles, "primary", "bi-people"],
    ["총 브랜드 수", stats.totals.totalBrands, "secondary", "bi-shop"],
    ["활성 브랜드 수", stats.totals.activeBrands, "success", "bi-check-circle"],
    ["총 할인 수", stats.totals.totalDiscounts, "info", "bi-tags"],
    ["활성 할인 수", stats.totals.activeDiscounts, "primary", "bi-tag"],
    ["등록 보유혜택 수", stats.totals.totalUserBenefits, "danger", "bi-wallet2"],
    ["업데이트 요청 수", stats.totals.totalBrandRequests, "warning", "bi-megaphone"],
  ] as const;

  const searchTodayKpis = [
    {
      title: "오늘 검색 횟수",
      value: stats.totals.todaySearches,
      variant: "success" as const,
      icon: "bi-search",
      hint: `search_logs COUNT · KST ${stats.searchLogsTodayWindow?.localDateLabel ?? "오늘"} 00:00~ · explicit search only`,
    },
    {
      title: "오늘 검색 로그인 사용자 수",
      value: stats.totals.todayDistinctLoginUsers,
      variant: "success" as const,
      icon: "bi-person-check",
      hint: "user_id DISTINCT (비로그인 검색 미포함)",
    },
    {
      title: "오늘 검색 키워드 수",
      value: stats.totals.todayDistinctKeywords,
      variant: "success" as const,
      icon: "bi-hash",
      hint: "normalized_keyword DISTINCT",
    },
  ] as const;

  const opsKpis = [
    [
      `선택 기간 검색 횟수 (${stats.period.label})`,
      stats.totals.periodSearches,
      "success",
      "bi-graph-up",
      "search_logs COUNT · explicit search · created_at 기간 필터",
    ],
    ["활성 보유혜택 수", stats.totals.activeUserBenefits, "danger", "bi-wallet2"],
    [
      `${stats.period.label} · 결과 상세 클릭`,
      stats.totals.periodDetailClicks,
      "info",
      "bi-eye",
    ],
    [
      `${stats.period.label} · 할인 활용 클릭`,
      stats.totals.periodUseClicks,
      "warning",
      "bi-mouse2-fill",
    ],
    [
      "처리 필요 업데이트 요청(대기중·검토중)",
      stats.totals.brandRequestsNeedingWork,
      "warning",
      "bi-inboxes",
    ],
    [
      `${stats.period.label} · 요청 최근 활동 건수`,
      stats.totals.requestsTouchedInPeriod,
      "secondary",
      "bi-megaphone",
    ],
    [
      `${stats.period.label} · 신규 보유혜택 등록`,
      stats.totals.newBenefitsInPeriod,
      "primary",
      "bi-plus-circle",
    ],
    ["누적 요청 카운터 합Σ(request_count)", stats.totals.updateRequestSum, "info", "bi-list-ol"],
  ] as const;

  const brandById = stats.brandNameById;

  return (
    <>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Dashboard</h1>
          <p className="text-muted mb-0">
            search_logs, result_click_logs, brand_requests, user_benefits 및 카탈로그 테이블을 기준으로
            실제 집계를 표시합니다. 검색 횟수는 검색창에서 검색 버튼(또는 Enter)으로
            실행한 explicit search action 만 집계하며, F5·URL 재방문은 포함하지 않습니다.
          </p>
        </div>
        <span className="badge text-bg-light text-dark border">
          기준: {formatAdminStatsDateTime(new Date().toISOString())}
        </span>
      </div>

      {stats.warnings.length > 0 ? (
        <div className="alert alert-warning shadow-sm border-0 mb-4" role="alert">
          <div className="fw-bold">
            데이터베이스 조회 오류 {stats.warnings.length}건 — 참고용 수치만 표시됩니다
          </div>
          <div className="small text-muted mt-1 mb-3">
            아래 블록에 테이블/컬럼명을 포함하여 어떤 쿼리가 실패했는지 확인할 수 있습니다.
          </div>
          <div className="d-flex flex-column gap-2">
            {stats.warnings.map((detail, idx) => (
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

      <div className="mb-3 fw-semibold text-muted small">
        오늘 검색 (search_logs · KST {stats.searchLogsTodayWindow.localDateLabel} 00:00~)
      </div>
      <div className="row g-4 mb-2">
        {searchTodayKpis.map((kpi) => (
          <div key={kpi.title} className="col-6 col-xl-4">
            <KpiCard
              title={kpi.title}
              value={formatAdminStatsNumber(kpi.value)}
              variant={kpi.variant}
              icon={kpi.icon}
              changeText={kpi.hint}
            />
          </div>
        ))}
      </div>

      <div className="mb-3 fw-semibold text-muted small mt-4">카탈로그 · 회원 규모</div>
      <div className="row g-4 mb-2">
        {catalogKpis.map(([title, value, variant, icon]) => (
          <div key={title} className="col-6 col-xl-3">
            <KpiCard
              title={title}
              value={formatAdminStatsNumber(value)}
              variant={variant}
              icon={icon}
            />
          </div>
        ))}
      </div>

      <div className="mb-3 fw-semibold text-muted small mt-4">
        선택 기간 운영 (검색·클릭·요청·보유혜택)
      </div>
      <div className="row g-4 mb-4">
        {opsKpis.map(([title, value, variant, icon, hint]) => (
          <div key={title} className="col-6 col-md-4 col-xl-3">
            <KpiCard
              title={title}
              value={formatAdminStatsNumber(value)}
              variant={variant}
              icon={icon}
              changeText={hint}
            />
          </div>
        ))}
      </div>

      <StatsExportForm />

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="fw-bold">Dashboard 기간 필터</div>
            <div className="small text-muted">현재 분석 구간: {stats.period.label}</div>
            {stats.logSampleCapped ? (
              <div className="small text-warning mt-1">
                로그 집계는 최대 15,000건 샘플 기준입니다.
              </div>
            ) : null}
          </div>
          <div className="btn-group" role="group" aria-label="Dashboard 기간 필터">
            {ADMIN_STATS_PERIOD_OPTIONS.map(([periodKey, label]) => (
              <a
                key={periodKey}
                href={`/admin/dashboard?period=${periodKey}`}
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

      <div className="row g-4">
        <DashboardTable
          title="인기 검색어 TOP 10"
          description={`search_logs.keyword (${stats.period.label})`}
          columns={["순위", "검색어", "검색 수"]}
          emptyText="아직 수집된 검색 기록이 없습니다."
          rows={getRankedItems(stats.popularKeywords, "count").map((row) => [
            <RankBadge key={`${row.keyword}-rank`} rank={row.rank} />,
            <span key={row.keyword} className="fw-semibold">
              {row.keyword}
            </span>,
            <span key={`${row.keyword}-count`} className="d-block text-end">
              {formatAdminStatsNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="인기 검색 브랜드 TOP 10"
          description={`search_logs.matched_brand_id (${stats.period.label})`}
          columns={["순위", "브랜드", "검색 수"]}
          emptyText="브랜드에 매칭된 검색 기록이 없습니다."
          rows={getRankedItems(stats.popularSearchBrands, "count").map((row) => [
            <RankBadge key={`${row.brandName}-rank`} rank={row.rank} />,
            <span key={row.brandName} className="fw-semibold">
              {row.brandName}
            </span>,
            <span key={`${row.brandName}-count`} className="d-block text-end">
              {formatAdminStatsNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="결과 클릭 많은 브랜드 TOP 10"
          description={`result_click_logs.brand_id (${stats.period.label})`}
          columns={["순위", "브랜드", "클릭 수"]}
          emptyText="등록된 클릭 로그가 없습니다."
          rows={getRankedItems(stats.popularClickBrands, "count").map((row) => [
            <RankBadge key={`${row.brandName}-rank`} rank={row.rank} />,
            <span key={row.brandName} className="fw-semibold">
              {row.brandName}
            </span>,
            <span key={`${row.brandName}-c`} className="d-block text-end">
              {formatAdminStatsNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="브랜드별 활성 할인 수 TOP 10"
          description="discounts.status=active group by brand_id"
          columns={["순위", "브랜드", "할인 수"]}
          emptyText="활성 할인 데이터가 없습니다."
          rows={getRankedItems(stats.brandDiscountCounts, "count").map((row) => [
            <RankBadge key={`${row.brandName}-rank`} rank={row.rank} />,
            <span key={row.brandName} className="fw-semibold">
              {row.brandName}
            </span>,
            <span key={`${row.brandName}-count`} className="d-block text-end">
              {formatAdminStatsNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="많이 등록된 카드 TOP 10"
          description="user_benefits (활성) + 신용·체크·선불 카드형 benefit_products"
          columns={["순위", "카드", "카드사", "등록 수"]}
          emptyText="등록된 카드 보유혜택이 없습니다."
          rows={getRankedItems(stats.topRegisteredCards, "count").map((row) => [
            <RankBadge key={`${row.productName}-rank`} rank={row.rank} />,
            <span key={row.productName} className="fw-semibold">
              {row.productName}
            </span>,
            row.providerName ?? "-",
            <span key={`${row.productName}-count`} className="d-block text-end">
              {formatAdminStatsNumber(row.count)}
            </span>,
          ])}
        />

        <DashboardTable
          title="혜택 카테고리별 등록 수"
          description="user_benefits (활성) group by benefit_category_id"
          columns={["카테고리", "code", "등록 수"]}
          emptyText="등록된 보유혜택이 없습니다."
          rows={stats.benefitCategoryRegistrations.map((row) => [
            <span key={row.categoryCode} className="fw-semibold">
              {row.categoryName}
            </span>,
            row.categoryCode,
            formatAdminStatsNumber(row.count),
          ])}
        />

        <DashboardTable
          title="무결과 비율이 높은 검색어 TOP 10"
          description={`search_logs 미매칭 또는 result_count=0 (${stats.period.label})`}
          columns={["키워드", "검색 수", "0건 수", "0건 비율"]}
          emptyText="무결과로 분류된 검색 로그가 없습니다."
          rows={stats.noResultKeywords.map((row) => [
            <span key={`${row.keyword}-keyword`} className="fw-semibold">
              {row.keyword}
            </span>,
            formatAdminStatsNumber(row.totalCount),
            formatAdminStatsNumber(row.zeroCount),
            `${Math.round(row.zeroRate * 100)}%`,
          ])}
        />

        <DashboardTable
          title="최근 업데이트 요청 (brand_requests)"
          description="최근 활동 순 10건"
          columns={["키워드", "누적 요청", "상태", "최근 요청 시각"]}
          emptyText="아직 업데이트 요청이 없습니다."
          rows={stats.recentBrandRequests.map((row) => [
            <span key={`${row.keyword}-keyword`} className="fw-semibold">
              {row.keyword}
            </span>,
            formatAdminStatsNumber(row.request_count),
            <StatusBadge key={`${row.keyword}-status`} status={row.status} />,
            formatAdminStatsDateTime(row.last_requested_at),
          ])}
        />

        <DashboardTable
          title="최근 감사로그 (admin_audit_logs)"
          description="최근 10건"
          columns={["작업일시", "관리자", "action", "target", "summary"]}
          emptyText="아직 감사로그가 없습니다."
          rows={recentAuditLogs.map((row) => [
            formatAdminStatsDateTime(row.created_at),
            row.adminEmail ?? row.admin_user_id,
            row.action,
            formatAuditTargetLabel(row.target_table),
            readAuditSummary(row),
          ])}
        />

        <DashboardTable
          title="최근 검색 로그 (search_logs)"
          description={`선택 기간에서 최근 12건 (${stats.period.label})`}
          columns={["검색어", "상태", "결과 수", "시각"]}
          emptyText="아직 수집된 검색 기록이 없습니다."
          rows={stats.recentSearchLogs.map((row) => [
            <span key={`${row.created_at}-kw`} className="fw-semibold">
              {row.keyword}
            </span>,
            <StatusBadge key={`${row.created_at}-rs`} status={row.result_status} />,
            row.result_count ?? "—",
            formatAdminStatsDateTime(row.created_at),
          ])}
        />

        <DashboardTable
          title="최근 결과 클릭 로그 (result_click_logs)"
          description={`선택 기간에서 최근 12건 (${stats.period.label})`}
          columns={["브랜드", "할인 id", "유형", "시각"]}
          emptyText="등록된 클릭 로그가 없습니다."
          rows={stats.recentClickLogs.map((row, index) => {
            const brandName = brandById.get(row.brand_id) ?? `#${row.brand_id}`;

            return [
              <span key={`${row.created_at}-b-${index}`} className="fw-semibold">
                {brandName}
              </span>,
              String(row.discount_id),
              <StatusBadge key={`${row.created_at}-a-${index}`} status={row.action_type} />,
              formatAdminStatsDateTime(row.created_at),
            ];
          })}
        />

        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white py-3">
              <div className="fw-bold">카테고리별 브랜드 / 활성 할인 수</div>
              <div className="small text-muted mt-1">
                브랜드는 brands.category_id 기준·할인은 활성 상태 분포입니다.
              </div>
            </div>
            <div className="card-body">
              {stats.categoryDiscountRows.length > 0 ? (
                <div className="row g-3">
                  {stats.categoryDiscountRows.map((row) => {
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
                              <div className="fs-4 fw-bold">
                                {formatAdminStatsNumber(row.discountCount)}
                              </div>
                              <div className="small text-muted">
                                브랜드 {formatAdminStatsNumber(row.brandCount)}개
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
              ) : (
                <div className="py-4 text-center text-muted">데이터 없음</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className="badge text-bg-light text-dark border fw-semibold"
      style={{ minWidth: "52px" }}
    >
      {formatRank(rank)}
    </span>
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
