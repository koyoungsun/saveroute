import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { DiscountForm } from "./DiscountForm";

type BrandOption = {
  id: number;
  name: string;
  slug: string;
};

type BenefitCategoryOption = {
  id: number;
  name: string;
  code: string;
};

type ProviderOption = {
  id: number;
  name: string;
  benefit_category_id: number;
};

type BenefitProductOption = {
  id: number;
  name: string;
  benefit_category_id: number;
  provider_id: number;
};

export async function NewDiscountPageContent() {
  const supabase = createSupabaseAdminClient();
  const [
    { data: brandData, error: brandError },
    { data: categoryData, error: categoryError },
    { data: providerData, error: providerError },
    { data: productData, error: productError },
  ] = await Promise.all([
    supabase
      .from("brands")
      .select("id,name,slug")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("benefit_categories")
      .select("id,name,code")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("providers")
      .select("id,name,benefit_category_id")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("benefit_products")
      .select(
        "id,name,benefit_category_id,provider_id,benefit_type,is_all_product,product_type,grade,code,name_normalized",
      )
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const loadError = brandError ?? categoryError ?? providerError ?? productError;
  if (loadError) {
    throw new Error(`Failed to load discount form data: ${loadError.message}`);
  }

  const brands = (brandData ?? []) as BrandOption[];
  const categories = (categoryData ?? []) as BenefitCategoryOption[];
  const providers = (providerData ?? []) as ProviderOption[];
  const products = (productData ?? []) as BenefitProductOption[];

  return (
    <>
      <div className="sr-admin-discounts-header admin-page-header d-flex justify-content-between align-items-start gap-3">
        <div>
          <h1 className="admin-page-title">할인 등록</h1>
          <p className="admin-page-intro mb-0">
            브랜드를 선택하고 할인·혜택 정보를 입력합니다.
          </p>
        </div>
        <Link href="/admin/discounts" className="btn btn-outline-secondary sr-discounts-action-btn">
          목록으로
        </Link>
      </div>

      <DiscountForm
        brands={brands}
        categories={categories}
        providers={providers}
        products={products}
      />
    </>
  );
}
