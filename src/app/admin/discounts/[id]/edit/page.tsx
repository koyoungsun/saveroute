import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadDiscountBenefitProductIdsByDiscountId } from "@/lib/admin/discount-benefit-product-links";

import { EditDiscountForm, type DiscountEditValues } from "./EditDiscountForm";

type EditDiscountPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function EditDiscountPage({
  params,
}: EditDiscountPageProps) {
  const { id } = await params;
  const discountId = Number(id);

  if (!Number.isInteger(discountId) || discountId <= 0) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: discountData, error: discountError },
    { data: brandData, error: brandError },
    { data: categoryData, error: categoryError },
    { data: providerData, error: providerError },
    { data: productData, error: productError },
  ] = await Promise.all([
    supabase
      .from("discounts")
      .select(
        `
        id,
        brand_id,
        benefit_category_id,
        provider_id,
        benefit_product_id,
        title,
        condition_text,
        installment_condition,
        discount_value,
        discount_unit,
        valid_from,
        valid_until,
        source_url,
        status
      `,
      )
      .eq("id", discountId)
      .maybeSingle(),
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
        "id,name,benefit_category_id,provider_id,benefit_type,is_all_product,product_type,grade",
      )
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (discountError) {
    throw new Error(`Failed to load discount: ${discountError.message}`);
  }

  if (!discountData) {
    notFound();
  }

  const loadError = brandError ?? categoryError ?? providerError ?? productError;
  if (loadError) {
    throw new Error(`Failed to load discount form data: ${loadError.message}`);
  }

  const discount = discountData as DiscountEditValues;
  const linkedProductIdsByDiscount = await loadDiscountBenefitProductIdsByDiscountId(
    supabase,
    [discountId],
  );
  const linkedProductIds = linkedProductIdsByDiscount.get(discountId) ?? [];
  const discountWithLinks: DiscountEditValues = {
    ...discount,
    benefit_product_ids:
      linkedProductIds.length > 0
        ? linkedProductIds
        : discount.benefit_product_id != null
          ? [discount.benefit_product_id]
          : [],
  };
  const brands = (brandData ?? []) as BrandOption[];
  const categories = (categoryData ?? []) as BenefitCategoryOption[];
  const providers = (providerData ?? []) as ProviderOption[];
  const products = (productData ?? []) as BenefitProductOption[];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Edit Discount</h1>
          <p className="text-muted mb-0">
            실제 discounts 테이블 컬럼 기준으로 할인 정보를 수정합니다.
          </p>
        </div>
        <Link href="/admin/discounts" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      <EditDiscountForm
        discount={discountWithLinks}
        brands={brands}
        categories={categories}
        providers={providers}
        products={products}
      />
    </>
  );
}
