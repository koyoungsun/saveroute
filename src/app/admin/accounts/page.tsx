import { StatusBadge } from "@/components/admin/StatusBadge";

const accounts = [
  ["admin@coreroute.dev", "master", "active", "2025-01-15"],
  ["op1@coreroute.dev", "operator", "active", "2025-01-14"],
  ["op2@coreroute.dev", "operator", "inactive", "2024-12-01"],
] as const;

export default function AccountsPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Accounts</h1>
        <button type="button" className="btn btn-primary">
          + 운영자 초대
        </button>
      </div>

      <div className="alert alert-info">현재 운영자: 3 / 5명</div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>이메일</th>
                <th>role</th>
                <th>상태</th>
                <th>최근 로그인</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(([email, role, status, lastLogin]) => (
                <tr key={email}>
                  <td>{email}</td>
                  <td>
                    <span className="badge bg-primary">{role}</span>
                  </td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>{lastLogin}</td>
                  <td>
                    {role === "master" ? (
                      <span className="text-muted">-</span>
                    ) : (
                      <button type="button" className="btn btn-outline-secondary btn-sm">
                        상태 변경
                      </button>
                    )}
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
