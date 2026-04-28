import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const categories = [
  ["telecom", "통신사", "통신사 멤버십 및 요금제", "active", 1],
  ["card", "카드", "신용/체크/선불 카드", "active", 2],
  ["coupon", "쿠폰", "쿠폰 플랫폼", "active", 3],
  ["membership", "멤버십", "외부 멤버십", "active", 4],
  ["food", "식음료", "식음료 카테고리", "active", 5],
  ["leisure", "여가", "여가 카테고리", "active", 6],
  ["shopping", "쇼핑", "쇼핑 카테고리", "active", 7],
  ["transport", "교통", "교통 카테고리", "active", 8],
  ["draft_cat", "드래프트", "임시 카테고리", "draft", 9],
  ["hidden_cat", "숨김", "숨김 카테고리", "hidden", 10],
  ["expired_cat", "만료", "만료 카테고리", "expired", 11],
  ["etc1", "기타1", "기타", "active", 12],
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

      <PaginatedTable
        title="카테고리 목록"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "code" },
          { header: "name" },
          { header: "description" },
          { header: "상태" },
          { header: "sort_order" },
          { header: "관리" },
        ]}
        rows={categories.map(([code, name, description, status, sortOrder]) => [
          code,
          name,
          description,
          <StatusBadge key={`${code}-status`} status={status} />,
          sortOrder,
          <button
            key={`${code}-action`}
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
