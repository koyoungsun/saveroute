export type AnimatedBackgroundIntensity = "normal" | "subtle" | "none";

function normalizePath(pathname: string) {
  return pathname.split("?")[0]?.split("#")[0] ?? "";
}

function usesSubtleTwinkle(path: string) {
  if (
    path === "/" ||
    path === "/search" ||
    path === "/guide" ||
    path === "/my-benefits" ||
    path === "/mypage" ||
    path.startsWith("/mypage/") ||
    path === "/terms" ||
    path === "/privacy" ||
    path === "/notices" ||
    path === "/auth/login" ||
    path === "/auth/signup"
  ) {
    return true;
  }

  return /^\/notices\/[^/]+$/.test(path);
}

export function getAnimatedBackgroundIntensity(pathname: string): AnimatedBackgroundIntensity {
  const path = normalizePath(pathname);

  if (usesSubtleTwinkle(path)) {
    return "subtle";
  }

  return "normal";
}
