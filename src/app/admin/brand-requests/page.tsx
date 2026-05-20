import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { updateBrandRequestStatusAction } from "./actions";
import {
  BRAND_REQUEST_STATUS_OPTIONS,
} from "@/lib/ui/format-status-label";

function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

type BrandRequestRow = {
  id: number;
  keyword: string;
  normalized_keyword: string;
  request_count: number;
  status: string;
  created_at: string;
  updated_at: string;
};

type SearchParams = {
  status?: string;
  q?: string;
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const STATUS_OPTIONS = [
  { value: "", label: "상태 전체" },
  ...BRAND_REQUEST_STATUS_OPTIONS.map(({ value, label }) => ({ value, label })),
] as const;

export default async function BrandRequestsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const statusFilter = (sp.status ?? "").trim();
  const q = (sp.q ?? "").trim();

  const validStatuses = ["pending", "reviewing", "completed", "rejected"] as const;
  const statusOk =
    statusFilter && validStatuses.includes(statusFilter as (typeof validStatuses)[number]);

  const supabase = createSupabaseAdminClient();

  const [
    { count: totalCount },
    { count: pendingCount },
    { data: rowsData, error },
  ] = await Promise.all([
    supabase.from("brand_requests").select("*", { count: "exact", head: true }),
    supabase
      .from("brand_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    (() => {
      let qy = supabase
        .from("brand_requests")
        .select(
          "id,keyword,normalized_keyword,request_count,status,created_at,updated_at",
        )
        .order("request_count", { ascending: false })
        .order("updated_at", { ascending: false });

      if (statusOk) {
        qy = qy.eq("status", statusFilter as (typeof validStatuses)[number]);
      }

      if (q.length > 0) {
        const esc = escapeIlikePattern(q);
        qy = qy.or(`keyword.ilike.%${esc}%,normalized_keyword.ilike.%${esc}%`);
      }

      return qy;
    })(),
  ]);

  if (error) {
    throw new Error(`brand_requests 조회 실패: ${error.message}`);
  }

  const rows = (rowsData ?? []) as BrandRequestRow[];

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">브랜드 요청</h1>
          <p className="text-muted small mb-0">
            미등록 브랜드 검색 요청을 우선순위(request_count·최근 갱신)로 처리합니다. 브랜드 등록 후 같은 행에서 상태를{" "}
            <strong>완료</strong>로 저장하면 처리가 마무리됩니다.
          </p>
        </div>
        <Link href="/admin/brands/new" className="btn btn-primary shrink-0">
          + 브랜드 등록
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="sr-block card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted mb-1">전체 요청 건수</div>
              <div className="display-6 fw-bold lh-1">{totalCount ?? 0}</div>
              <div className="small text-muted mt-2">고유 키워드(normalized) 기준 행 수</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="sr-block card shadow-sm h-100 border-start border-warning border-4">
            <div className="card-body">
              <div className="small text-muted mb-1">대기중 (처리 대기)</div>
              <div className="display-6 fw-bold lh-1 text-warning-emphasis">{pendingCount ?? 0}</div>
              <div className="small text-muted mt-2">브랜드 등록 후 완료로 바꿔 주세요</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sr-block card mb-4">
        <div className="card-body">
          <form method="get" className="row g-3 align-items-end">
            <div className="col-md-5">
              <label htmlFor="br-q" className="form-label small text-muted mb-1">
                키워드 검색
              </label>
              <input
                id="br-q"
                name="q"
                type="search"
                className="form-control"
                placeholder="표시 키워드 또는 정규화 키워드"
                defaultValue={q}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="br-status" className="form-label small text-muted mb-1">
                상태
              </label>
              <select
                id="br-status"
                name="status"
                className="form-select"
                defaultValue={statusFilter}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-dark flex-grow-1">
                적용
              </button>
              <Link href="/admin/brand-requests" className="btn btn-outline-secondary">
                초기화
              </Link>
            </div>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="sr-block card">
          <div className="card-body py-5 text-center text-muted">
            조건에 맞는 브랜드 요청이 없습니다. 필터를 바꾸거나 초기화해 보세요.
          </div>
        </div>
      ) : (
        <PaginatedTable
          title="요청 목록"
          legendType="request"
          pageSize={15}
          fixedRows={15}
          className="sr-block"
          columns={[
            { header: "keyword" },
            { header: "브랜드 등록" },
            { header: "request_count", className: "text-end" },
            { header: "status" },
            { header: "created_at" },
            { header: "updated_at" },
            { header: "처리" },
          ]}
          rowKeys={rows.map((r) => r.id)}
          rows={rows.map((r) => [
            <span key={`kw-${r.id}`} className="fw-semibold" title={r.normalized_keyword}>
              {r.keyword}
            </span>,
            <Link
              key={`reg-${r.id}`}
              href={`/admin/brands/new?keyword=${encodeURIComponent(r.keyword)}`}
              className="btn btn-sm btn-outline-primary"
            >
              브랜드 등록
            </Link>,
            <span key={`cnt-${r.id}`} className="fw-bold text-primary">
              {r.request_count}
            </span>,
            <StatusBadge key={`st-${r.id}`} status={r.status} />,
            formatDateTime(r.created_at),
            formatDateTime(r.updated_at),
            <form
              key={`form-${r.id}`}
              action={updateBrandRequestStatusAction}
              className="d-flex flex-wrap align-items-center gap-2"
            >
              <input type="hidden" name="id" value={r.id} />
              <select name="status" className="form-select form-select-sm" defaultValue={r.status}>
                {BRAND_REQUEST_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-sm btn-outline-primary">
                저장
              </button>
            </form>,
          ])}
        />
      )}
    </>
  );
}
