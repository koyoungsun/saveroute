import { redirect } from "next/navigation";

import { BenefitsPicker } from "@/components/benefits/BenefitsPicker";
import { BrandHubChrome } from "@/components/layout/BrandHubChrome";
import { UserPage } from "@/components/layout/UserPage";
import { loadBenefitsRegistrationData } from "@/lib/benefits/load-registration-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MyBenefitsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login?redirect=/my-benefits");
  }

  const payload = await loadBenefitsRegistrationData(supabase, user.id);

  return (
    <UserPage className="sr-user-account-page sr-user-stack">
      <BrandHubChrome variant="account" />

      <div className="sr-user-account-page__body">
        <header className="sr-user-account-page__intro">
          <p className="sr-user-account-page__eyebrow">내 혜택</p>
          <h1 className="sr-user-account-page__title">혜택 관리</h1>
          <p className="sr-user-account-page__description">
            등록한 혜택으로 맞춤 할인 결과를 확인하세요.
          </p>
        </header>

        <BenefitsPicker mode="my-benefits" payload={payload} />
      </div>
    </UserPage>
  );
}
