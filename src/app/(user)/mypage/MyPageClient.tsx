"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CreditCard,
  Mail,
  MoreHorizontal,
  Smartphone,
  Star,
  UserRound,
} from "lucide-react";

import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { BrandHubChrome } from "@/components/layout/BrandHubChrome";
import { FontSizeControl } from "@/components/settings/FontSizeControl";
import { UserPage } from "@/components/layout/UserPage";
import { SHOW_MYPAGE_FOOTER_ART, SHOW_MYPAGE_FONT_SIZE_CONTROL } from "@/lib/user/home-layout-flags";
import { buildSaverouteContactMailto } from "@/lib/user/brand-slogan";
import {
  PersonalizedBestSections,
  type PersonalizedDiscount,
} from "@/components/search/PersonalizedBestSections";

import type { MyPageProfilePayload } from "./types";

function formatJoined(dateIso: string) {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      dateStyle: "medium",
    }).format(new Date(dateIso));
  } catch {
    return "—";
  }
}

function ConsentBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`sr-user-mypage-consent-badge${
        active ? " sr-user-mypage-consent-badge--active" : ""
      }`}
    >
      {label}
    </span>
  );
}

const STAT_ITEMS = [
  {
    key: "telecom",
    label: "통신 혜택",
    icon: Smartphone,
    iconClass: "sr-user-mypage-stat-card__icon--telecom",
    getCount: (profile: MyPageProfilePayload) => profile.registeredTelecomCount,
  },
  {
    key: "card",
    label: "카드 혜택",
    icon: CreditCard,
    iconClass: "sr-user-mypage-stat-card__icon--card",
    getCount: (profile: MyPageProfilePayload) => profile.registeredCardCount,
  },
  {
    key: "membership",
    label: "멤버십·포인트",
    icon: Star,
    iconClass: "sr-user-mypage-stat-card__icon--membership",
    getCount: (profile: MyPageProfilePayload) =>
      profile.registeredMembershipCount,
  },
  {
    key: "other",
    label: "기타 혜택",
    icon: MoreHorizontal,
    iconClass: "sr-user-mypage-stat-card__icon--other",
    getCount: (profile: MyPageProfilePayload) => profile.registeredOtherCount,
  },
] as const;

export default function MyPageClient({
  profile,
  loadWarnings,
  hasBenefits,
  telecomDiscounts,
  cardDiscounts,
}: {
  profile: MyPageProfilePayload;
  loadWarnings: string[];
  hasBenefits: boolean;
  telecomDiscounts: PersonalizedDiscount[];
  cardDiscounts: PersonalizedDiscount[];
}) {
  const nicknameDisplay =
    profile.nickname?.trim() || "닉네임을 설정해주세요";
  const profileName = profile.nickname?.trim() || "SaveRoute 회원";

  const contactMailto = buildSaverouteContactMailto("SaveRoute 문의");

  return (
    <UserPage className="sr-user-account-page sr-user-mypage-page sr-user-stack">
      <BrandHubChrome variant="account" />

      <div className="sr-user-account-page__body">
        <header className="sr-user-account-page__intro">
          <h1 className="sr-user-account-page__title">마이페이지</h1>
          <p className="sr-user-mypage-page__description">
            등록한 혜택과 할인 내역을 확인하세요.
          </p>
        </header>

        {loadWarnings.length > 0 ? (
          <div
            className="sr-user-account-page__notice sr-user-mypage-notice"
            role="status"
          >
            {loadWarnings.map((w) => (
              <p key={w}>{w}</p>
            ))}
          </div>
        ) : null}

        <div className="sr-user-mypage-hub">
          <section
            className="sr-user-benefit-accordion-card sr-user-mypage-card"
            aria-labelledby="mypage-profile-heading"
          >
            <div className="sr-user-mypage-profile-top">
              <div className="sr-user-mypage-profile-leading">
                <div
                  className="sr-user-benefit-accordion-card__icon sr-user-benefit-accordion-card__icon--card"
                  aria-hidden
                >
                  <UserRound strokeWidth={2} />
                </div>
                <div className="sr-user-mypage-profile-identity">
                  <p
                    id="mypage-profile-heading"
                    className="sr-user-mypage-profile-name"
                  >
                    {profileName}
                  </p>
                  <p className="sr-user-mypage-profile-email">
                    {profile.email || "—"}
                  </p>
                </div>
              </div>
              <Link
                href="/mypage/settings#nickname"
                className="sr-user-btn-secondary inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-xs font-semibold"
              >
                닉네임 수정
              </Link>
            </div>

            <div className="sr-user-mypage-profile-divider" aria-hidden />

            <dl className="sr-user-mypage-info-rows">
              <div className="sr-user-mypage-info-row">
                <dt>이메일</dt>
                <dd>{profile.email || "—"}</dd>
              </div>
              <div className="sr-user-mypage-info-row">
                <dt>닉네임</dt>
                <dd
                  className={
                    profile.nickname?.trim()
                      ? undefined
                      : "sr-user-mypage-info-row__value--warn"
                  }
                >
                  {nicknameDisplay}
                </dd>
              </div>
              <div className="sr-user-mypage-info-row">
                <dt>가입일</dt>
                <dd>{formatJoined(profile.createdAt)}</dd>
              </div>
              <div className="sr-user-mypage-info-row sr-user-mypage-info-row--last">
                <dt>등록된 보유혜택</dt>
                <dd>
                  {profile.registeredBenefitCount.toLocaleString("ko-KR")}개
                </dd>
              </div>
            </dl>
          </section>

          <div
            className="sr-user-mypage-stat-grid"
            aria-label="등록 혜택 통계"
          >
            {STAT_ITEMS.map(({ key, label, icon: Icon, iconClass, getCount }) => (
              <article key={key} className="sr-user-mypage-stat-card">
                <span
                  className={`sr-user-mypage-stat-card__icon ${iconClass}`}
                  aria-hidden
                >
                  <Icon strokeWidth={2} />
                </span>
                <p className="sr-user-mypage-stat-card__label">{label}</p>
                <p className="sr-user-mypage-stat-card__count">
                  {getCount(profile).toLocaleString("ko-KR")}
                </p>
              </article>
            ))}
          </div>

          <PersonalizedBestSections
            isAuthenticated
            hasBenefits={hasBenefits}
            telecomDiscounts={telecomDiscounts}
            cardDiscounts={cardDiscounts}
            variant="mypage"
          />

          <section
            className="sr-user-benefit-accordion-card sr-user-mypage-card"
            aria-labelledby="mypage-settings-heading"
          >
            <div className="sr-user-mypage-section-head">
              <h2
                id="mypage-settings-heading"
                className="sr-user-benefit-accordion-card__title sr-user-mypage-accent-title"
              >
                통계 · 개인화 설정
              </h2>
              <Link
                href="/mypage/settings"
                className="sr-user-btn-secondary inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3 text-xs font-semibold"
              >
                설정 수정
              </Link>
            </div>

            <ul className="sr-user-mypage-consent-list">
              <li className="sr-user-mypage-consent-row">
                <span>검색 통계 저장</span>
                <ConsentBadge
                  active={profile.allowSearchStats}
                  label={profile.allowSearchStats ? "동의" : "미동의"}
                />
              </li>
              <li className="sr-user-mypage-consent-row">
                <span>맞춤 할인 추천</span>
                <ConsentBadge
                  active={profile.allowPersonalizedRecommendations}
                  label={
                    profile.allowPersonalizedRecommendations ? "사용" : "미사용"
                  }
                />
              </li>
              <li className="sr-user-mypage-consent-row sr-user-mypage-consent-row--last">
                <span>알림 · 마케팅 수신</span>
                <ConsentBadge
                  active={profile.allowMarketingNotifications}
                  label={
                    profile.allowMarketingNotifications ? "동의" : "미동의"
                  }
                />
              </li>
            </ul>
          </section>

          <div className="sr-user-mypage-actions">
            <Link
              href="/my-benefits"
              className="sr-user-btn-primary inline-flex h-12 flex-1 items-center justify-center rounded-2xl text-sm font-semibold text-white"
            >
              내 혜택 수정하기
            </Link>
            <Link
              href="/mypage/settings"
              className="sr-user-btn-secondary sr-user-btn-secondary--accent inline-flex h-12 flex-1 items-center justify-center rounded-2xl text-sm font-semibold"
            >
              내 정보 수정하기
            </Link>
          </div>

          <section
            className="sr-user-benefit-accordion-card sr-user-mypage-card"
            aria-label="서비스 및 고객지원"
          >
            <h2 className="sr-user-benefit-accordion-card__title sr-user-mypage-accent-title">
              서비스 · 고객지원
            </h2>
            <div className="sr-user-mypage-support-stack">
              <InstallAppButton className="sr-user-mypage-support-cta sr-user-mypage-support-cta--install" />
              <a
                href={contactMailto}
                className="sr-user-mypage-support-cta sr-user-mypage-support-cta--email"
                aria-label="이메일 문의하기"
              >
                <Mail aria-hidden="true" strokeWidth={2.25} />
                이메일 문의하기
              </a>
            </div>
          </section>

          {/* 글자 크기 UI — SHOW_MYPAGE_FONT_SIZE_CONTROL 로 재노출 */}
          {SHOW_MYPAGE_FONT_SIZE_CONTROL ? (
            <section
              className="sr-user-benefit-accordion-card sr-user-mypage-card"
              aria-label="글자 크기 설정"
            >
              <FontSizeControl variant="compact" />
            </section>
          ) : null}

          <section className="sr-user-benefit-accordion-card sr-user-mypage-card sr-user-mypage-menu-card">
            <h2 className="sr-only">메뉴</h2>
            <nav className="sr-user-mypage-menu" aria-label="약관 및 계정">
              <Link
                href="/notices"
                className="sr-user-mypage-menu-link sr-user-mypage-menu-link--notice"
              >
                공지사항
              </Link>

              <div className="sr-user-mypage-menu-row sr-user-mypage-menu-grid">
                <Link
                  href="/terms"
                  className="sr-user-mypage-menu-link sr-user-mypage-menu-link--policy"
                >
                  이용약관
                </Link>
                <Link
                  href="/privacy"
                  className="sr-user-mypage-menu-link sr-user-mypage-menu-link--policy"
                >
                  개인정보 처리방침
                </Link>
              </div>

              <div className="sr-user-mypage-menu-row sr-user-mypage-menu-grid">
                <button
                  type="button"
                  onClick={() => alert("로그아웃")}
                  className="sr-user-mypage-menu-link sr-user-mypage-menu-link--logout"
                >
                  로그아웃
                </button>
                <button
                  type="button"
                  onClick={() => alert("회원 탈퇴")}
                  className="sr-user-mypage-menu-link sr-user-mypage-menu-link--danger"
                >
                  회원 탈퇴
                </button>
              </div>
            </nav>
          </section>
        </div>

        <div className="sr-user-mypage-footer-art">
          {SHOW_MYPAGE_FOOTER_ART ? (
            <Image
              src="/icons/icon-good.png"
              alt=""
              width={320}
              height={320}
              className="sr-user-mypage-footer-art__image"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </UserPage>
  );
}
