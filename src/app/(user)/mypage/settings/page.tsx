import { redirect } from "next/navigation";

import MySettingsClient from "./MySettingsClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MyPageSettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=%2Fmypage%2Fsettings");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "nickname, gender, gender_group, age_group, allow_search_stats, allow_personalized_recommendations, allow_marketing_notifications",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error(error?.message ?? "profiles를 불러오지 못했습니다.");
  }

  return (
    <MySettingsClient
      initial={{
        email: user.email ?? "",
        nickname: profile.nickname,
        gender: profile.gender,
        gender_group: profile.gender_group,
        age_group: profile.age_group,
        allow_search_stats: profile.allow_search_stats ?? true,
        allow_personalized_recommendations:
          profile.allow_personalized_recommendations ?? true,
        allow_marketing_notifications:
          profile.allow_marketing_notifications ?? false,
      }}
    />
  );
}
