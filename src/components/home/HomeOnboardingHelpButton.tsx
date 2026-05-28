"use client";

import { HelpCircle } from "lucide-react";

import { openHomeOnboarding } from "@/lib/home/onboarding-events";

import styles from "./HomeOnboardingHelpButton.module.css";

export function HomeOnboardingHelpButton() {
  return (
    <button
      type="button"
      className={styles.helpBtn}
      onClick={() => openHomeOnboarding()}
      aria-label="이용 안내 다시 보기"
    >
      <HelpCircle size={20} strokeWidth={2.2} aria-hidden="true" />
    </button>
  );
}
