import Link from "next/link";

import { ConfidenceBadge } from "@/components/admin/ConfidenceBadge";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  DISCOUNT_SORT_OPTIONS,
  escapeIlikePattern,
  getDiscountBrandMeta,
  getDiscountRelationName,
  parseDiscountListQuery,
  sortDiscountListRows,
  type DiscountListRow,
} from "@/lib/admin/discount-list-query";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatAdminDiscountListValue } from "@/lib/ui/format-money";

import { hideDiscountAction } from "./actions";

type BrandFilterOption = {
  id: number;
  name: string;
  slug: string;
};

type AdminDiscountsPageProps = {
  searchParams: Promise<{
    sort?: string;
    brand?: string;
    q?: string;
  }>;
};

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

export default async function AdminDiscountsPage({
  searchParams,
}: AdminDiscountsPageProps) {
  const params = await searchParams;
  const { sort, brandSlug, q } = parseDiscountListQuery(params);

  const supabase = createSupabaseAdminClient();

  const [
    { data: brandOptionsData, error: brandOptionsError },
    { data: discountData, error: discountError },
  ] = await Promise.all([
    supabase
      .from("brands")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    (async () => {
      let query = supabase
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
          created_at,
          brand:brands(name,slug),
          benefit_category:benefit_categories(name),
          provider:providers(name),
          benefit_product:benefit_products(name)
        `,
        );

      if (brandSlug) {
        const { data: brandRow, error: brandLookupError } = await supabase
          .from("brands")
          .select("id")
          .eq("slug", brandSlug)
          .maybeSingle();

        if (brandLookupError) {
          throw new Error(`Failed to resolve brand filter: ${brandLookupError.message}`);
        }

        if (!brandRow) {
          return { data: [], error: null };
        }

        query = query.eq("brand_id", brandRow.id);
      }

      if (q.length > 0) {
        const esc = escapeIlikePattern(q);
        const { data: matchingBrands, error: matchingBrandError } = await supabase
          .from("brands")
          .select("id")
          .or(`name.ilike.%${esc}%,slug.ilike.%${esc}%`);

        if (matchingBrandError) {
          throw new Error(`Failed to search brands: ${matchingBrandError.message}`);
        }

        const brandIds = (matchingBrands ?? []).map((brand) => brand.id);
        if (brandIds.length > 0) {
          query = query.or(
            `title.ilike.%${esc}%,brand_id.in.(${brandIds.join(",")})`,
          );
        } else {
          query = query.ilike("title", `%${esc}%`);
        }
      }

      return query;
    })(),
  ]);

  if (brandOptionsError) {
    throw new Error(`Failed to load brands: ${brandOptionsError.message}`);
  }

  if (discountError) {
    throw new Error(`Failed to load discounts: ${discountError.message}`);
  }

  const brandOptions = (brandOptionsData ?? []) as BrandFilterOption[];
  const discounts = sortDiscountListRows(
    (discountData ?? []) as DiscountListRow[],
    sort,
  );

  const rows = discounts.map((discount) => {
    const key = `${discount.id}-${discount.title}`;
    return [
      getDiscountBrandMeta(discount).name,
      discount.title,
      getDiscountRelationName(discount.benefit_category),
      getDiscountRelationName(discount.provider),
      getDiscountRelationName(discount.benefit_product),
      formatAdminDiscountListValue(discount.discount_value, discount.discount_unit),
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

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Discounts</h1>
        <Link href="/admin/discounts/new" className="btn btn-primary">
          + 할인 등록
        </Link>
      </div>

      <div className="sr-block card mb-4">
        <div className="card-body">
          <form method="get" className="row g-3 align-items-end">
            <div className="col-lg-4">
              <label htmlFor="discount-q" className="form-label small text-muted mb-1">
                검색
              </label>
              <div className="input-group">
                <input
                  id="discount-q"
                  name="q"
                  type="search"
                  className="form-control"
                  placeholder="브랜드명·할인 제목"
                  defaultValue={q}
                />
                <button type="submit" className="btn btn-dark">
                  검색
                </button>
              </div>
            </div>

            <div className="col-md-3 col-lg-2">
              <label htmlFor="discount-brand" className="form-label small text-muted mb-1">
                브랜드
              </label>
              <select
                id="discount-brand"
                name="brand"
                className="form-select"
                defaultValue={brandSlug}
              >
                <option value="">브랜드 전체</option>
                {brandOptions.map((brand) => (
                  <option key={brand.id} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3 col-lg-2">
              <label htmlFor="discount-sort" className="form-label small text-muted mb-1">
                정렬
              </label>
              <select
                id="discount-sort"
                name="sort"
                className="form-select"
                defaultValue={sort}
              >
                {DISCOUNT_SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 col-lg-4 d-flex gap-2">
              <button type="submit" className="btn btn-outline-primary">
                필터 적용
              </button>
              <Link href="/admin/discounts" className="btn btn-outline-secondary">
                초기화
              </Link>
            </div>
          </form>
        </div>
      </div>

      {discounts.length === 0 ? (
        <div className="sr-block card">
          <div className="card-body py-5 text-center text-muted">
            조건에 맞는 할인이 없습니다. 검색어·브랜드·정렬 조건을 바꾸거나 초기화해
            보세요.
          </div>
        </div>
      ) : (
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
          rowKeys={discounts.map((discount) => discount.id)}
          rows={rows}
        />
      )}
    </>
  );
}
