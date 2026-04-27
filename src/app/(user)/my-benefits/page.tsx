import { BenefitForm } from "@/components/benefits/BenefitForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function MyBenefitsPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/auth/login?redirect=%2Fmy-benefits");
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">내 혜택 설정</h1>
      <div className="mt-4">
        <BenefitForm />
      </div>
    </div>
  );
}
