"use client";

import Link from "next/link";
import { useState } from "react";

export default function MyPage() {
  const [gender, setGender] = useState("none");
  const [ageGroup, setAgeGroup] = useState("none");

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">마이페이지</h1>

      <div className="mt-4 space-y-4">
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">
            내 혜택 요약
          </h2>
          <p className="mt-3 text-sm font-medium text-gray-800">
            등록된 혜택 2개
          </p>
          <p className="mt-1 text-sm text-gray-500">
            KT VIP · 신한카드 Deep Dream
          </p>
          <Link
            href="/my-benefits"
            className="mt-4 inline-flex text-sm font-medium text-blue-600"
          >
            내 혜택 수정 →
          </Link>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">통계 설정</h2>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-gray-700">성별</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                ["male", "남성"],
                ["female", "여성"],
                ["other", "기타"],
                ["none", "응답 안 함"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={value}
                    checked={gender === value}
                    onChange={(event) => setGender(event.target.value)}
                    className="size-4 accent-blue-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label
            htmlFor="age-group"
            className="mt-5 block text-sm font-medium text-gray-700"
          >
            연령대
          </label>
          <select
            id="age-group"
            value={ageGroup}
            onChange={(event) => setAgeGroup(event.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="10s">10대</option>
            <option value="20s">20대</option>
            <option value="30s">30대</option>
            <option value="40s">40대</option>
            <option value="50s">50대</option>
            <option value="60s-plus">60대 이상</option>
            <option value="none">응답 안 함</option>
          </select>

          <p className="mt-3 text-xs text-gray-400">
            통계 목적으로만 사용됩니다.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
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
    </div>
  );
}
