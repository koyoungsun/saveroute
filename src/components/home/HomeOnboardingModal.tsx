"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

import { HOME_ONBOARDING_OPEN_EVENT } from "@/lib/home/onboarding-events";
import {
  dismissHomeOnboarding,
  shouldShowHomeOnboarding,
} from "@/lib/home/onboarding-storage";
import { createClient } from "@/lib/supabase/client";

import styles from "./HomeOnboardingModal.module.css";

const SLIDES = [
  {
    title: "혜택정보 등록으로 최적 할인 자동 계산",
    description:
      "카드, 통신사, 멤버십 정보를 등록하면 가장 좋은 할인 순서를 찾아드려요.",
  },
  {
    title: "회원가입 후 내 할인만 빠르게 확인",
    description:
      "가입 후 보유 정보를 등록, 검색 시 최대 적용 할인리스트를 드려요.",
  },
  {
    title: "브랜드 검색만 하면 최적 할인 결과 확인",
    description:
      "가고 싶은 브랜드를 검색하면 가능한 할인과 계산 결과를 한눈에 확인할 수 있어요.",
  },
] as const;

const LAST_STEP = SLIDES.length - 1;

export function HomeOnboardingModal() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [hideToday, setHideToday] = useState(false);
  const [hideWeek, setHideWeek] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const openFromStart = useCallback(() => {
    setStep(0);
    setHideToday(false);
    setHideWeek(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (shouldShowHomeOnboarding()) {
      openFromStart();
    }

    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    });
  }, [openFromStart]);

  useEffect(() => {
    const onForceOpen = () => {
      openFromStart();
    };

    window.addEventListener(HOME_ONBOARDING_OPEN_EVENT, onForceOpen);
    return () => window.removeEventListener(HOME_ONBOARDING_OPEN_EVENT, onForceOpen);
  }, [openFromStart]);

  const closeWithPreferences = useCallback(() => {
    dismissHomeOnboarding({
      hideToday: hideToday && !hideWeek,
      hideWeek,
    });
    setOpen(false);
    setHideToday(false);
    setHideWeek(false);
  }, [hideToday, hideWeek]);

  const handleHideWeekChange = (checked: boolean) => {
    setHideWeek(checked);
    if (checked) {
      setHideToday(false);
    }
  };

  const handleHideTodayChange = (checked: boolean) => {
    setHideToday(checked);
    if (checked) {
      setHideWeek(false);
    }
  };

  if (!mounted || !open) {
    return null;
  }

  const slide = SLIDES[step];
  const isFirst = step === 0;
  const isLast = step === LAST_STEP;

  const goNext = () => {
    setStep((current) => Math.min(current + 1, LAST_STEP));
  };

  const handleBenefitsCta = () => {
    closeWithPreferences();
    router.push(isLoggedIn ? "/my-benefits" : "/auth/login");
  };

  const goPrev = () => {
    setStep((current) => Math.max(current - 1, 0));
  };

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeWithPreferences();
        }
      }}
    >
      <div
        className={`${styles.modal} sr-onboarding-modal`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-onboarding-title"
        aria-describedby="home-onboarding-description"
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={closeWithPreferences}
          aria-label="온보딩 닫기"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className={styles.body}>
          <div className={styles.imagePlaceholder} aria-hidden="true">
            이미지 영역
          </div>

          <h2 id="home-onboarding-title" className={styles.title}>
            {slide.title}
          </h2>
          <p id="home-onboarding-description" className={styles.description}>
            {slide.description}
          </p>
        </div>

        <div className={styles.footer}>
          <div className={styles.dots} aria-label="온보딩 단계">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                type="button"
                className={`${styles.dot} ${index === step ? styles.dotActive : ""}`}
                onClick={() => setStep(index)}
                aria-label={`${index + 1}단계`}
                aria-current={index === step ? "step" : undefined}
              />
            ))}
          </div>

          <div
            className={`${styles.actions} ${isFirst ? styles.actionsSingle : ""}`}
          >
            {!isFirst ? (
              <button type="button" className={styles.btnSecondary} onClick={goPrev}>
                이전
              </button>
            ) : null}

            {isLast ? (
              <button type="button" className={styles.btnPrimary} onClick={handleBenefitsCta}>
                내 혜택 등록하기
              </button>
            ) : (
              <button type="button" className={styles.btnPrimary} onClick={goNext}>
                다음
              </button>
            )}
          </div>

          <div className={styles.options}>
            <label className={styles.optionLabel}>
              <input
                type="checkbox"
                checked={hideToday}
                disabled={hideWeek}
                onChange={(event) => handleHideTodayChange(event.target.checked)}
              />
              오늘 하루 보지 않기
            </label>
            <label className={styles.optionLabel}>
              <input
                type="checkbox"
                checked={hideWeek}
                onChange={(event) => handleHideWeekChange(event.target.checked)}
              />
              일주일 보지 않기
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
