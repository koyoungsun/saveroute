import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const brands = [
  [1, "롯데월드", "lotte-world", "여가", 5, "1,240", "active"],
  [2, "에버랜드", "everland", "여가", 4, "980", "active"],
  [3, "서울랜드", "seoulland", "여가", 3, "610", "active"],
  [4, "CGV", "cgv", "여가", 6, "1,120", "active"],
  [5, "스타벅스", "starbucks", "식음료", 4, "890", "hidden"],
  [6, "올리브영", "oliveyoung", "쇼핑", 4, "740", "active"],
  [7, "다이소", "daiso", "쇼핑", 2, "690", "active"],
  [8, "노브랜드", "nobrand", "쇼핑", 1, "540", "active"],
  [9, "이케아", "ikea", "쇼핑", 3, "420", "hidden"],
  [10, "쿠팡", "coupang", "쇼핑", 5, "1,010", "active"],
  [11, "버거킹", "burgerking", "식음료", 2, "380", "active"],
  [12, "맥도날드", "mcdonalds", "식음료", 2, "360", "active"],
  [13, "CGV청담", "cgv-cheongdam", "여가", 1, "120", "draft"],
  [14, "롯데시네마", "lotte-cinema", "여가", 2, "410", "active"],
  [15, "메가박스", "megabox", "여가", 2, "390", "active"],
] as const;

export default function AdminBrandsPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Brands</h1>
        <button type="button" className="btn btn-primary">
          + 브랜드 등록
        </button>
      </div>

      <div className="sr-block card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input className="form-control" placeholder="브랜드명/slug/별칭" />
            </div>
            <div className="col-md-3">
              <select className="form-select" defaultValue="">
                <option value="">카테고리 전체</option>
                <option>여가</option>
                <option>식음료</option>
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" defaultValue="">
                <option value="">상태 전체</option>
                <option>active</option>
                <option>hidden</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <PaginatedTable
        title="브랜드 목록"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "브랜드명" },
          { header: "slug" },
          { header: "카테고리" },
          { header: "할인수" },
          { header: "최근검색" },
          { header: "상태" },
          { header: "관리" },
        ]}
        rows={brands.map(([, name, slug, category, discounts, searches, status]) => [
          name,
          slug,
          category,
          discounts,
          searches,
          <StatusBadge key={`${slug}-status`} status={status} />,
          <button
            key={`${slug}-action`}
            type="button"
            className="btn btn-outline-secondary btn-sm"
          >
            수정
          </button>,
        ])}
      />
    </>
  );
}
