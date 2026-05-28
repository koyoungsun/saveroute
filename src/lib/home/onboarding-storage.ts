export const ONBOARDING_HIDDEN_UNTIL_KEY = "saveroute_onboarding_hidden_until";

/** @deprecated 영구 숨김 키 — 마이그레이션 후 제거만 수행 */
const LEGACY_ONBOARDING_COMPLETED_KEY = "saveroute_onboarding_completed";

export type OnboardingDismissOptions = {
  hideToday?: boolean;
  hideWeek?: boolean;
};

function addDays(from: Date, days: number): string {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function parseHiddenUntilMs(value: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999).getTime();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clearLegacyOnboardingKeys() {
  try {
    localStorage.removeItem(LEGACY_ONBOARDING_COMPLETED_KEY);
  } catch {
    // ignore
  }
}

export function shouldShowHomeOnboarding(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    clearLegacyOnboardingKeys();

    const hiddenUntil = localStorage.getItem(ONBOARDING_HIDDEN_UNTIL_KEY);
    if (!hiddenUntil) {
      return true;
    }

    return Date.now() >= parseHiddenUntilMs(hiddenUntil);
  } catch {
    return true;
  }
}

export function dismissHomeOnboarding(options: OnboardingDismissOptions) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    clearLegacyOnboardingKeys();

    if (options.hideWeek) {
      localStorage.setItem(ONBOARDING_HIDDEN_UNTIL_KEY, addDays(new Date(), 7));
      return;
    }

    if (options.hideToday) {
      localStorage.setItem(ONBOARDING_HIDDEN_UNTIL_KEY, addDays(new Date(), 1));
    }
  } catch {
    // ignore quota / private mode
  }
}
