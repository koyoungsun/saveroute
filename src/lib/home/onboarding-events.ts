export const HOME_ONBOARDING_OPEN_EVENT = "saveroute:home-onboarding-open";

export function openHomeOnboarding() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(HOME_ONBOARDING_OPEN_EVENT));
}
