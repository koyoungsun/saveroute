"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FontSizeControl } from "@/components/settings/FontSizeControl";
import { UserPage } from "@/components/layout/UserPage";
import {
  normalizeProfileAgeGroup,
  normalizeProfileGender,
  PROFILE_AGE_GROUP_OPTIONS,
  PROFILE_GENDER_OPTIONS,
} from "@/lib/profile/demographics";

import {
  updateConsentAction,
  updateDemographicsAction,
  updateNicknameAction,
} from "../actions";

export type SettingsInitial = {
  email: string;
  nickname: string | null;
  gender: string | null;
  gender_group: string | null;
  age_group: string | null;
  allow_search_stats: boolean;
  allow_personalized_recommendations: boolean;
  allow_marketing_notifications: boolean;
};

export default function MySettingsClient({ initial }: { initial: SettingsInitial }) {
  const [nicknameState, nicknameFormAction, nicknamePending] = useActionState(
    updateNicknameAction,
    null as { ok?: boolean; message?: string } | null,
  );

  const [consentState, consentFormAction, consentPending] = useActionState(
    updateConsentAction,
    null as { ok?: boolean; message?: string } | null,
  );

  const [demoState, demoFormAction, demoPending] = useActionState(
    updateDemographicsAction,
    null as { ok?: boolean; message?: string } | null,
  );

  const normalizedGender = normalizeProfileGender(initial.gender, initial.gender_group);
  const genderValue = normalizedGender ?? "none";

  const normalizedAge = normalizeProfileAgeGroup(initial.age_group);
  const ageValue = normalizedAge ?? "none";

  return (
    <UserPage withBottomDock className="sr-user-stack">
      <div className="flex items-center gap-3">
        <Link href="/mypage" className="text-sm font-medium text-gray-600">
          ← 마이페이지
        </Link>
      </div>

      <h1 className="text-xl font-bold text-gray-900">설정</h1>
      <p className="mt-1 text-sm text-gray-500">{initial.email}</p>

      <div className="mt-6 space-y-6">
        <section
          className="sr-user-card rounded-2xl p-4"
          aria-label="글자 크기 설정"
        >
          <FontSizeControl variant="full" />
        </section>

        <section
          id="nickname"
          className="sr-user-card sr-user-card--featured rounded-2xl p-4 scroll-mt-20"
        >
          <h2 className="sr-user-accent-text text-base font-semibold">
            닉네임
          </h2>
          <form action={nicknameFormAction} className="mt-4 space-y-3">
            <label htmlFor="nickname-input" className="sr-only">
              닉네임
            </label>
            <input
              id="nickname-input"
              name="nickname"
              type="text"
              maxLength={40}
              defaultValue={initial.nickname ?? ""}
              placeholder="표시할 이름을 입력하세요"
              className="sr-user-input px-4 py-3 text-sm"
            />
            <button
              type="submit"
              disabled={nicknamePending}
              className="sr-user-btn-primary w-full rounded-xl py-3 text-sm font-semibold"
            >
              {nicknamePending ? "저장 중…" : "닉네임 저장"}
            </button>
          </form>
          {nicknameState?.message ? (
            <p
              className={`mt-2 text-xs ${nicknameState.ok ? "text-green-700" : "text-red-600"}`}
            >
              {nicknameState.message}
            </p>
          ) : null}
        </section>

        <section className="sr-user-card rounded-2xl p-4">
          <h2 className="text-base font-semibold text-gray-900">
            통계 · 추천 · 알림 동의
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            세이브루트 서비스 개선 및 혜택 안내에 활용됩니다.
          </p>

          <form action={consentFormAction} className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 px-3 py-3 text-sm">
              <input
                type="checkbox"
                name="allow_search_stats"
                defaultChecked={initial.allow_search_stats}
                className="mt-0.5 size-4 shrink-0 accent-[#6D5EF7]"
              />
              <span>
                <span className="font-medium text-gray-900">검색 통계 저장에 동의</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  익명·세그먼트 단위 검색 패턴 분석에 활용됩니다.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 px-3 py-3 text-sm">
              <input
                type="checkbox"
                name="allow_personalized_recommendations"
                defaultChecked={initial.allow_personalized_recommendations}
                className="mt-0.5 size-4 shrink-0 accent-[#6D5EF7]"
              />
              <span>
                <span className="font-medium text-gray-900">
                  맞춤 할인 추천 사용
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  등록한 보유혜택과 조합된 할인을 우선 노출합니다.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 px-3 py-3 text-sm">
              <input
                type="checkbox"
                name="allow_marketing_notifications"
                defaultChecked={initial.allow_marketing_notifications}
                className="mt-0.5 size-4 shrink-0 accent-[#6D5EF7]"
              />
              <span>
                <span className="font-medium text-gray-900">
                  알림 · 마케팅 정보 수신 동의
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  이벤트·혜택 소식 등을 받습니다 (추후 채널별 세분화 가능).
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={consentPending}
              className="sr-user-btn-primary w-full rounded-xl py-3 text-sm font-semibold"
            >
              {consentPending ? "저장 중…" : "동의 설정 저장"}
            </button>
          </form>
          {consentState?.message ? (
            <p
              className={`mt-2 text-xs ${consentState.ok ? "text-green-700" : "text-red-600"}`}
            >
              {consentState.message}
            </p>
          ) : null}
        </section>

        <section className="sr-user-card rounded-2xl p-4">
          <h2 className="text-base font-semibold text-gray-900">
            통계 세그먼트 (선택)
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            검색 로그에는 저장하지 않으며, 서비스 통계 목적으로만 사용됩니다.
          </p>

          <form action={demoFormAction} className="mt-4 space-y-4">
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">성별</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  ...PROFILE_GENDER_OPTIONS.map((option) => [option.value, option.label] as const),
                  ["none", "응답 안 함"] as const,
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-800"
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      defaultChecked={genderValue === value}
                      className="size-4 accent-[#6D5EF7]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="age_group" className="text-sm font-medium text-gray-700">
                연령대
              </label>
              <select
                id="age_group"
                name="age_group"
                defaultValue={ageValue}
                className="sr-user-input mt-2 px-4 py-3 text-sm"
              >
                <option value="none">응답 안 함</option>
                {PROFILE_AGE_GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={demoPending}
              className="sr-user-btn-primary w-full rounded-xl py-3 text-sm font-semibold"
            >
              {demoPending ? "저장 중…" : "통계 세그먼트 저장"}
            </button>
          </form>
          {demoState?.message ? (
            <p
              className={`mt-2 text-xs ${demoState.ok ? "text-green-700" : "text-red-600"}`}
            >
              {demoState.message}
            </p>
          ) : null}
        </section>
      </div>
    </UserPage>
  );
}
