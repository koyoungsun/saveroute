import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/auth/login?redirect=/onboarding");
  }

  return (
    <main className="mx-auto min-h-screen max-w-[430px] px-4 py-8">
      <h1 className="text-center text-lg font-bold leading-snug text-gray-900">
        서비스 이용을 위해 몇 가지만 선택해주세요
      </h1>

      <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <OnboardingForm />
      </div>
    </main>
  );
}
