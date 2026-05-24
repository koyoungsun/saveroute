"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type BenefitToastKind = "telecom" | "card" | "membership" | "other";

export type BenefitToastState = {
  kind: BenefitToastKind;
  phase: "enter" | "visible" | "exit";
};

export const BENEFIT_TOAST_MESSAGES: Record<BenefitToastKind, string> = {
  telecom: "통신 혜택이 등록되었습니다.",
  card: "카드 혜택이 등록되었습니다.",
  membership: "멤버십/포인트 혜택이 등록되었습니다.",
  other: "혜택이 등록되었습니다.",
};

const TOAST_VISIBLE_MS = 4000;
const TOAST_EXIT_MS = 260;

export function useBenefitToast() {
  const [toast, setToast] = useState<BenefitToastState | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  const showBenefitToast = useCallback(
    (kind: BenefitToastKind) => {
      clearTimers();
      setToast({ kind, phase: "enter" });

      const enterTimer = window.setTimeout(() => {
        setToast((current) => (current ? { ...current, phase: "visible" } : null));
      }, 20);

      const exitTimer = window.setTimeout(() => {
        setToast((current) => (current ? { ...current, phase: "exit" } : null));
      }, TOAST_VISIBLE_MS);

      const clearTimer = window.setTimeout(() => {
        setToast(null);
      }, TOAST_VISIBLE_MS + TOAST_EXIT_MS);

      timersRef.current = [enterTimer, exitTimer, clearTimer];
    },
    [clearTimers],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { toast, showBenefitToast };
}
