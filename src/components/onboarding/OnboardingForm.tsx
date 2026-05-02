"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const GENDER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "응답 안 함" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타" },
];

const AGE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "응답 안 함" },
  { value: "10s", label: "10대" },
  { value: "20s", label: "20대" },
  { value: "30s", label: "30대" },
  { value: "40s", label: "40대" },
  { value: "50s", label: "50대" },
  { value: "60s+", label: "60대 이상" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          gender_group: gender === "" ? null : gender,
          age_group: age === "" ? null : age,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      router.push("/my-benefits");
      router.refresh();
    } catch {
      setError("요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(ev) => void handleSubmit(ev)} className="space-y-6">
      <div>
        <label
          htmlFor="gender"
          className="block text-sm font-medium text-gray-700"
        >
          성별
        </label>
        <select
          id="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {GENDER_OPTIONS.map((opt) => (
            <option key={opt.value || "skip"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700">
          연령대
        </label>
        <select
          id="age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {AGE_OPTIONS.map((opt) => (
            <option key={opt.value || "skip-age"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        통계 목적으로만 사용되며 개인 검색 이력 추적에는 사용하지 않습니다.
      </p>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
      >
        {loading ? "저장 중..." : "다음"}
      </button>
    </form>
  );
}
