import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeSupabaseQueryFailure } from "@/lib/admin/format-db-error";
import { formatStatusLabel } from "@/lib/ui/format-status-label";

type AccountRow = {
  user_id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function AccountsPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_accounts")
    .select("user_id,email,role,is_active,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      describeSupabaseQueryFailure(
        `admin_accounts 운영자 목록 (컬럼: user_id, email, role, is_active, created_at)`,
        error,
      ),
    );
  }

  const accounts = (data ?? []) as AccountRow[];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Accounts</h1>
        <span className="badge text-bg-light text-dark border">admin_accounts 기준</span>
      </div>

      <div className="sr-block alert alert-info">
        등록된 관리자 계정: {accounts.length.toLocaleString("ko-KR")}명
      </div>

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
          { header: "등록일" },
        ]}
        rows={accounts.map((account) => [
          account.email,
          <span
            key={`${account.user_id}-role`}
            className="badge text-bg-light text-dark border px-2 py-1 fw-semibold"
          >
            {formatStatusLabel(account.role)}
          </span>,
          <StatusBadge
            key={`${account.user_id}-active`}
            status={account.is_active ? "active" : "inactive"}
          />,
          formatDate(account.created_at),
        ])}
      />
    </>
  );
}
