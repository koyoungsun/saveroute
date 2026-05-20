import {
  formatAuditActionLabel,
  formatAuditTargetLabel,
  readAuditSummary,
  summarizeAuditMetadata,
} from "@/lib/admin/audit-log-display";
import {
  loadAdminAuditLogFilterOptions,
  loadAdminAuditLogs,
} from "@/lib/admin/load-admin-audit-logs";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AuditLogsPageProps = {
  searchParams: Promise<{
    action?: string;
    target?: string;
    admin?: string;
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

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = await searchParams;
  const action = getSearchParam(params.action) ?? "";
  const targetTable = getSearchParam(params.target) ?? "";
  const adminUserId = getSearchParam(params.admin) ?? "";
  const startDate = getSearchParam(params.start) ?? "";
  const endDate = getSearchParam(params.end) ?? "";

  const supabase = createSupabaseAdminClient();
  const [rows, filterOptions] = await Promise.all([
    loadAdminAuditLogs(supabase, {
      action,
      targetTable,
      adminUserId,
      startDate,
      endDate,
      limit: 50,
    }),
    loadAdminAuditLogFilterOptions(supabase),
  ]);

  return (
    <>
      <h1 className="h3 mb-4">Audit Logs</h1>

      <div className="sr-block card mb-4">
        <div className="card-body">
          <form method="get" className="row g-3 align-items-end">
            <div className="col-md-3">
              <label htmlFor="audit-admin" className="form-label small text-muted mb-1">
                관리자
              </label>
              <select
                id="audit-admin"
                name="admin"
                className="form-select"
                defaultValue={adminUserId}
              >
                <option value="">관리자 전체</option>
                {filterOptions.admins.map((admin) => (
                  <option key={admin.userId} value={admin.userId}>
                    {admin.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="audit-action" className="form-label small text-muted mb-1">
                action
              </label>
              <select
                id="audit-action"
                name="action"
                className="form-select"
                defaultValue={action}
              >
                <option value="">action 전체</option>
                {filterOptions.actions.map((value) => (
                  <option key={value} value={value}>
                    {formatAuditActionLabel(value)} ({value})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="audit-target" className="form-label small text-muted mb-1">
                target_type
              </label>
              <select
                id="audit-target"
                name="target"
                className="form-select"
                defaultValue={targetTable}
              >
                <option value="">target 전체</option>
                {filterOptions.targetTables.map((value) => (
                  <option key={value} value={value}>
                    {formatAuditTargetLabel(value)} ({value})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="audit-start" className="form-label small text-muted mb-1">
                시작일
              </label>
              <input
                id="audit-start"
                name="start"
                type="date"
                className="form-control"
                defaultValue={startDate}
              />
            </div>
            <div className="col-md-2">
              <label htmlFor="audit-end" className="form-label small text-muted mb-1">
                종료일
              </label>
              <input
                id="audit-end"
                name="end"
                type="date"
                className="form-control"
                defaultValue={endDate}
              />
            </div>
            <div className="col-md-1 d-flex gap-2">
              <button type="submit" className="btn btn-dark w-100">
                조회
              </button>
            </div>
          </form>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="sr-block card">
          <div className="card-body py-5 text-center text-muted">
            아직 감사로그가 없습니다.
          </div>
        </div>
      ) : (
        <PaginatedTable
          title="Audit Logs (Read-only, 최근 50건)"
          legendType="generic"
          pageSize={10}
          fixedRows={10}
          className="sr-block"
          columns={[
            { header: "작업일시" },
            { header: "관리자" },
            { header: "action" },
            { header: "target_type" },
            { header: "target_id" },
            { header: "summary" },
            { header: "metadata" },
          ]}
          rowKeys={rows.map((row) => row.id)}
          rows={rows.map((row) => [
            formatDateTime(row.created_at),
            row.adminEmail ?? row.admin_user_id,
            <span
              key={`${row.id}-action`}
              className="badge text-bg-light text-dark border px-2 py-1 fw-semibold"
            >
              {row.action}
            </span>,
            formatAuditTargetLabel(row.target_table),
            row.target_id,
            readAuditSummary(row),
            <span
              key={`${row.id}-meta`}
              className="small text-muted"
              title={summarizeAuditMetadata(row)}
            >
              {summarizeAuditMetadata(row)}
            </span>,
          ])}
        />
      )}
    </>
  );
}
