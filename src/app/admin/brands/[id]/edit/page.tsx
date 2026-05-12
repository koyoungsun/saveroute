import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { EditBrandForm, type BrandEditValues } from "./EditBrandForm";

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
        is_active
      `,
      )
      .eq("id", brandId)
      .maybeSingle(),
    supabase
      .from("brand_categories")
      .select("id,name")
      .order("sort_order", { ascending: true }),
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

  const brand = brandData as BrandEditValues;
  const categories = (categoryData ?? []) as BrandCategoryOption[];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Edit Brand</h1>
          <p className="text-muted mb-0">
            실제 brands 테이블 컬럼 기준으로 브랜드 정보를 수정합니다.
          </p>
        </div>
        <Link href="/admin/brands" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      <EditBrandForm brand={brand} categories={categories} />
    </>
  );
}
