"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import type { InstallGuideVariant } from "@/lib/pwa/detect-platform";
import { cn } from "@/lib/utils";

import styles from "./InstallAppGuideModal.module.css";

type InstallAppGuideModalProps = {
  open: boolean;
  variant: InstallGuideVariant;
  onClose: () => void;
};

const COPY: Record<
  InstallGuideVariant,
  { title: string; lines: string[] }
> = {
  ios: {
    title: "홈 화면에 추가하기",
    lines: [
      "Safari 하단 공유 버튼을 누른 뒤",
      "‘홈 화면에 추가’를 선택해주세요.",
    ],
  },
  generic: {
    title: "앱처럼 사용하기",
    lines: [
      "브라우저 메뉴에서",
      "‘홈 화면에 추가’ 또는",
      "‘즐겨찾기 추가’를 선택해주세요.",
    ],
  },
};

export function InstallAppGuideModal({
  open,
  variant,
  onClose,
}: InstallAppGuideModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  const content = COPY[variant];

  return createPortal(
    <div className={styles.overlay} role="presentation">
      <button
        type="button"
        className={styles.scrim}
        aria-label="안내 닫기"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-guide-title"
        className={styles.panel}
      >
        <div className={styles.header}>
          <h2 id="install-app-guide-title" className={styles.title}>
            {content.title}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="안내 닫기"
            onClick={onClose}
          >
            <X aria-hidden="true" strokeWidth={2.25} />
          </button>
        </div>

        <div className={styles.body}>
          {content.lines.map((line) => (
            <p key={line} className={styles.line}>
              {line}
            </p>
          ))}
        </div>

        <button type="button" className={cn(styles.confirm, "sr-user-install-app-btn")} onClick={onClose}>
          확인
        </button>
      </div>
    </div>,
    document.body,
  );
}
