import Link from "next/link";
import { notFound } from "next/navigation";

import { BrandDiscountCountBadge } from "@/components/admin/BrandDiscountCountBadge";
import { buildDiscountCountByBrandId, getBrandDiscountCount } from "@/lib/admin/brand-discount-counts";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { EditBrandForm, type BrandEditValues, type BrandPriceItem } from "./EditBrandForm";

type EditBrandPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BrandCategoryOption = {
  id: number;
  name: string;
};

export default async function EditBrandPage({ params }: EditBrandPageProps) {
  const { id } = await params;
  const brandId = Number(id);

  if (!Number.isInteger(brandId) || brandId <= 0) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: brandData, error: brandError },
    { data: categoryData, error: categoryError },
    { data: discountBrandRows, error: discountCountError },
    { data: priceItemData, error: priceItemError },
  ] = await Promise.all([
    supabase
      .from("brands")
      .select(
        `
        id,
        name,
        slug,
        category_id,
        aliases,
        admin_memo,
        official_url,
        is_active,
        has_price_board,
        price_input_mode,
        payment_apply_mode
      `,
      )
      .eq("id", brandId)
      .maybeSingle(),
    supabase
      .from("brand_categories")
      .select("id,name")
      .order("sort_order", { ascending: true }),
    supabase.from("discounts").select("brand_id,status").eq("brand_id", brandId),
    supabase
      .from("brand_price_items")
      .select("id,brand_id,label,price,sort_order,is_active,created_at")
      .eq("brand_id", brandId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (brandError) {
    throw new Error(`Failed to load brand: ${brandError.message}`);
  }

  if (!brandData) {
    notFound();
  }

  if (categoryError) {
    throw new Error(`Failed to load brand categories: ${categoryError.message}`);
  }

  if (discountCountError) {
    throw new Error(`Failed to load discount counts: ${discountCountError.message}`);
  }

  if (priceItemError) {
    throw new Error(`Failed to load brand price items: ${priceItemError.message}`);
  }

  const brand = brandData as BrandEditValues;
  const categories = (categoryData ?? []) as BrandCategoryOption[];
  const priceItems = (priceItemData ?? []) as BrandPriceItem[];
  const activeDiscountCount = getBrandDiscountCount(
    brandId,
    buildDiscountCountByBrandId(discountBrandRows ?? []),
  );

  return (
    <div className="sr-admin-brand-edit">
      <div className="d-flex justify-content-between align-items-center mb-4 sr-admin-brand-edit__header">
        <div>
          <h1 className="h3 mb-1 d-flex flex-wrap align-items-center gap-2 sr-admin-brand-edit__title">
            <span>{brand.name}</span>
            <span className="text-muted fw-normal fs-5 d-inline-flex align-items-center gap-1">
              (연결 할인 <BrandDiscountCountBadge count={activeDiscountCount} />)
            </span>
          </h1>
          <p className="text-muted mb-0">
            실제 brands 테이블 컬럼 기준으로 브랜드 정보를 수정합니다.
          </p>
        </div>
        <Link href="/admin/brands" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      <EditBrandForm brand={brand} categories={categories} priceItems={priceItems} />
    </div>
  );
}
