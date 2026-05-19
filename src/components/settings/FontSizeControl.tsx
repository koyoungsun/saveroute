"use client";

import {
  FONT_SCALE_DEFAULT,
  FONT_SCALE_MAX,
  FONT_SCALE_MIN,
} from "@/lib/settings/font-scale";

import { cn } from "@/lib/utils";

import { useFontScale } from "./FontScaleProvider";

export type FontSizeControlProps = {
  /** full: 안내 문구 포함 · compact: 제목 최소만 · toolbar: 헤더용 한 줄 */
  variant?: "full" | "compact" | "toolbar";
};

export function FontSizeControl({ variant = "full" }: FontSizeControlProps) {
  const { percent, decrease, increase, reset } = useFontScale();

  const atMin = percent <= FONT_SCALE_MIN;
  const atMax = percent >= FONT_SCALE_MAX;
  const atDefault = percent === FONT_SCALE_DEFAULT;

  if (variant === "toolbar") {
    return (
      <div
        className="flex max-w-full shrink-0 flex-nowrap items-center gap-0.5 rounded-2xl border border-gray-200 bg-white px-1 py-1 shadow-sm"
        role="toolbar"
        aria-label="글자 크기 조절"
      >
        <span className="sr-only" aria-live="polite">
          현재 글자 크기 {percent}퍼센트입니다.
        </span>
        <button
          type="button"
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold leading-none transition md:size-10",
            atMin ? "cursor-not-allowed text-gray-300" : "text-gray-800 hover:bg-gray-50",
          )}
          onClick={() => decrease()}
          disabled={atMin}
          aria-label="글자 작게"
        >
          <span aria-hidden>작게</span>
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl px-1 text-[11px] font-semibold transition md:h-10 md:text-xs",
            atDefault ? "bg-[#409A53]/10 text-[#2d7340] ring-2 ring-[#409A53]/35" : "text-gray-700 hover:bg-gray-50",
          )}
          onClick={() => reset()}
          aria-pressed={atDefault}
          aria-label="글자 크기 기본으로"
        >
          기본
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold leading-none transition md:size-10",
            atMax ? "cursor-not-allowed text-gray-300" : "text-gray-800 hover:bg-gray-50",
          )}
          onClick={() => increase()}
          disabled={atMax}
          aria-label="글자 크게"
        >
          <span aria-hidden>크게</span>
        </button>
        <span
          className="min-w-[1.875rem] shrink-0 px-0.5 text-center text-[10px] font-semibold tabular-nums leading-none text-gray-500 md:min-w-[2rem]"
          aria-hidden
        >
          {percent}%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-gray-900">글자 크기</h2>
        {variant === "full" ? (
          <p className="mt-1 text-xs text-gray-500">
            사이트 전체 글자 크기입니다. 새로고침 후에도 유지되며 로그인과 관계 없이 이 기기에만 적용됩니다.
          </p>
        ) : null}
      </div>

      <span className="sr-only" aria-live="polite">
        현재 글자 크기 {percent}퍼센트입니다.
      </span>

      <div
        role="toolbar"
        aria-label="글자 크기 조절"
        className="flex flex-wrap items-stretch gap-2"
      >
        <button
          type="button"
          className={`min-h-11 min-w-0 shrink-0 rounded-xl border px-2 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40 sm:flex-1 ${
            atMin
              ? "border-gray-200 bg-gray-50 text-gray-400"
              : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          }`}
          onClick={() => decrease()}
          disabled={atMin}
          aria-label="글자 작게"
        >
          <span className="sm:hidden" aria-hidden>
            A−
          </span>
          <span className="hidden sm:inline">글자 작게</span>
        </button>

        <button
          type="button"
          className={`min-h-11 shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:min-w-[6rem] ${
            atDefault
              ? "bg-[#409A53]/10 text-[#2d7340] shadow-[inset_0_0_0_2px_#409A53]"
              : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
          }`}
          onClick={() => reset()}
          aria-pressed={atDefault}
          aria-label="글자 크기 기본으로"
        >
          기본
        </button>

        <button
          type="button"
          className={`min-h-11 min-w-0 shrink-0 rounded-xl border px-2 py-2.5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40 sm:flex-1 ${
            atMax
              ? "border-gray-200 bg-gray-50 text-gray-400"
              : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
          }`}
          onClick={() => increase()}
          disabled={atMax}
          aria-label="글자 크게"
        >
          <span className="sm:hidden" aria-hidden>
            A+
          </span>
          <span className="hidden sm:inline">글자 크게</span>
        </button>
      </div>

      <p
        className="text-center text-xs font-medium tabular-nums text-gray-500 sm:text-left sm:text-xs"
        aria-hidden
      >
        {percent}%
      </p>
    </div>
  );
}
