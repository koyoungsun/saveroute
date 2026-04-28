import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const rows = [
  ["롯데월드", "KT VIP", "KT", "active", "2025-01-10"],
  ["CGV", "SKT T멤버십", "SKT", "active", "2025-01-08"],
  ["스타벅스", "신한카드 할인", "신한카드", "active", "2025-01-03"],
  ["에버랜드", "KT VIP", "KT", "active", "2025-01-02"],
  ["서울랜드", "SKT T멤버십", "SKT", "active", "2025-01-01"],
  ["올리브영", "신한카드 할인", "신한카드", "active", "2024-12-28"],
  ["다이소", "삼성카드 할인", "삼성카드", "active", "2024-12-27"],
  ["노브랜드", "현대카드 할인", "현대카드", "active", "2024-12-26"],
  ["이케아", "하나카드 할인", "하나카드", "active", "2024-12-25"],
  ["쿠팡", "국민카드 할인", "국민카드", "active", "2024-12-24"],
  ["메가박스", "KT VIP", "KT", "active", "2024-12-20"],
  ["롯데시네마", "SKT T멤버십", "SKT", "active", "2024-12-19"],
] as const;

export default function UpdateCheckPage() {
  return (
    <>
      <h1 className="h3 mb-4">Update Check</h1>

      <div className="sr-block card">
        <div className="card-body">
          <div className="btn-group" role="group" aria-label="Update filters">
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
        </div>
      </div>

      <PaginatedTable
        title="대상 할인 목록"
        legendType="discount"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "브랜드" },
          { header: "제목" },
          { header: "제공사" },
          { header: "상태" },
          { header: "최근 확인일" },
          { header: "관리" },
        ]}
        rows={rows.map(([brand, title, provider, status, checkedAt]) => {
          const key = `${brand}-${title}`;
          return [
            brand,
            title,
            provider,
            <StatusBadge key={`${key}-status`} status={status} />,
            checkedAt,
            <div key={`${key}-actions`} className="btn-group btn-group-sm">
              <button type="button" className="btn btn-outline-secondary">
                출처열기
              </button>
              <button type="button" className="btn btn-outline-secondary">
                확인
              </button>
              <button type="button" className="btn btn-outline-secondary">
                수정
              </button>
              <button type="button" className="btn btn-outline-secondary">
                만료
              </button>
            </div>,
          ];
        })}
      />
    </>
  );
}
