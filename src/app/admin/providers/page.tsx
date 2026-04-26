import { StatusBadge } from "@/components/admin/StatusBadge";

const providers = [
  ["KT", "kt", "통신사", "telecom_major", "active"],
  ["SKT", "skt", "통신사", "telecom_major", "active"],
  ["LGU+", "lguplus", "통신사", "telecom_major", "active"],
  ["KT M모바일", "kt_m_mobile", "통신사", "telecom_mvno", "active"],
  ["신한카드", "shinhan_card", "카드", "card_company", "active"],
  ["삼성카드", "samsung_card", "카드", "card_company", "active"],
  ["현대카드", "hyundai_card", "카드", "card_company", "active"],
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

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>이름</th>
                <th>code</th>
                <th>category</th>
                <th>provider_type</th>
                <th>active</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {providers.map(([name, code, category, providerType, status]) => (
                <tr key={code}>
                  <td>{name}</td>
                  <td>{code}</td>
                  <td>{category}</td>
                  <td>{providerType}</td>
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
