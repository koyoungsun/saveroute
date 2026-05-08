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

export default async function NewDiscountPage() {
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
      .select("id,name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("providers")
      .select("id,name,benefit_category_id")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("benefit_products")
      .select("id,name,benefit_category_id,provider_id")
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">New Discount</h1>
          <p className="text-muted mb-0">
            브랜드를 선택하고 할인 기본 정보를 입력합니다.
          </p>
        </div>
        <Link href="/admin/discounts" className="btn btn-outline-secondary">
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
