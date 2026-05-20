import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { BenefitProductForm } from "../BenefitProductForm";
import { createBenefitProductAction } from "../form-actions";

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

export default async function NewBenefitProductPage() {
  const supabase = createSupabaseAdminClient();
  const [
    { data: categoryData, error: categoryError },
    { data: providerData, error: providerError },
  ] = await Promise.all([
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
  ]);

  const loadError = categoryError ?? providerError;
  if (loadError) {
    throw new Error(
      `Failed to load benefit product form data: ${loadError.message}`,
    );
  }

  const categories = (categoryData ?? []) as BenefitCategoryOption[];
  const providers = (providerData ?? []) as ProviderOption[];
  const cardCategoryId =
    categories.find((category) => category.code === "card")?.id ?? null;
  const membershipCategoryId =
    categories.find((category) => category.code === "membership")?.id ?? null;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">New Benefit Product</h1>
          <p className="text-muted mb-0">
            혜택 카테고리와 제공사에 연결할 상품 정보를 입력합니다.
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
        action={createBenefitProductAction}
        categories={categories}
        providers={providers}
        cardCategoryId={cardCategoryId}
        membershipCategoryId={membershipCategoryId}
        mode="create"
      />
    </>
  );
}
