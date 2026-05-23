export type NavigationKind = "search" | "data" | "page";

export type NavigationTransitionStart = {
  kind: NavigationKind;
  href: string;
  startedAt: number;
};

export const NAVIGATION_TRANSITION_START = "sr:navigation-transition-start";
export const NAVIGATION_TRANSITION_REVEAL = "sr:navigation-transition-reveal";

export const NAV_TRANSITION_EXIT_MS = 180;
export const NAV_TRANSITION_ENTER_MS = 220;
export const NAV_TRANSITION_SHELL_MS = 180;
export const NAV_TRANSITION_MIN_SEARCH_LOADER_MS = 250;
export const NAV_DATA_REVEAL_MS = 220;
export const NAV_DATA_REVEAL_STAGGER_MS = 50;

let pendingNavigation: NavigationTransitionStart | null = null;

export function emitNavigationTransitionStart(kind: NavigationKind, href: string) {
  if (typeof window === "undefined") {
    return;
  }

  pendingNavigation = { kind, href, startedAt: Date.now() };

  window.dispatchEvent(
    new CustomEvent<NavigationTransitionStart>(NAVIGATION_TRANSITION_START, {
      detail: pendingNavigation,
    }),
  );
}

export function peekPendingNavigation(): NavigationTransitionStart | null {
  return pendingNavigation;
}

export function consumePendingNavigation(): NavigationTransitionStart | null {
  const current = pendingNavigation;
  pendingNavigation = null;
  return current;
}

export function emitNavigationTransitionReveal() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(NAVIGATION_TRANSITION_REVEAL));
}

export function navigationHrefMatchesRoute(href: string, pathname: string, search: string) {
  const [targetPath, targetQuery = ""] = href.split("?");
  const currentPath = pathname;
  const currentQuery = search.startsWith("?") ? search.slice(1) : search;

  if (targetPath !== currentPath) {
    return false;
  }

  if (!targetQuery) {
    return true;
  }

  const targetParams = new URLSearchParams(targetQuery);
  const currentParams = new URLSearchParams(currentQuery);

  for (const [key, value] of targetParams.entries()) {
    if (currentParams.get(key) !== value) {
      return false;
    }
  }

  return true;
}

export function shouldAnimateUserRoute(href: string) {
  const path = href.split("?")[0];

  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }

  if (path.startsWith("/admin")) {
    return false;
  }

  return true;
}
