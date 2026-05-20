import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isProviderRequestStatus } from "@/lib/admin/provider-request-status";
import { PROVIDER_REQUEST_STATUS_OPTIONS } from "@/lib/ui/format-status-label";

import { approveProviderRequestAction, rejectProviderRequestAction } from "./actions";

type ProviderRequestRow = {
  id: number;
  provider_name: string;
  category: string;
  request_user: string;
  requested_at: string;
  status: string;
  admin_memo: string | null;
  approved_provider_id: number | null;
  processed_at: string | null;
};

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

function getSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ProviderRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = getSearchParam(params.status) ?? "";
  const q = getSearchParam(params.q)?.trim() ?? "";

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("provider_requests")
    .select(
      "id,provider_name,category,request_user,requested_at,status,admin_memo,approved_provider_id,processed_at",
    )
    .order("requested_at", { ascending: false })
    .limit(50);

  if (statusFilter && isProviderRequestStatus(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  if (q) {
    query = query.ilike("provider_name", `%${q.replace(/%/g, "\\%")}%`);
  }

  const [{ data, error }, { count: pendingCount }] = await Promise.all([
    query,
    supabase
      .from("provider_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  if (error) {
    throw new Error(`provider_requests 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as ProviderRequestRow[];

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">카드사 요청</h1>
          <p className="text-muted small mb-0">
            할인 등록 화면에서 요청된 카드사(provider)를 승인하면 providers에 등록되고, 카드사
            전체 상품이 자동 생성됩니다.
          </p>
        </div>
        <Link href="/admin/providers" className="btn btn-outline-secondary shrink-0">
          제공사 목록
        </Link>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="sr-block card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="small text-muted mb-1">승인 대기</div>
              <div className="display-6 fw-bold lh-1 text-warning-emphasis">
                {pendingCount ?? 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sr-block card mb-4">
        <div className="card-body">
          <form method="get" className="row g-3 align-items-end">
            <div className="col-md-5">
              <label htmlFor="pr-q" className="form-label small text-muted mb-1">
                카드사명
              </label>
              <input
                id="pr-q"
                name="q"
                type="search"
                className="form-control"
                placeholder="카드사명 검색"
                defaultValue={q}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="pr-status" className="form-label small text-muted mb-1">
                상태
              </label>
              <select
                id="pr-status"
                name="status"
                className="form-select"
                defaultValue={statusFilter}
              >
                <option value="">상태 전체</option>
                {PROVIDER_REQUEST_STATUS_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button type="submit" className="btn btn-dark flex-grow-1">
                적용
              </button>
              <Link href="/admin/provider-requests" className="btn btn-outline-secondary">
                초기화
              </Link>
            </div>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="sr-block card">
          <div className="card-body py-5 text-center text-muted">
            등록된 카드사 요청이 없습니다.
          </div>
        </div>
      ) : (
        <PaginatedTable
          title="카드사 요청 목록 (최근 50건)"
          legendType="request"
          pageSize={10}
          fixedRows={10}
          className="sr-block"
          columns={[
            { header: "카드사명" },
            { header: "category" },
            { header: "요청자" },
            { header: "요청일" },
            { header: "상태" },
            { header: "처리일" },
            { header: "관리자 메모" },
            { header: "처리" },
          ]}
          rowKeys={rows.map((row) => row.id)}
          rows={rows.map((row) => [
            <span key={`name-${row.id}`} className="fw-semibold">
              {row.provider_name}
            </span>,
            row.category,
            row.request_user,
            formatDateTime(row.requested_at),
            <StatusBadge key={`status-${row.id}`} status={row.status} />,
            formatDateTime(row.processed_at),
            row.admin_memo?.trim() ? row.admin_memo : "-",
            row.status === "pending" ? (
              <div key={`actions-${row.id}`} className="d-flex flex-column gap-2">
                <form action={approveProviderRequestAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit" className="btn btn-sm btn-success w-100">
                    승인
                  </button>
                </form>
                <form action={rejectProviderRequestAction} className="d-flex flex-column gap-1">
                  <input type="hidden" name="id" value={row.id} />
                  <input
                    name="admin_memo"
                    className="form-control form-control-sm"
                    placeholder="반려 사유 (선택)"
                  />
                  <button type="submit" className="btn btn-sm btn-outline-secondary w-100">
                    반려
                  </button>
                </form>
              </div>
            ) : row.approved_provider_id ? (
              <Link
                key={`provider-${row.id}`}
                href={`/admin/providers/${row.approved_provider_id}/edit`}
                className="btn btn-sm btn-outline-primary"
              >
                제공사 #{row.approved_provider_id}
              </Link>
            ) : (
              "-"
            ),
          ])}
        />
      )}
    </>
  );
}
