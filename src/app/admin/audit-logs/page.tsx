const auditLogs = [
  ["01-15 14:32", "op1@coreroute.dev", "create", "discounts", "124"],
  ["01-15 13:20", "op1@coreroute.dev", "update", "brands", "12"],
  ["01-15 11:05", "admin@coreroute.dev", "status_change", "brand_requests", "8"],
] as const;

export default function AuditLogsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Audit Logs</h1>

      <div className="card mb-4">
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

      <div className="card">
        <div className="card-header bg-white fw-semibold">Read-only</div>
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>시각</th>
                <th>관리자</th>
                <th>액션</th>
                <th>대상 테이블</th>
                <th>대상 ID</th>
                <th>상세</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(([time, admin, action, table, targetId]) => (
                <tr key={`${time}-${table}-${targetId}`}>
                  <td>{time}</td>
                  <td>{admin}</td>
                  <td>
                    <span className="badge bg-secondary">{action}</span>
                  </td>
                  <td>{table}</td>
                  <td>{targetId}</td>
                  <td>
                    <button type="button" className="btn btn-outline-secondary btn-sm">
                      보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
