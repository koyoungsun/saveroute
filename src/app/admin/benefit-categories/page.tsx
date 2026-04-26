import { StatusBadge } from "@/components/admin/StatusBadge";

const categories = [
  ["telecom", "통신사", "통신사 멤버십 및 요금제", "active", 1],
  ["card", "카드", "신용/체크/선불 카드", "active", 2],
  ["coupon", "쿠폰", "쿠폰 플랫폼", "active", 3],
  ["membership", "멤버십", "외부 멤버십", "active", 4],
] as const;

export default function BenefitCategoriesPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Benefit Categories</h1>
        <button type="button" className="btn btn-primary">
          + 등록
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>code</th>
                <th>name</th>
                <th>description</th>
                <th>active</th>
                <th>sort_order</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(([code, name, description, status, sortOrder]) => (
                <tr key={code}>
                  <td>{code}</td>
                  <td>{name}</td>
                  <td>{description}</td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                  <td>{sortOrder}</td>
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
