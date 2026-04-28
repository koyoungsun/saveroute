import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const accounts = [
  ["admin@coreroute.dev", "master", "active", "2025-01-15"],
  ["op1@coreroute.dev", "operator", "active", "2025-01-14"],
  ["op2@coreroute.dev", "operator", "inactive", "2024-12-01"],
  ["op3@coreroute.dev", "operator", "active", "2025-01-13"],
  ["op4@coreroute.dev", "operator", "active", "2025-01-12"],
  ["op5@coreroute.dev", "operator", "inactive", "2024-11-20"],
  ["op6@coreroute.dev", "operator", "active", "2025-01-11"],
  ["op7@coreroute.dev", "operator", "active", "2025-01-10"],
  ["op8@coreroute.dev", "operator", "inactive", "2024-10-10"],
  ["op9@coreroute.dev", "operator", "active", "2025-01-09"],
  ["op10@coreroute.dev", "operator", "active", "2025-01-08"],
  ["op11@coreroute.dev", "operator", "active", "2025-01-07"],
] as const;

export default function AccountsPage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Accounts</h1>
        <button type="button" className="btn btn-primary">
          + 운영자 초대
        </button>
      </div>

      <div className="sr-block alert alert-info">현재 운영자: 3 / 5명</div>

      <PaginatedTable
        title="운영자 목록"
        legendType="account"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "이메일" },
          { header: "role" },
          { header: "상태" },
          { header: "최근 로그인" },
          { header: "관리" },
        ]}
        rows={accounts.map(([email, role, status, lastLogin]) => [
          email,
          <span
            key={`${email}-role`}
            className="badge text-bg-light text-dark border px-2 py-1 fw-semibold"
          >
            {role}
          </span>,
          <StatusBadge key={`${email}-status`} status={status} />,
          lastLogin,
          role === "master" ? (
            <span key={`${email}-none`} className="text-muted">
              -
            </span>
          ) : (
            <button key={`${email}-action`} type="button" className="btn btn-outline-secondary btn-sm">
              상태 변경
            </button>
          ),
        ])}
      />
    </>
  );
}
