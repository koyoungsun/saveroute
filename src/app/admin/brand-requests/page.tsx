import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const requests = [
  ["올리브영", "올리브영", 28, "pending", "2025-01-15"],
  ["다이소", "다이소", 21, "pending", "2025-01-14"],
  ["노브랜드", "노브랜드", 15, "processing", "2025-01-13"],
  ["이케아", "이케아", 10, "completed", "2025-01-10"],
  ["쿠팡", "쿠팡", 8, "pending", "2025-01-09"],
  ["버거킹", "버거킹", 7, "ignored", "2025-01-08"],
  ["맥도날드", "맥도날드", 6, "processing", "2025-01-07"],
  ["롯데시네마", "롯데시네마", 5, "completed", "2025-01-06"],
  ["메가박스", "메가박스", 4, "pending", "2025-01-05"],
  ["이마트", "이마트", 3, "ignored", "2025-01-04"],
  ["홈플러스", "홈플러스", 2, "pending", "2025-01-03"],
  ["GS25", "gs25", 1, "pending", "2025-01-02"],
  ["CU", "cu", 1, "pending", "2025-01-01"],
] as const;

export default function BrandRequestsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Brand Requests</h1>

      <div className="sr-block card">
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

      <PaginatedTable
        title="요청 목록"
        legendType="request"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "키워드" },
          { header: "정규화 키워드" },
          { header: "요청수" },
          { header: "상태" },
          { header: "최근 요청일" },
          { header: "관리" },
        ]}
        rows={requests.map(([keyword, normalized, count, status, requestedAt]) => [
          keyword,
          normalized,
          count,
          <StatusBadge key={`${keyword}-status`} status={status} />,
          requestedAt,
          <button
            key={`${keyword}-action`}
            type="button"
            className="btn btn-outline-secondary btn-sm"
          >
            처리
          </button>,
        ])}
      />
    </>
  );
}
