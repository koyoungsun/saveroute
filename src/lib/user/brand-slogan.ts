export const SAVEROUTE_SLOGAN = "나를 위한 최적의 할인 루트";

/** 메인 로고 하단 태그라인 */
export const MAIN_LOGO_TAGLINE = "통신,카드,멤버십 나의 최적 할인 루트";

/** Auth 허브 상단 슬로건 (로그인/회원가입) */
export const AUTH_HUB_SLOGAN = "나의 최적 할인 루트";

export const SAVEROUTE_HOME_CATEGORIES = "카드, 멤버십, 통신";

export const SAVEROUTE_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@saveroute.co.kr";

export function buildSaverouteContactMailto(subject: string) {
  return `mailto:${SAVEROUTE_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
