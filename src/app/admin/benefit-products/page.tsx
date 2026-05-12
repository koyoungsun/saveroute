import Link from "next/link";

import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { deactivateBenefitProductAction } from "./actions";

type RelationName = { name: string } | { name: string }[] | null;

type BenefitProductRow = {
  id: number;
  name: string;
  is_active: boolean;
  is_mvno: boolean;
  mvno_notice_required: boolean;
  benefit_category: RelationName;
  provider: RelationName;
};

function getRelationName(relation: RelationName) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "-";
  }

  return relation?.name ?? "-";
}

function formatBoolean(value: boolean) {
  return value ? "Yes" : "No";
}

export default async function BenefitProductsPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("benefit_products")
    .select(
      `
      id,
      name,
      is_active,
      is_mvno,
      mvno_notice_required,
      benefit_category:benefit_categories(name),
      provider:providers(name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load benefit products: ${error.message}`);
  }

  const products = (data ?? []) as BenefitProductRow[];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Benefit Products</h1>
        <Link href="/admin/benefit-products/new" className="btn btn-primary">
          + 상품 등록
        </Link>
      </div>

      <PaginatedTable
        title="혜택 상품 목록"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "카테고리" },
          { header: "제공사" },
          { header: "상품명" },
          { header: "상태" },
          { header: "알뜰폰" },
          { header: "알뜰폰 안내" },
          { header: "관리" },
        ]}
        rowKeys={products.map((product) => product.id)}
        rows={products.map((product) => {
          const key = `${product.id}-${product.name}`;
          return [
            getRelationName(product.benefit_category),
            getRelationName(product.provider),
            product.name,
            <StatusBadge
              key={`${key}-status`}
              status={product.is_active ? "active" : "inactive"}
            />,
            formatBoolean(product.is_mvno),
            formatBoolean(product.mvno_notice_required),
            <div key={`${key}-actions`} className="d-flex gap-2">
              <Link
                href={`/admin/benefit-products/${product.id}/edit`}
                className="btn btn-outline-secondary btn-sm"
              >
                수정
              </Link>
              <form action={deactivateBenefitProductAction}>
                <input
                  type="hidden"
                  name="benefit_product_id"
                  value={product.id}
                />
                <button
                  type="submit"
                  className="btn btn-outline-danger btn-sm"
                  disabled={!product.is_active}
                >
                  비활성화
                </button>
              </form>
            </div>,
          ];
        })}
      />
    </>
  );
}
