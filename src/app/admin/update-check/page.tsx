import { StatusBadge } from "@/components/admin/StatusBadge";

const rows = [
  ["롯데월드", "KT VIP", "KT", "active", "2025-01-10"],
  ["CGV", "SKT T멤버십", "SKT", "active", "2025-01-08"],
  ["스타벅스", "신한카드 할인", "신한카드", "active", "2025-01-03"],
] as const;

export default function UpdateCheckPage() {
  return (
    <>
      <h1 className="h3 mb-4">Update Check</h1>

      <div className="btn-group mb-4" role="group" aria-label="Update filters">
        <button type="button" className="btn btn-outline-secondary">
          14일 이상
        </button>
        <button type="button" className="btn btn-outline-secondary">
          30일 이상
        </button>
        <button type="button" className="btn btn-outline-secondary">
          만료 임박
        </button>
        <button type="button" className="btn btn-outline-secondary">
          출처 없음
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>브랜드</th>
                <th>제목</th>
                <th>제공사</th>
                <th>상태</th>
                <th>최근 확인일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([brand, title, provider, status, checkedAt]) => (
                <tr key={`${brand}-${title}`}>
                  <td>{brand}</td>
                  <td>{title}</td>
                  <td>{provider}</td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>{checkedAt}</td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button type="button" className="btn btn-outline-secondary">
                        출처열기
                      </button>
                      <button type="button" className="btn btn-outline-success">
                        확인
                      </button>
                      <button type="button" className="btn btn-outline-primary">
                        수정
                      </button>
                      <button type="button" className="btn btn-outline-danger">
                        만료
                      </button>
                    </div>
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
