import { BenefitForm } from "@/components/benefits/BenefitForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MyBenefitsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    redirect("/auth/login?redirect=%2Fmy-benefits");
  }

  const userId = sessionData.session.user.id;

  const [{ data: providers }, { data: benefitProducts }, { data: userBenefits }] =
    await Promise.all([
      supabase
        .from("providers")
        .select("id,name,category,provider_type,active,is_active")
        .or("active.eq.true,is_active.eq.true"),
      supabase
        .from("benefit_products")
        .select("id,provider_id,name,card_type,active,is_active")
        .or("active.eq.true,is_active.eq.true"),
      supabase
        .from("user_benefits")
        .select("id,category,provider_id,benefit_product_id")
        .eq("user_id", userId),
    ]);

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">내 혜택 설정</h1>
      <div className="mt-4">
        <BenefitForm
          providers={providers ?? []}
          benefitProducts={benefitProducts ?? []}
          initialUserBenefits={userBenefits ?? []}
        />
      </div>
    </div>
  );
}
