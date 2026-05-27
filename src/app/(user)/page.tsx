import Image from "next/image";
import Link from "next/link";

import { HomeOrbitHero } from "@/components/home/HomeOrbitHero";
import { HomePromoSlotSection } from "@/components/home/HomePromoSlotSection";
import { UserPage } from "@/components/layout/UserPage";
import { RecentSearches } from "@/components/search/RecentSearches";
import { SearchHubChrome } from "@/components/search/SearchHubChrome";
import { toHomePromoSlot, type HomePromoSlotRow } from "@/lib/homePromoSlots";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SAVEROUTE_HOME_CATEGORIES } from "@/lib/user/brand-slogan";
import { SHOW_LEGACY_HOME_SECTIONS } from "@/lib/user/home-layout-flags";
import { resolveUserGreetingName } from "@/lib/user/greeting-name";

const SHOW_HOME_HERO_IMAGE = false;

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const nowIso = new Date().toISOString();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: promoSlotData, error: promoSlotError }, profileResult] =
    await Promise.all([
      supabase
        .from("promo_slots")
        .select(
          `
          id,
          title,
          description,
          badge,
          image_url,
          link_type,
          href,
          hashtags,
          starts_at,
          ends_at,
          priority,
          is_sponsored,
          sponsor_name
        `,
        )
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
        .order("priority", { ascending: false }),
      user
        ? supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  const promoSlots = promoSlotError
    ? []
    : ((promoSlotData ?? []) as HomePromoSlotRow[]).map(toHomePromoSlot);

  let displayName = "";
  if (user) {
    displayName = resolveUserGreetingName({
      nickname: profileResult.data?.nickname,
      email: user.email,
    });
  }

  return (
    <UserPage
      tone="comfortable"
      className="sr-user-stack sr-user-home-hub sr-user-home-hub--clip-x flex min-h-full flex-1 flex-col overflow-x-hidden"
    >
      {/* Legacy section: 히어로 이미지 — 추후 메인 상단 비주얼로 재배치 예정 */}
      {SHOW_HOME_HERO_IMAGE ? (
        <section className="sr-user-card--hero overflow-hidden">
          <Image
            src="/icons/main-top.png"
            alt="SaveRoute. 식당, 영화관, 놀이동산 어디든 내가 가진 최고의 할인을 찾아드려요."
            width={1024}
            height={683}
            priority
            style={{ height: "auto", width: "100%" }}
          />
        </section>
      ) : null}

      <div className="sr-user-home-hub__content sr-user-stack flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
        {/* Search-first UX: 로고 + 짧은 카피 + 검색창 + 검색 버튼 */}
        {!SHOW_LEGACY_HOME_SECTIONS ? (
          <HomeOrbitHero />
        ) : null}

        <p className="mt-2 text-center text-xs text-slate-500">
          현재 SaveRoute는 베타(준비중) 상태입니다. 일부 데이터/기능은 변경될 수 있습니다.
        </p>

        {/* Legacy section: 로그인 사용자 인사말 — 추후 개인화 영역으로 재배치 예정 */}
        {SHOW_LEGACY_HOME_SECTIONS && user ? (
          <div className="sr-user-home-greeting mb-4 text-center">
            <p className="sr-user-home-greeting">
              <span className="sr-user-home-greeting__name">{displayName}</span>
              님,
            </p>
            <p className="sr-user-home-greeting mt-1">
              어느 곳의 할인정보가 필요하신가요?
            </p>
          </div>
        ) : null}

        {SHOW_LEGACY_HOME_SECTIONS && !user ? (
          <div className="sr-user-home-intro mb-4 text-center">
            <p className="sr-user-home-intro__categories">
              {SAVEROUTE_HOME_CATEGORIES}
            </p>
            <p className="sr-user-home-intro__slogan mt-2">
              나를 위한{" "}
              <span className="sr-user-home-intro__slogan-accent sr-user-accent-text">
                최적의 할인 루트
              </span>
            </p>
          </div>
        ) : null}

        {SHOW_LEGACY_HOME_SECTIONS ? <SearchHubChrome variant="home" /> : null}

        {/* Legacy section: 최근 검색 — 추후 검색 보조 영역으로 재배치 예정 */}
        {SHOW_LEGACY_HOME_SECTIONS && user ? <RecentSearches /> : null}

        {/* Legacy section: 비로그인 안내·CTA — 추후 온보딩 플로우로 재배치 예정 */}
        {SHOW_LEGACY_HOME_SECTIONS && !user ? (
          <>
            <p className="sr-user-t-muted sr-user-canvas-text-muted mt-6 text-center">
              로그인하면 내 혜택 기준 맞춤 할인을 볼 수 있어요.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/auth/login" className="sr-user-btn-primary sr-user-btn-primary--block">
                로그인
              </Link>
              <Link href="/auth/signup" className="sr-user-btn-secondary sr-user-btn-secondary--block">
                회원가입
              </Link>
            </div>
          </>
        ) : null}
      </div>
      {/* Legacy section: 프로모 배너 — 추후 메인 하단 콘텐츠 영역으로 재배치 예정 */}
      {SHOW_LEGACY_HOME_SECTIONS ? (
        <div className="sr-user-home-promo-above-footer mt-auto w-full pt-6">
          <HomePromoSlotSection slots={promoSlots} />
        </div>
      ) : null}
    </UserPage>
  );
}
