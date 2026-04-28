import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const providers = [
  ["KT", "kt", "통신사", "telecom_major", "active"],
  ["SKT", "skt", "통신사", "telecom_major", "active"],
  ["LGU+", "lguplus", "통신사", "telecom_major", "active"],
  ["KT M모바일", "kt_m_mobile", "통신사", "telecom_mvno", "active"],
  ["신한카드", "shinhan_card", "카드", "card_company", "active"],
  ["삼성카드", "samsung_card", "카드", "card_company", "active"],
  ["현대카드", "hyundai_card", "카드", "card_company", "active"],
  ["국민카드", "kb_card", "카드", "card_company", "active"],
  ["하나카드", "hana_card", "카드", "card_company", "active"],
  ["롯데카드", "lotte_card", "카드", "card_company", "hidden"],
  ["NH농협카드", "nh_card", "카드", "card_company", "active"],
  ["BC카드", "bc_card", "카드", "card_company", "active"],
  ["U+ 알뜰모바일", "uplus_mvno", "통신사", "telecom_mvno", "active"],
  ["SK 7mobile", "sk_7mobile", "통신사", "telecom_mvno", "active"],
  ["드래프트제공사", "draft_provider", "기타", "other", "draft"],
] as const;

export default function ProvidersPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Providers</h1>
        <button type="button" className="btn btn-primary">
          + 등록
        </button>
      </div>

      <PaginatedTable
        title="제공사 목록"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "이름" },
          { header: "code" },
          { header: "category" },
          { header: "provider_type" },
          { header: "상태" },
          { header: "관리" },
        ]}
        rows={providers.map(([name, code, category, providerType, status]) => [
          name,
          code,
          category,
          providerType,
          <StatusBadge key={`${code}-status`} status={status} />,
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
