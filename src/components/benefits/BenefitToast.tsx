"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  BENEFIT_TOAST_MESSAGES,
  type BenefitToastState,
} from "@/components/benefits/useBenefitToast";

type BenefitToastProps = {
  toast: BenefitToastState | null;
  bottomOffset?: string;
};

export function BenefitToast({ toast, bottomOffset }: BenefitToastProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !toast) {
    return null;
  }

  return createPortal(
    <div className="sr-user-app sr-benefit-toast-portal" aria-live="polite" aria-atomic="true">
      <div
        className="sr-benefit-toast"
        data-phase={toast.phase}
        role="status"
        style={bottomOffset ? { bottom: bottomOffset } : undefined}
      >
        {BENEFIT_TOAST_MESSAGES[toast.kind]}
      </div>
    </div>,
    document.body,
  );
}
