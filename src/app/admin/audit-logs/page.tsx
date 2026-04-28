import { PaginatedTable } from "@/components/admin/PaginatedTable";

const auditLogs = [
  ["01-15 14:32", "op1@coreroute.dev", "create", "discounts", "124"],
  ["01-15 13:20", "op1@coreroute.dev", "update", "brands", "12"],
  ["01-15 11:05", "admin@coreroute.dev", "status_change", "brand_requests", "8"],
  ["01-15 10:55", "op2@coreroute.dev", "update", "providers", "4"],
  ["01-15 10:40", "op1@coreroute.dev", "update", "benefit_products", "22"],
  ["01-15 10:12", "op2@coreroute.dev", "create", "brands", "44"],
  ["01-15 09:59", "admin@coreroute.dev", "update", "discounts", "210"],
  ["01-15 09:40", "op1@coreroute.dev", "status_change", "accounts", "op2"],
  ["01-15 09:10", "op2@coreroute.dev", "update", "brand_requests", "12"],
  ["01-15 08:50", "admin@coreroute.dev", "create", "discounts", "211"],
  ["01-15 08:20", "op1@coreroute.dev", "update", "brands", "45"],
  ["01-15 08:00", "op2@coreroute.dev", "update", "discounts", "212"],
  ["01-14 19:30", "op1@coreroute.dev", "create", "discounts", "213"],
  ["01-14 19:10", "admin@coreroute.dev", "update", "providers", "6"],
  ["01-14 18:40", "op2@coreroute.dev", "update", "benefit_categories", "2"],
] as const;

export default function AuditLogsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Audit Logs</h1>

      <div className="sr-block card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <select className="form-select" defaultValue="">
                <option value="">관리자 전체</option>
                <option>admin@coreroute.dev</option>
                <option>op1@coreroute.dev</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" defaultValue="">
                <option value="">대상 테이블 전체</option>
                <option>discounts</option>
                <option>brands</option>
              </select>
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" defaultValue="2025-01-01" />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" defaultValue="2025-01-31" />
            </div>
          </div>
        </div>
      </div>

      <PaginatedTable
        title="Audit Logs (Read-only)"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "시각" },
          { header: "관리자" },
          { header: "액션" },
          { header: "대상 테이블" },
          { header: "대상 ID" },
          { header: "상세" },
        ]}
        rows={auditLogs.map(([time, admin, action, table, targetId]) => {
          const key = `${time}-${table}-${targetId}`;
          return [
            time,
            admin,
            <span
              key={`${key}-action`}
              className="badge text-bg-light text-dark border px-2 py-1 fw-semibold"
            >
              {action}
            </span>,
            table,
            targetId,
            <button key={`${key}-detail`} type="button" className="btn btn-outline-secondary btn-sm">
              보기
            </button>,
          ];
        })}
      />
    </>
  );
}
