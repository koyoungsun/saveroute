import { redirect } from "next/navigation";

import { BenefitsPicker } from "@/components/benefits/BenefitsPicker";
import { loadBenefitsRegistrationData } from "@/lib/benefits/load-registration-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MyBenefitsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    redirect("/auth/login?redirect=/my-benefits");
  }

  const userId = sessionData.session.user.id;
  const payload = await loadBenefitsRegistrationData(supabase, userId);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 pb-28 md:max-w-xl md:py-10 md:pb-12">
      <header className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#409A53]">My Benefits</p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-gray-950">내 혜택</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          내 혜택을 등록하면 검색 결과에서 받을 수 있는 할인을 먼저 보여드려요.
        </p>
      </header>

      <BenefitsPicker mode="my-benefits" payload={payload} />
    </div>
  );
}
