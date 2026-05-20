import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  formatBrandRequestProcessedAt,
  loadBrandUpdateRequests,
} from "@/lib/admin/load-brand-update-requests";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BRAND_REQUEST_STATUS_OPTIONS } from "@/lib/ui/format-status-label";

type UpdateCheckPageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    start?: string;
    end?: string;
  }>;
};

function getSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function UpdateCheckPage({ searchParams }: UpdateCheckPageProps) {
  const params = await searchParams;
  const status = getSearchParam(params.status) ?? "";
  const q = getSearchParam(params.q) ?? "";
  const start = getSearchParam(params.start) ?? "";
  const end = getSearchParam(params.end) ?? "";

  const supabase = createSupabaseAdminClient();
  const rows = await loadBrandUpdateRequests(supabase, {
    status,
    q,
    startDate: start,
    endDate: end,
    limit: 50,
  });

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Update Check</h1>
          <p className="text-muted small mb-0">
            사용자 업데이트 요청(brand_requests)을 최신순으로 확인합니다. 상태 변경은{" "}
            <Link href="/admin/brand-requests">브랜드 요청</Link>에서 처리할 수 있습니다.
          </p>
        </div>
        <Link href="/admin/brand-requests" className="btn btn-outline-primary shrink-0">
          브랜드 요청 관리
        </Link>
      </div>

      <div className="sr-block card mb-4">
        <div className="card-body">
          <form method="get" className="row g-3 align-items-end">
            <div className="col-md-3">
              <label htmlFor="update-q" className="form-label small text-muted mb-1">
                브랜드/키워드
              </label>
              <input
                id="update-q"
                name="q"
                type="search"
                className="form-control"
                placeholder="검색 키워드"
                defaultValue={q}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="update-status" className="form-label small text-muted mb-1">
                상태
              </label>
              <select
                id="update-status"
                name="status"
                className="form-select"
                defaultValue={status}
              >
                <option value="">상태 전체</option>
                {BRAND_REQUEST_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="update-start" className="form-label small text-muted mb-1">
                시작일
              </label>
              <input
                id="update-start"
                name="start"
                type="date"
                className="form-control"
                defaultValue={start}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="update-end" className="form-label small text-muted mb-1">
                종료일
              </label>
              <input
                id="update-end"
                name="end"
                type="date"
                className="form-control"
                defaultValue={end}
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-dark flex-grow-1">
                적용
              </button>
              <Link href="/admin/update-check" className="btn btn-outline-secondary">
                초기화
              </Link>
            </div>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="sr-block card">
          <div className="card-body py-5 text-center text-muted">
            등록된 업데이트 요청이 없습니다.
          </div>
        </div>
      ) : (
        <PaginatedTable
          title="업데이트 요청 목록 (최근 50건)"
          legendType="request"
          pageSize={10}
          fixedRows={10}
          className="sr-block"
          columns={[
            { header: "요청 브랜드명" },
            { header: "검색 키워드" },
            { header: "요청 수", className: "text-end" },
            { header: "상태" },
            { header: "요청일" },
            { header: "처리일" },
            { header: "관리자 메모" },
          ]}
          rowKeys={rows.map((row) => row.id)}
          rows={rows.map((row) => {
            const processedAt = formatBrandRequestProcessedAt(row);
            return [
              <span key={`brand-${row.id}`} className="fw-semibold">
                {row.keyword}
              </span>,
              row.keyword,
              <span key={`count-${row.id}`} className="fw-bold text-primary">
                {row.request_count}
              </span>,
              <StatusBadge key={`status-${row.id}`} status={row.status} />,
              formatDateTime(row.created_at),
              processedAt ? formatDateTime(processedAt) : "-",
              row.memo?.trim() ? row.memo : "-",
            ];
          })}
        />
      )}
    </>
  );
}
