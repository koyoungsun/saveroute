import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const products = [
  ["KT VIP", "KT", "telecom_membership", "VIP", "-", "No", "active"],
  ["SKT T멤버십", "SKT", "telecom_membership", "VIP", "-", "No", "active"],
  ["KT M모바일 요금제", "KT M모바일", "telecom_mvno_plan", "-", "-", "Yes", "active"],
  ["신한 Deep Dream", "신한카드", "credit_card", "-", "credit", "No", "active"],
  ["삼성 iD ON", "삼성카드", "credit_card", "-", "credit", "No", "active"],
  ["현대 ZERO", "현대카드", "credit_card", "-", "credit", "No", "active"],
  ["KB 노리", "국민카드", "debit_card", "-", "debit", "No", "active"],
  ["하나 1Q", "하나카드", "credit_card", "-", "credit", "No", "active"],
  ["U+ MVNO 요금제", "U+ 알뜰모바일", "telecom_mvno_plan", "-", "-", "Yes", "active"],
  ["SK 7mobile 요금제", "SK 7mobile", "telecom_mvno_plan", "-", "-", "Yes", "active"],
  ["쿠폰A", "쿠폰플랫폼", "coupon", "-", "-", "No", "active"],
  ["멤버십A", "멤버십", "membership", "Gold", "-", "No", "hidden"],
  ["드래프트상품", "KT", "telecom_membership", "-", "-", "No", "draft"],
  ["선불카드A", "하나카드", "prepaid_card", "-", "prepaid", "No", "active"],
  ["체크카드B", "신한카드", "debit_card", "-", "debit", "No", "active"],
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

      <PaginatedTable
        title="혜택 상품 목록"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "이름" },
          { header: "제공사" },
          { header: "product_type" },
          { header: "grade" },
          { header: "card_type" },
          { header: "MVNO" },
          { header: "상태" },
          { header: "관리" },
        ]}
        rows={products.map((product) => {
          const key = `${product[1]}-${product[0]}`;
          return [
            product[0],
            product[1],
            product[2],
            product[3],
            product[4],
            product[5],
            <StatusBadge key={`${key}-status`} status={product[6]} />,
            <button
              key={`${key}-action`}
              type="button"
              className="btn btn-outline-secondary btn-sm"
            >
              수정
            </button>,
          ];
        })}
      />
    </>
  );
}
