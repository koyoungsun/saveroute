import Link from "next/link";
import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { ProviderForm, type ProviderFormValues } from "../../ProviderForm";
import { updateProviderAction } from "./actions";
import type { ProviderType } from "../../form-shared";

type EditProviderPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BenefitCategoryOption = {
  id: number;
  name: string;
  code: string;
};

export default async function EditProviderPage({ params }: EditProviderPageProps) {
  const { id } = await params;
  const providerId = Number(id);

  if (!Number.isInteger(providerId) || providerId <= 0) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [
    { data: providerData, error: providerError },
    { data: categoryData, error: categoryError },
  ] = await Promise.all([
    supabase
      .from("providers")
      .select(
        `
        id,
        name,
        code,
        benefit_category_id,
        provider_type,
        official_url,
        logo_url,
        display_order,
        memo,
        is_active
      `,
      )
      .eq("id", providerId)
      .maybeSingle(),
    supabase
      .from("benefit_categories")
      .select("id,name,code")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  if (providerError) {
    throw new Error(`Failed to load provider: ${providerError.message}`);
  }

  if (!providerData) {
    notFound();
  }

  if (categoryError) {
    throw new Error(`Failed to load benefit categories: ${categoryError.message}`);
  }

  const categories = (categoryData ?? []) as BenefitCategoryOption[];
  const membershipCategoryId =
    categories.find((category) => category.code === "membership")?.id ?? null;
  const currentCategoryId = providerData.benefit_category_id as number;
  const hasCurrentCategory = categories.some(
    (category) => category.id === currentCategoryId,
  );

  if (!hasCurrentCategory) {
    const { data: currentCategory } = await supabase
      .from("benefit_categories")
      .select("id,name,code")
      .eq("id", currentCategoryId)
      .maybeSingle();

    if (currentCategory) {
      categories.unshift(currentCategory as BenefitCategoryOption);
    }
  }

  const initialValues: ProviderFormValues = {
    id: providerData.id,
    name: providerData.name,
    code: providerData.code,
    benefit_category_id: providerData.benefit_category_id,
    provider_type: providerData.provider_type as ProviderType,
    official_url: providerData.official_url,
    logo_url: providerData.logo_url,
    display_order: providerData.display_order ?? 500,
    memo: providerData.memo,
    is_active: providerData.is_active,
  };

  const updateAction = updateProviderAction.bind(null, providerId);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Edit Provider</h1>
          <p className="text-muted mb-0">
            providers 테이블 컬럼 기준으로 제공사 정보를 수정합니다.
          </p>
        </div>
        <Link href="/admin/providers" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      <ProviderForm
        action={updateAction}
        categories={categories}
        membershipCategoryId={membershipCategoryId}
        initialValues={initialValues}
        mode="edit"
      />
    </>
  );
}
