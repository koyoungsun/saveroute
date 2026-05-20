import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { isBenefitProductRequestStatus } from "@/lib/benefits/benefit-product-request-status";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BENEFIT_PRODUCT_REQUEST_STATUS_OPTIONS } from "@/lib/ui/format-status-label";

import {
  approveBenefitProductRequestAction,
  rejectBenefitProductRequestAction,
} from "./actions";

type BenefitProductRequestRow = {
  id: number;
  requested_name: string;
  requested_benefit_type: string;
  status: string;
  admin_memo: string | null;
  created_at: string;
  reviewed_at: string | null;
  approved_benefit_product_id: number | null;
  provider: { name: string } | { name: string }[] | null;
  user_id: string | null;
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

function relationOne<T>(relation: T | T[] | null): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }
  return relation ?? null;
}

function formatBenefitType(value: string) {
  if (value === "credit") return "신용";
  if (value === "debit") return "체크";
  return value;
}

export default async function BenefitProductRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = getSearchParam(params.status) ?? "";
  const q = getSearchParam(params.q)?.trim() ?? "";

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("benefit_product_requests")
    .select(
      "id,requested_name,requested_benefit_type,status,admin_memo,created_at,reviewed_at,approved_benefit_product_id,user_id,provider:providers(name)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (statusFilter && isBenefitProductRequestStatus(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  if (q) {
    query = query.ilike("requested_name", `%${q.replace(/%/g, "\\%")}%`);
  }

  const [{ data, error }, { count: pendingCount }] = await Promise.all([
    query,
    supabase
      .from("benefit_product_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  if (error) {
    throw new Error(`benefit_product_requests 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as BenefitProductRequestRow[];

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">카드 요청</h1>
          <p className="text-muted small mb-0">
            사용자가 /my-benefits 에서 직접 입력한 카드명 요청입니다. 승인 시 benefit_products에
            정식 등록되고, 해당 사용자 혜택이 연결됩니다.
          </p>
        </div>
        <Link href="/admin/benefit-products" className="btn btn-outline-secondary shrink-0">
          혜택 상품 목록
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
              <label htmlFor="bpr-q" className="form-label small text-muted mb-1">
                카드명
              </label>
              <input
                id="bpr-q"
                name="q"
                type="search"
                className="form-control"
                placeholder="카드명 검색"
                defaultValue={q}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="bpr-status" className="form-label small text-muted mb-1">
                상태
              </label>
              <select
                id="bpr-status"
                name="status"
                className="form-select"
                defaultValue={statusFilter}
              >
                <option value="">상태 전체</option>
                {BENEFIT_PRODUCT_REQUEST_STATUS_OPTIONS.map(({ value, label }) => (
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
              <Link href="/admin/benefit-product-requests" className="btn btn-outline-secondary">
                초기화
              </Link>
            </div>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="sr-block card">
          <div className="card-body py-5 text-center text-muted">
            등록된 카드 요청이 없습니다.
          </div>
        </div>
      ) : (
        <PaginatedTable
          title="카드 요청 목록 (최근 50건)"
          legendType="request"
          pageSize={10}
          fixedRows={10}
          className="sr-block"
          columns={[
            { header: "카드명" },
            { header: "카드사" },
            { header: "카드 유형" },
            { header: "요청자" },
            { header: "요청일" },
            { header: "상태" },
            { header: "관리자 메모" },
            { header: "처리" },
          ]}
          rowKeys={rows.map((row) => row.id)}
          rows={rows.map((row) => [
            <span key={`name-${row.id}`} className="fw-semibold">
              {row.requested_name}
            </span>,
            relationOne(row.provider)?.name ?? "-",
            formatBenefitType(row.requested_benefit_type),
            row.user_id ? (
              <span key={`user-${row.id}`} className="font-monospace small">
                {row.user_id.slice(0, 8)}…
              </span>
            ) : (
              "-"
            ),
            formatDateTime(row.created_at),
            <StatusBadge key={`status-${row.id}`} status={row.status} />,
            row.admin_memo?.trim() ? row.admin_memo : "-",
            row.status === "pending" ? (
              <div key={`actions-${row.id}`} className="d-flex flex-column gap-2">
                <form action={approveBenefitProductRequestAction}>
                  <input type="hidden" name="id" value={row.id} />
                  <button type="submit" className="btn btn-sm btn-success w-100">
                    승인
                  </button>
                </form>
                <form action={rejectBenefitProductRequestAction} className="d-flex flex-column gap-1">
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
            ) : row.approved_benefit_product_id ? (
              <Link
                key={`product-${row.id}`}
                href={`/admin/benefit-products/${row.approved_benefit_product_id}/edit`}
                className="btn btn-sm btn-outline-primary"
              >
                상품 #{row.approved_benefit_product_id}
              </Link>
            ) : (
              formatDateTime(row.reviewed_at)
            ),
          ])}
        />
      )}
    </>
  );
}
