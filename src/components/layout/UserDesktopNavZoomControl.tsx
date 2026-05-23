"use client";

import { useZoom } from "@/components/settings/ZoomProvider";
import { ZOOM_DEFAULT, formatZoomPercent } from "@/lib/settings/zoom-level";
import { cn } from "@/lib/utils";

export function UserDesktopNavZoomControl() {
  const { level, atMin, atMax, decrease, increase, reset } = useZoom();
  const atDefault = level === ZOOM_DEFAULT;

  return (
    <div className="sr-user-desktop-nav__font-size">
      <div className="sr-user-desktop-nav__font-size-divider" aria-hidden />
      <p className="sr-user-desktop-nav__font-size-label">글자 크기</p>
      <div
        className="sr-user-desktop-nav__font-size-toolbar"
        role="toolbar"
        aria-label="글자 크기 조절"
      >
        <span className="sr-only" aria-live="polite">
          현재 글자 크기 {formatZoomPercent(level)}입니다.
        </span>
        <button
          type="button"
          className="sr-user-desktop-nav__font-size-btn"
          onClick={() => decrease()}
          disabled={atMin}
          aria-label="글자 작게"
        >
          −
        </button>
        <button
          type="button"
          className={cn(
            "sr-user-desktop-nav__font-size-value",
            atDefault && "sr-user-desktop-nav__font-size-value--default",
          )}
          onClick={() => reset()}
          aria-label="글자 크기 기본으로"
          aria-pressed={atDefault}
        >
          {formatZoomPercent(level)}
        </button>
        <button
          type="button"
          className="sr-user-desktop-nav__font-size-btn"
          onClick={() => increase()}
          disabled={atMax}
          aria-label="글자 크게"
        >
          +
        </button>
      </div>
    </div>
  );
}
