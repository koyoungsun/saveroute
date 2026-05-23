"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { BrandHubChrome } from "@/components/layout/BrandHubChrome";
import { FontSizeControl } from "@/components/settings/FontSizeControl";
import { UserPage } from "@/components/layout/UserPage";
import { SHOW_MYPAGE_FOOTER_ART } from "@/lib/user/home-layout-flags";
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

function ConsentLabel({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        active ? "text-white" : "bg-gray-100 text-gray-600"
      }`}
      style={active ? { background: "var(--sr-cta-bg)" } : undefined}
    >
      {label}
    </span>
  );
}

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

  const settingsComplete =
    Boolean(profile.nickname?.trim()) &&
    profile.genderGroup != null &&
    profile.ageGroup != null;

  const contactMailto = buildSaverouteContactMailto("SaveRoute 문의");

  return (
    <UserPage className="sr-user-account-page sr-user-stack">
      <BrandHubChrome variant="account" />

      <div className="sr-user-account-page__body">
        <h1 className="sr-user-account-page__title">마이페이지</h1>

      {loadWarnings.length > 0 ? (
        <div
          className="sr-user-account-page__notice mt-4 rounded-xl px-3 py-2 text-xs"
          role="status"
        >
          {loadWarnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-4">
        {/* 내정보 */}
        <section className="sr-user-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="sr-user-accent-text text-base font-semibold">
              내 정보
            </h2>
            <Link
              href="/mypage/settings#nickname"
              className="sr-user-btn-primary shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
            >
              닉네임 수정
            </Link>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
              <dt className="text-gray-500">이메일</dt>
              <dd className="max-w-[65%] truncate text-right font-medium text-gray-900">
                {profile.email || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
              <dt className="text-gray-500">닉네임</dt>
              <dd
                className={`max-w-[65%] text-right font-medium ${
                  profile.nickname?.trim()
                    ? "text-gray-900"
                    : "text-amber-700"
                }`}
              >
                {nicknameDisplay}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-gray-100 pb-3">
              <dt className="text-gray-500">가입일</dt>
              <dd className="font-medium text-gray-900">
                {formatJoined(profile.createdAt)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">등록된 보유혜택</dt>
              <dd className="sr-user-accent-text font-semibold tabular-nums">
                {profile.registeredBenefitCount.toLocaleString("ko-KR")}개
              </dd>
            </div>
          </dl>
        </section>

        <PersonalizedBestSections
          isAuthenticated
          hasBenefits={hasBenefits}
          telecomDiscounts={telecomDiscounts}
          cardDiscounts={cardDiscounts}
          variant="mypage"
        />

        {/* 통계·개인화 요약 */}
        <section className="sr-user-card rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                통계 · 개인화 설정
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                검색 통계 저장·맞춤 추천·알림 수신 동의 현황입니다.
              </p>
            </div>
            <Link
              href="/mypage/settings"
              className="sr-user-btn-secondary sr-user-btn-secondary--accent inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold"
            >
              설정 수정
            </Link>
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-700">검색 통계 저장</span>
              <ConsentLabel
                active={profile.allowSearchStats}
                label={profile.allowSearchStats ? "동의" : "미동의"}
              />
            </li>
            <li className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-700">맞춤 할인 추천</span>
              <ConsentLabel
                active={profile.allowPersonalizedRecommendations}
                label={
                  profile.allowPersonalizedRecommendations ? "사용" : "미사용"
                }
              />
            </li>
            <li className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-700">알림 · 마케팅 수신</span>
              <ConsentLabel
                active={profile.allowMarketingNotifications}
                label={profile.allowMarketingNotifications ? "동의" : "미동의"}
              />
            </li>
          </ul>

          {settingsComplete ? (
            <div className="sr-user-card mt-4 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600">
                할인 · 통계 요약
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <div className="text-gray-500">등록 카드</div>
                  <div className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                    {profile.registeredCardCount}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <div className="text-gray-500">등록 통신사</div>
                  <div className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                    {profile.registeredTelecomCount}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <div className="text-gray-500">최근 검색 (30일)</div>
                  <div className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                    {profile.recentSearchCount}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 px-2 py-2">
                  <div className="text-gray-500">업데이트 요청 참여</div>
                  <div className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                    {profile.brandRequestParticipationCount}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              닉네임과 통계 세그먼트(성별·연령대)를 설정하면, 등록 카드·통신사 수와 최근 검색·업데이트
              요청 참여 요약을 여기에서 확인할 수 있어요.
            </p>
          )}
        </section>

        <section className="sr-user-card rounded-2xl p-4" aria-label="서비스 및 고객지원">
          <h2 className="text-base font-semibold text-gray-900">서비스 · 고객지원</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            혜택 관리, 앱 설치, 문의를 한곳에서 이용할 수 있어요.
          </p>
          <div className="sr-user-utility-stack mt-4">
            <Link
              href="/my-benefits"
              className="sr-user-btn-primary flex w-full items-center justify-center rounded-xl py-3 text-sm font-semibold text-white"
            >
              내 혜택 수정하기
            </Link>
            <InstallAppButton />
            <a
              href={contactMailto}
              className="sr-user-btn-secondary sr-user-btn-secondary--accent flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
              aria-label="이메일 문의하기"
            >
              <Mail aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
              이메일 문의하기
            </a>
          </div>
        </section>

        <section
          className="sr-user-card rounded-2xl p-4"
          aria-label="글자 크기 설정"
        >
          <FontSizeControl variant="compact" />
        </section>

        <section className="sr-user-card rounded-2xl p-4">
          <h2 className="sr-only">메뉴</h2>
          <div className="divide-y divide-gray-100">
            <Link
              href="/terms"
              className="flex items-center justify-between py-4 text-sm text-gray-700"
            >
              이용약관
              <span className="text-gray-400">→</span>
            </Link>
            <Link
              href="/privacy"
              className="flex items-center justify-between py-4 text-sm text-gray-700"
            >
              개인정보 처리방침
              <span className="text-gray-400">→</span>
            </Link>
            <button
              type="button"
              onClick={() => alert("로그아웃")}
              className="flex w-full items-center justify-between py-4 text-left text-sm text-red-500"
            >
              로그아웃
            </button>
            <button
              type="button"
              onClick={() => alert("회원 탈퇴")}
              className="flex w-full items-center justify-between py-4 text-left text-xs text-gray-400"
            >
              회원 탈퇴
            </button>
          </div>
        </section>
      </div>

      <div className="mt-10 flex justify-center">
        {SHOW_MYPAGE_FOOTER_ART ? (
        <Image
          src="/icons/icon-good.png"
          alt=""
          width={320}
          height={320}
          className="sr-user-mypage-footer-art h-auto w-full max-w-[280px]"
          aria-hidden
        />
        ) : null}
      </div>
      </div>
    </UserPage>
  );
}
