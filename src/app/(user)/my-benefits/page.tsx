import { redirect } from "next/navigation";

import {
  BenefitForm,
  type BenefitCategoryOption,
  type BenefitProductOption,
  type ProviderOption,
  type RegisteredUserBenefit,
} from "@/components/benefits/BenefitForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MyBenefitsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    redirect("/auth/login?redirect=/my-benefits");
  }

  const userId = sessionData.session.user.id;

  const [
    { data: categories, error: categoryError },
    { data: providers, error: providerError },
    { data: benefitProducts, error: productError },
    { data: userBenefits, error: userBenefitError },
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
    supabase
      .from("benefit_products")
      .select("id,name,benefit_category_id,provider_id")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("user_benefits")
      .select(
        `
        id,
        benefit_category_id,
        provider_id,
        benefit_product_id,
        created_at,
        benefit_category:benefit_categories(name),
        provider:providers(name),
        benefit_product:benefit_products(name)
      `,
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
  ]);

  const loadError =
    categoryError ?? providerError ?? productError ?? userBenefitError;
  if (loadError) {
    throw new Error(`Failed to load user benefits: ${loadError.message}`);
  }

  return (
    <div className="px-4 py-6">
      <div>
        <h1 className="text-xl font-extrabold text-gray-950">내 혜택 설정</h1>
        <p className="mt-1 text-sm text-gray-500">
          보유 혜택을 등록하면 검색 결과에서 매칭되는 할인을 먼저 보여드려요.
        </p>
      </div>
      <div className="mt-5">
        <BenefitForm
          categories={(categories ?? []) as BenefitCategoryOption[]}
          providers={(providers ?? []) as ProviderOption[]}
          benefitProducts={(benefitProducts ?? []) as BenefitProductOption[]}
          userBenefits={(userBenefits ?? []) as RegisteredUserBenefit[]}
        />
      </div>
    </div>
  );
}
