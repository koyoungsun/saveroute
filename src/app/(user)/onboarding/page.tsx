import { redirect } from "next/navigation";

import { BenefitsPicker } from "@/components/benefits/BenefitsPicker";
import { UserPage } from "@/components/layout/UserPage";
import {
  countActiveUserBenefits,
  loadBenefitsRegistrationData,
} from "@/lib/benefits/load-registration-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login?redirect=/onboarding");
  }

  const userId = user.id;

  const existingCount = await countActiveUserBenefits(supabase, userId);
  if (existingCount > 0) {
    redirect("/");
  }

  const payload = await loadBenefitsRegistrationData(supabase, userId);

  return (
    <UserPage withBottomDock className="sr-user-stack">
      <h1 className="text-center text-lg font-bold leading-snug text-gray-900 min-[431px]:text-xl">
        보유 혜택을 빠르게 등록해 주세요
      </h1>
      <p className="text-center text-xs leading-relaxed text-gray-500 min-[431px]:text-sm">
        통신사 하나와 자주 쓰는 카드를 고르면 됩니다. 상세 입력 없이 바로 시작할 수 있어요.
      </p>

      <BenefitsPicker mode="onboarding" payload={payload} />
    </UserPage>
  );
}
