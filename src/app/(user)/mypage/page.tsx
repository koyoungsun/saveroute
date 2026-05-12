import { redirect } from "next/navigation";

import MyPageClient from "./MyPageClient";
import type { MyPageProfilePayload } from "./types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const CARD_TYPES = new Set(["credit_card", "debit_card", "prepaid_card"]);
const TELECOM_TYPES = new Set(["telecom_membership", "telecom_mvno_plan"]);

export default async function MyPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?redirect=%2Fmypage");
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    profileResult,
    benefitsResult,
    searchCountResult,
    requestEventsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "nickname, created_at, gender_group, age_group, allow_search_stats, allow_personalized_recommendations, allow_marketing_notifications",
      )
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_benefits")
      .select("benefit_product_id")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("search_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", thirtyDaysAgo.toISOString()),
    supabase
      .from("user_brand_request_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const profile = profileResult.data;

  if (profileResult.error || !profile) {
    throw new Error(
      profileResult.error?.message ??
        "profiles 행을 불러오지 못했습니다. 마이그레이션 적용 여부를 확인하세요.",
    );
  }

  const benefitRows = benefitsResult.data ?? [];
  const registeredBenefitCount = benefitRows.length;

  const productIds = [
    ...new Set(
      benefitRows
        .map((r) => r.benefit_product_id)
        .filter((id): id is number => typeof id === "number" && id > 0),
    ),
  ];

  let registeredCardCount = 0;
  let registeredTelecomCount = 0;

  if (productIds.length > 0 && !benefitsResult.error) {
    const { data: products } = await supabase
      .from("benefit_products")
      .select("id, product_type")
      .in("id", productIds);

    const productTypeById = new Map(
      (products ?? []).map((p) => [p.id as number, p.product_type as string]),
    );

    for (const row of benefitRows) {
      const pid = row.benefit_product_id;
      if (pid == null) continue;
      const pt = productTypeById.get(pid);
      if (!pt) continue;
      if (CARD_TYPES.has(pt)) registeredCardCount += 1;
      if (TELECOM_TYPES.has(pt)) registeredTelecomCount += 1;
    }
  }

  const recentSearchCount =
    !searchCountResult.error ? (searchCountResult.count ?? 0) : 0;

  const brandRequestParticipationCount =
    !requestEventsResult.error ? (requestEventsResult.count ?? 0) : 0;

  const payload: MyPageProfilePayload = {
    email: user.email ?? "",
    nickname: profile.nickname,
    createdAt: profile.created_at,
    genderGroup: profile.gender_group,
    ageGroup: profile.age_group,
    allowSearchStats: profile.allow_search_stats ?? true,
    allowPersonalizedRecommendations:
      profile.allow_personalized_recommendations ?? true,
    allowMarketingNotifications: profile.allow_marketing_notifications ?? false,
    registeredBenefitCount,
    registeredCardCount,
    registeredTelecomCount,
    recentSearchCount,
    brandRequestParticipationCount,
  };

  const loadWarnings: string[] = [];
  if (benefitsResult.error) {
    loadWarnings.push(`보유혜택 로드 경고: ${benefitsResult.error.message}`);
  }
  if (searchCountResult.error) {
    loadWarnings.push(`최근 검색 수 로드 경고: ${searchCountResult.error.message}`);
  }
  if (requestEventsResult.error) {
    loadWarnings.push(
      `업데이트 요청 참여 로드 경고: ${requestEventsResult.error.message}`,
    );
  }

  return (
    <MyPageClient profile={payload} loadWarnings={loadWarnings} />
  );
}
