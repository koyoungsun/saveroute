import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import {
  BenefitProductForm,
  type BenefitProductFormValues,
} from "../../BenefitProductForm";
import { updateBenefitProductAction } from "../../form-actions";

type EditBenefitProductPageProps = {
  params: Promise<{
    id: string;
  }>;
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

export default async function EditBenefitProductPage({
  params,
}: EditBenefitProductPageProps) {
  const { id } = await params;
  const benefitProductId = Number(id);

  if (!Number.isInteger(benefitProductId) || benefitProductId <= 0) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: productData, error: productError },
    { data: categoryData, error: categoryError },
    { data: providerData, error: providerError },
  ] = await Promise.all([
    supabase
      .from("benefit_products")
      .select(
        `
        id,
        benefit_category_id,
        provider_id,
        name,
        is_active,
        is_mvno,
        mvno_notice_required
      `,
      )
      .eq("id", benefitProductId)
      .maybeSingle(),
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
  ]);

  if (productError) {
    throw new Error(`Failed to load benefit product: ${productError.message}`);
  }

  if (!productData) {
    notFound();
  }

  const loadError = categoryError ?? providerError;
  if (loadError) {
    throw new Error(
      `Failed to load benefit product form data: ${loadError.message}`,
    );
  }

  const benefitProduct = productData as BenefitProductFormValues;
  const categories = (categoryData ?? []) as BenefitCategoryOption[];
  const providers = (providerData ?? []) as ProviderOption[];
  const updateAction = updateBenefitProductAction.bind(null, benefitProduct.id);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Edit Benefit Product</h1>
          <p className="text-muted mb-0">
            실제 benefit_products 컬럼 기준으로 상품 정보를 수정합니다.
          </p>
        </div>
        <Link
          href="/admin/benefit-products"
          className="btn btn-outline-secondary"
        >
          목록으로
        </Link>
      </div>

      <BenefitProductForm
        action={updateAction}
        categories={categories}
        providers={providers}
        initialValues={benefitProduct}
        mode="edit"
      />
    </>
  );
}
