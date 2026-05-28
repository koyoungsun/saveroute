"use server";

import { revalidatePath } from "next/cache";

import {
  isProfileAgeGroup,
  isProfileGender,
} from "@/lib/profile/demographics";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeNickname(raw: string) {
  const s = raw.trim();
  return s.length === 0 ? null : s.slice(0, 40);
}

export async function updateNicknameAction(_prev: unknown, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "로그인이 필요합니다." };
  }

  const nickname = normalizeNickname(String(formData.get("nickname") ?? ""));
  const { error } = await supabase
    .from("profiles")
    .update({
      nickname,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/settings");
  return { ok: true as const, message: "닉네임이 저장되었습니다." };
}

export async function updateConsentAction(_prev: unknown, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "로그인이 필요합니다." };
  }

  const allowSearchStats = formData.get("allow_search_stats") === "on";
  const allowPersonalizedRecommendations =
    formData.get("allow_personalized_recommendations") === "on";
  const allowMarketingNotifications =
    formData.get("allow_marketing_notifications") === "on";

  const { error } = await supabase
    .from("profiles")
    .update({
      allow_search_stats: allowSearchStats,
      allow_personalized_recommendations: allowPersonalizedRecommendations,
      allow_marketing_notifications: allowMarketingNotifications,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/settings");
  return { ok: true as const, message: "설정이 저장되었습니다." };
}

export async function updateDemographicsAction(_prev: unknown, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "로그인이 필요합니다." };
  }

  const genderRaw = String(formData.get("gender") ?? "none");
  const ageRaw = String(formData.get("age_group") ?? "none");

  const gender = isProfileGender(genderRaw) ? genderRaw : null;
  const age_group = isProfileAgeGroup(ageRaw) ? ageRaw : null;
  const gender_group =
    gender === "male" || gender === "female" || gender === "other" ? gender : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      gender,
      gender_group,
      age_group,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  revalidatePath("/mypage");
  revalidatePath("/mypage/settings");
  return { ok: true as const, message: "통계 세그먼트가 저장되었습니다." };
}
