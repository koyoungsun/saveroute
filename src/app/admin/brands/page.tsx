import Link from "next/link";

import { BrandFavicon } from "@/components/brand/BrandFavicon";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BRAND_STATUS_FILTER_OPTIONS } from "@/lib/ui/format-status-label";

import { deactivateBrandAction } from "./actions";

type BrandRow = {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  admin_memo: string | null;
  official_url: string | null;
  aliases: string[] | null;
  brand_categories: { name: string } | { name: string }[] | null;
};

type BrandCategoryRow = {
  id: number;
  name: string;
};

function getCategoryName(category: BrandRow["brand_categories"]) {
  if (Array.isArray(category)) {
    return category[0]?.name ?? "-";
  }

  return category?.name ?? "-";
}

export default async function AdminBrandsPage() {
  const supabase = createSupabaseAdminClient();
  const [{ data: brandsData, error: brandsError }, { data: categoriesData }] =
    await Promise.all([
      supabase
        .from("brands")
        .select(
          "id,name,slug,aliases,is_active,admin_memo,official_url,brand_categories(name)",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("brand_categories")
        .select("id,name")
        .order("sort_order", { ascending: true }),
    ]);

  if (brandsError) {
    throw new Error(`Failed to load brands: ${brandsError.message}`);
  }

  const brands = (brandsData ?? []) as BrandRow[];
  const categories = (categoriesData ?? []) as BrandCategoryRow[];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Brands</h1>
        <Link href="/admin/brands/new" className="btn btn-primary">
          + 브랜드 등록
        </Link>
      </div>

      <div className="sr-block card">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <input className="form-control" placeholder="브랜드명/slug/별칭" />
            </div>
            <div className="col-md-3">
              <select className="form-select" defaultValue="">
                <option value="">카테고리 전체</option>
                {categories.map((category) => (
                  <option key={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" defaultValue="">
                <option value="">상태 전체</option>
                {BRAND_STATUS_FILTER_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <PaginatedTable
        title="브랜드 목록"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "브랜드명" },
          { header: "slug" },
          { header: "카테고리" },
          { header: "별칭" },
          { header: "설명" },
          { header: "웹사이트" },
          { header: "상태" },
          { header: "관리" },
        ]}
        rowKeys={brands.map((brand) => brand.id)}
        rows={brands.map((brand) => [
          <div
            key={`${brand.id}-name`}
            className="d-inline-flex align-items-center gap-2 text-start"
          >
            <BrandFavicon
              brandName={brand.name}
              officialUrl={brand.official_url}
              size={28}
            />
            <span>{brand.name}</span>
          </div>,
          brand.slug,
          getCategoryName(brand.brand_categories),
          brand.aliases?.length ? brand.aliases.join(", ") : "-",
          brand.admin_memo ?? "-",
          brand.official_url ? (
            <a
              key={`${brand.id}-url`}
              href={brand.official_url}
              target="_blank"
              rel="noreferrer"
            >
              열기
            </a>
          ) : (
            "-"
          ),
          <StatusBadge
            key={`${brand.id}-status`}
            status={brand.is_active ? "active" : "hidden"}
          />,
          <div key={`${brand.id}-actions`} className="d-flex gap-2">
            <Link
              href={`/admin/brands/${brand.id}/edit`}
              className="btn btn-outline-secondary btn-sm"
            >
              수정
            </Link>
            <form action={deactivateBrandAction}>
              <input type="hidden" name="brand_id" value={brand.id} />
              <button
                type="submit"
                className="btn btn-outline-danger btn-sm"
                disabled={!brand.is_active}
              >
                숨김
              </button>
            </form>
          </div>,
        ])}
      />
    </>
  );
}
