import { StatusBadge } from "@/components/admin/StatusBadge";

const requests = [
  ["올리브영", "올리브영", 28, "pending", "2025-01-15"],
  ["다이소", "다이소", 21, "pending", "2025-01-14"],
  ["노브랜드", "노브랜드", 15, "processing", "2025-01-13"],
  ["이케아", "이케아", 10, "completed", "2025-01-10"],
] as const;

export default function BrandRequestsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Brand Requests</h1>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <input className="form-control" placeholder="키워드 검색" />
            </div>
            <div className="col-md-4">
              <select className="form-select" defaultValue="">
                <option value="">상태 전체</option>
                <option>pending</option>
                <option>processing</option>
                <option>completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>키워드</th>
                <th>정규화 키워드</th>
                <th>요청수</th>
                <th>상태</th>
                <th>최근 요청일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(([keyword, normalized, count, status, requestedAt]) => (
                <tr key={keyword}>
                  <td>{keyword}</td>
                  <td>{normalized}</td>
                  <td>{count}</td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>{requestedAt}</td>
                  <td>
                    <button type="button" className="btn btn-outline-primary btn-sm">
                      처리
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
