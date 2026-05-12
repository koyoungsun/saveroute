import { redirect } from "next/navigation";

import { BenefitsPicker } from "@/components/benefits/BenefitsPicker";
import {
  countActiveUserBenefits,
  loadBenefitsRegistrationData,
} from "@/lib/benefits/load-registration-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/auth/login?redirect=/onboarding");
  }

  const userId = data.session.user.id;

  const existingCount = await countActiveUserBenefits(supabase, userId);
  if (existingCount > 0) {
    redirect("/");
  }

  const payload = await loadBenefitsRegistrationData(supabase, userId);

  return (
    <main className="mx-auto min-h-screen max-w-lg px-4 py-6 pb-28 md:max-w-xl md:py-10">
      <h1 className="text-center text-lg font-bold leading-snug text-gray-900">
        보유 혜택을 빠르게 등록해 주세요
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-center text-xs leading-relaxed text-gray-500">
        통신사 하나와 자주 쓰는 카드를 고르면 됩니다. 상세 입력 없이 바로 시작할 수 있어요.
      </p>

      <div className="mt-8">
        <BenefitsPicker mode="onboarding" payload={payload} />
      </div>
    </main>
  );
}
