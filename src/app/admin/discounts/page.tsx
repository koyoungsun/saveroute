import Link from "next/link";

import { ConfidenceBadge } from "@/components/admin/ConfidenceBadge";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { hideDiscountAction } from "./actions";

type DiscountRow = {
  id: number;
  title: string;
  discount_value: number | string;
  discount_unit: string;
  usage_type: string;
  status: string;
  data_confidence: "high" | "medium" | "low";
  valid_until: string | null;
  brand: { name: string } | { name: string }[] | null;
  benefit_category: { name: string } | { name: string }[] | null;
  provider: { name: string } | { name: string }[] | null;
  benefit_product: { name: string } | { name: string }[] | null;
};

function getRelationName(
  relation: { name: string } | { name: string }[] | null,
) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "-";
  }

  return relation?.name ?? "-";
}

function formatDiscountValue(value: number | string, unit: string) {
  const suffixByUnit: Record<string, string> = {
    percent: "%",
    won: "원",
    special_price: "원 특가",
    free: "무료",
    unknown: "",
  };

  if (unit === "free") {
    return "무료";
  }

  return `${value}${suffixByUnit[unit] ?? ""}`;
}

function formatUsageType(usageType: string) {
  const labels: Record<string, string> = {
    onsite_payment: "현장결제",
    app_booking: "앱예매",
    online_booking: "온라인예매",
    coupon_code: "쿠폰코드",
    membership_app: "멤버십앱",
    unknown: "미정",
  };

  return labels[usageType] ?? usageType;
}

export default async function AdminDiscountsPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("discounts")
    .select(
      `
      id,
      title,
      discount_value,
      discount_unit,
      usage_type,
      status,
      data_confidence,
      valid_until,
      brand:brands(name),
      benefit_category:benefit_categories(name),
      provider:providers(name),
      benefit_product:benefit_products(name)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load discounts: ${error.message}`);
  }

  const discounts = (data ?? []) as DiscountRow[];

  const rows = discounts.map((discount) => {
    const key = `${discount.id}-${discount.title}`;
    return [
      getRelationName(discount.brand),
      discount.title,
      getRelationName(discount.benefit_category),
      getRelationName(discount.provider),
      getRelationName(discount.benefit_product),
      formatDiscountValue(discount.discount_value, discount.discount_unit),
      formatUsageType(discount.usage_type),
      <StatusBadge key={`${key}-status`} status={discount.status} />,
      <ConfidenceBadge
        key={`${key}-conf`}
        confidence={discount.data_confidence}
      />,
      discount.valid_until ?? "없음",
      <div key={`${key}-actions`} className="d-flex gap-2">
        <Link
          href={`/admin/discounts/${discount.id}/edit`}
          className="btn btn-outline-secondary btn-sm"
        >
          수정
        </Link>
        <form action={hideDiscountAction}>
          <input type="hidden" name="discount_id" value={discount.id} />
          <button
            type="submit"
            className="btn btn-outline-danger btn-sm"
            disabled={discount.status === "hidden"}
          >
            숨김
          </button>
        </form>
      </div>,
    ];
  });

  const categoryNames = Array.from(
    new Set(discounts.map((discount) => getRelationName(discount.benefit_category))),
  ).filter((name) => name !== "-");
  const providerNames = Array.from(
    new Set(discounts.map((discount) => getRelationName(discount.provider))),
  ).filter((name) => name !== "-");

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Discounts</h1>
        <Link href="/admin/discounts/new" className="btn btn-primary">
          + 할인 등록
        </Link>
      </div>

      <div className="sr-block card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input className="form-control" placeholder="브랜드 검색" />
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">카테고리</option>
                {categoryNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">제공사</option>
                {providerNames.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">상태</option>
                <option>active</option>
                <option>draft</option>
                <option>hidden</option>
                <option>expired</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">신뢰도</option>
                <option>high</option>
                <option>medium</option>
                <option>low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <PaginatedTable
        title="할인 목록"
        legendType="discount"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "브랜드" },
          { header: "제목" },
          { header: "카테고리" },
          { header: "제공사" },
          { header: "혜택상품" },
          { header: "할인값" },
          { header: "방식" },
          { header: "상태" },
          { header: "신뢰도" },
          { header: "만료일" },
          { header: "관리" },
        ]}
        rows={rows}
      />
    </>
  );
}
