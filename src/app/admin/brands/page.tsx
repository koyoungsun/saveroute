import { StatusBadge } from "@/components/admin/StatusBadge";

const brands = [
  [1, "롯데월드", "lotte-world", "여가", 5, "1,240", "active"],
  [2, "에버랜드", "everland", "여가", 4, "980", "active"],
  [3, "서울랜드", "seoulland", "여가", 3, "610", "active"],
  [4, "CGV", "cgv", "여가", 6, "1,120", "active"],
  [5, "스타벅스", "starbucks", "식음료", 4, "890", "hidden"],
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

      <div className="card mb-4">
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

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>브랜드명</th>
                <th>slug</th>
                <th>카테고리</th>
                <th>할인수</th>
                <th>최근검색</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {brands.map(([id, name, slug, category, discounts, searches, status]) => (
                <tr key={slug}>
                  <td>{id}</td>
                  <td>{name}</td>
                  <td>{slug}</td>
                  <td>{category}</td>
                  <td>{discounts}</td>
                  <td>{searches}</td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline-primary btn-sm">
                      수정
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
