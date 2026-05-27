import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ProviderRow = {
  id: number;
  name: string;
  code: string;
  provider_type: string;
  display_order: number;
  is_active: boolean;
  benefit_categories: { name: string } | { name: string }[] | null;
};

function getCategoryName(category: ProviderRow["benefit_categories"]) {
  if (Array.isArray(category)) {
    return category[0]?.name ?? "-";
  }

  return category?.name ?? "-";
}

export default async function ProvidersPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("providers")
    .select(
      "id,name,code,provider_type,display_order,is_active,benefit_categories(name)",
    )
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load providers: ${error.message}`);
  }

  const providers = (data ?? []) as ProviderRow[];

  return (
    <>
      <div className="d-flex justify-content-end mb-3">
        <Link href="/admin/providers/new" className="btn btn-primary">
          + 제공사 등록
        </Link>
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
          { header: "display_order" },
          { header: "상태" },
          { header: "관리" },
        ]}
        rowKeys={providers.map((provider) => provider.id)}
        rows={providers.map((provider) => [
          provider.name,
          provider.code,
          getCategoryName(provider.benefit_categories),
          provider.provider_type,
          provider.display_order,
          <StatusBadge
            key={`${provider.id}-status`}
            status={provider.is_active ? "active" : "inactive"}
          />,
          <Link
            key={`${provider.id}-action`}
            href={`/admin/providers/${provider.id}/edit`}
            className="btn btn-outline-secondary btn-sm"
          >
            수정
          </Link>,
        ])}
      />
    </>
  );
}
