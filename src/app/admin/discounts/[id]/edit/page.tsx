import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadDiscountBenefitProductIdsByDiscountId } from "@/lib/admin/discount-benefit-product-links";

import { DiscountEditMeta } from "../../DiscountEditMeta";
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
        apply_basis,
        stackable_policy,
        usage_channel,
        notice_text,
        installment_condition,
        discount_value,
        discount_value_max,
        condition_amount,
        max_discount_amount,
        discount_unit,
        valid_from,
        valid_until,
        source_url,
        admin_memo,
        created_at,
        updated_at,
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
        "id,name,benefit_category_id,provider_id,benefit_type,is_all_product,product_type,grade,code,name_normalized",
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
      <div className="d-flex justify-content-end mb-3">
        <Link href="/admin/discounts" className="btn btn-outline-secondary sr-discounts-action-btn">
          목록으로
        </Link>
      </div>

      <DiscountEditMeta
        createdAt={discountWithLinks.created_at}
        updatedAt={discountWithLinks.updated_at}
      />

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
