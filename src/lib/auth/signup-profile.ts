import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isProfileAgeGroup,
  isProfileGender,
  type ProfileAgeGroup,
  type ProfileGender,
} from "@/lib/profile/demographics";

export type SignupProfileInput = {
  nickname: string;
  gender: ProfileGender;
  ageGroup: ProfileAgeGroup;
  allowSearchStats: boolean;
  allowPersonalizedRecommendations: boolean;
  allowMarketingNotifications: boolean;
};

export function buildSignupUserMetadata(input: SignupProfileInput) {
  return {
    nickname: input.nickname.trim(),
    gender: input.gender,
    age_group: input.ageGroup,
    allow_search_stats: input.allowSearchStats,
    allow_personalized_recommendations: input.allowPersonalizedRecommendations,
    allow_marketing_notifications: input.allowMarketingNotifications,
  };
}

export async function upsertSignupProfile(
  supabase: SupabaseClient,
  userId: string,
  input: SignupProfileInput,
) {
  const nickname = input.nickname.trim().slice(0, 40) || null;
  const gender_group =
    input.gender === "male" || input.gender === "female" || input.gender === "other"
      ? input.gender
      : null;

  return supabase
    .from("profiles")
    .update({
      nickname,
      gender: input.gender,
      gender_group,
      age_group: input.ageGroup,
      allow_search_stats: input.allowSearchStats,
      allow_personalized_recommendations: input.allowPersonalizedRecommendations,
      allow_marketing_notifications: input.allowMarketingNotifications,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export function validateSignupProfileFields(input: {
  nickname: string;
  gender: string;
  ageGroup: string;
}): { ok: true; value: SignupProfileInput } | { ok: false; message: string } {
  const nickname = input.nickname.trim();
  if (!nickname) {
    return { ok: false, message: "* 닉네임을 입력해주세요." };
  }

  if (!isProfileGender(input.gender)) {
    return { ok: false, message: "* 성별을 선택해주세요." };
  }

  if (!isProfileAgeGroup(input.ageGroup)) {
    return { ok: false, message: "* 연령대를 선택해주세요." };
  }

  return {
    ok: true,
    value: {
      nickname,
      gender: input.gender,
      ageGroup: input.ageGroup,
      allowSearchStats: false,
      allowPersonalizedRecommendations: false,
      allowMarketingNotifications: false,
    },
  };
}
