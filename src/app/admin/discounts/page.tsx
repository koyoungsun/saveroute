import Link from "next/link";

import { ConfidenceBadge } from "@/components/admin/ConfidenceBadge";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { loadDiscountBenefitProductIdsByDiscountId } from "@/lib/admin/discount-benefit-product-links";
import {
  DISCOUNT_SORT_OPTIONS,
  escapeIlikePattern,
  formatAdminDiscountTimestamp,
  getDiscountBrandMeta,
  getDiscountBenefitCategoryLabel,
  getDiscountRelationName,
  parseDiscountListQuery,
  sortDiscountListRows,
  type DiscountListRow,
} from "@/lib/admin/discount-list-query";
import { formatUsageChannelLabel } from "@/lib/discounts/discount-detail-fields";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatAdminDiscountListValue } from "@/lib/ui/format-money";

import { hideDiscountAction } from "./actions";
import { DiscountBenefitProductsCell } from "./DiscountBenefitProductsCell";

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

function formatUsageLabel(discount: DiscountListRow) {
  return (
    formatUsageChannelLabel(discount.usage_channel) ??
    formatUsageType(discount.usage_type)
  );
}

const TEXT_COLUMN_CLASS = "text-start";

function clipCellText(text: string, lines: 1 | 2 = 1) {
  return (
    <span
      className={lines === 1 ? "sr-admin-discounts-clip-1" : "sr-admin-discounts-clip-2"}
      title={text}
    >
      {text}
    </span>
  );
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
          discount_value_max,
          discount_unit,
          usage_type,
          usage_channel,
          status,
          data_confidence,
          valid_until,
          created_at,
          updated_at,
          brand:brands(name,slug),
          benefit_category:benefit_categories(name,code),
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

  const discountIds = discounts.map((discount) => discount.id);
  const linkedProductIdsByDiscount = await loadDiscountBenefitProductIdsByDiscountId(
    supabase,
    discountIds,
  );

  const linkedProductIdSet = new Set<number>();
  for (const discount of discounts) {
    const junctionIds = linkedProductIdsByDiscount.get(discount.id) ?? [];
    if (junctionIds.length > 0) {
      for (const id of junctionIds) {
        linkedProductIdSet.add(id);
      }
    }
  }

  const productNameById = new Map<number, string>();
  if (linkedProductIdSet.size > 0) {
    const { data: linkedProducts, error: linkedProductsError } = await supabase
      .from("benefit_products")
      .select("id,name")
      .in("id", [...linkedProductIdSet]);

    if (linkedProductsError) {
      throw new Error(
        `Failed to load linked benefit products: ${linkedProductsError.message}`,
      );
    }

    for (const row of linkedProducts ?? []) {
      productNameById.set(row.id as number, row.name as string);
    }
  }

  const rows = discounts.map((discount) => {
    const key = `${discount.id}-${discount.title}`;
    const junctionIds = linkedProductIdsByDiscount.get(discount.id) ?? [];
    const linkedNames =
      junctionIds.length > 0
        ? junctionIds
            .map((id) => productNameById.get(id))
            .filter((name): name is string => typeof name === "string")
        : [getDiscountRelationName(discount.benefit_product)].filter(
            (name) => name !== "-",
          );

    return [
      clipCellText(getDiscountBrandMeta(discount).name),
      clipCellText(discount.title, 2),
      getDiscountBenefitCategoryLabel(discount.benefit_category),
      clipCellText(getDiscountRelationName(discount.provider)),
      <DiscountBenefitProductsCell key={`${key}-products`} names={linkedNames} />,
      formatAdminDiscountListValue(
        discount.discount_value,
        discount.discount_unit,
        discount.discount_value_max,
      ),
      formatUsageLabel(discount),
      formatAdminDiscountTimestamp(discount.created_at),
      formatAdminDiscountTimestamp(discount.updated_at),
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
      <div className="sr-admin-discounts-header d-flex justify-content-between align-items-center">
        <div>
          <h1 className="admin-page-title">할인 관리</h1>
          <p className="admin-page-intro mb-0">브랜드별 할인 정보를 등록·수정·검수하세요.</p>
        </div>
        <Link href="/admin/discounts/new" className="btn btn-primary">
          + 할인 등록
        </Link>
      </div>

      <div className="sr-block card mb-4">
        <div className="card-body">
          <form method="get" className="sr-admin-discounts-toolbar">
            <div className="sr-admin-discounts-toolbar__search">
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

            <div className="sr-admin-discounts-toolbar__brand">
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

            <div className="sr-admin-discounts-toolbar__sort">
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

            <div className="sr-admin-discounts-toolbar__actions">
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
          titleClassName="admin-card-title"
          legendType="discount"
          pageSize={10}
          fixedRows={10}
          className="sr-block sr-admin-discounts-list"
          columns={[
            { header: "브랜드", className: TEXT_COLUMN_CLASS },
            { header: "제목", className: TEXT_COLUMN_CLASS },
            { header: "카테고리" },
            { header: "제공사", className: TEXT_COLUMN_CLASS },
            { header: "혜택상품", className: TEXT_COLUMN_CLASS },
            { header: "할인값" },
            { header: "채널" },
            { header: "작성일" },
            { header: "수정일" },
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
