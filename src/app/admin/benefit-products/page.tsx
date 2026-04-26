import { StatusBadge } from "@/components/admin/StatusBadge";

const products = [
  ["KT VIP", "KT", "telecom_membership", "VIP", "-", "No", "active"],
  ["SKT T멤버십", "SKT", "telecom_membership", "VIP", "-", "No", "active"],
  ["KT M모바일 요금제", "KT M모바일", "telecom_mvno_plan", "-", "-", "Yes", "active"],
  ["신한 Deep Dream", "신한카드", "credit_card", "-", "credit", "No", "active"],
  ["삼성 iD ON", "삼성카드", "credit_card", "-", "credit", "No", "active"],
] as const;

export default function BenefitProductsPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Benefit Products</h1>
        <button type="button" className="btn btn-primary">
          + 등록
        </button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>이름</th>
                <th>제공사</th>
                <th>product_type</th>
                <th>grade</th>
                <th>card_type</th>
                <th>MVNO</th>
                <th>active</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={`${product[1]}-${product[0]}`}>
                  <td>{product[0]}</td>
                  <td>{product[1]}</td>
                  <td>{product[2]}</td>
                  <td>{product[3]}</td>
                  <td>{product[4]}</td>
                  <td>{product[5]}</td>
                  <td>
                    <StatusBadge status={product[6]} />
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
