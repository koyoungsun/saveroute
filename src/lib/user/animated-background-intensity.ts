export type AnimatedBackgroundIntensity = "normal" | "subtle" | "none";

function normalizePath(pathname: string) {
  return pathname.split("?")[0]?.split("#")[0] ?? "";
}

export function getAnimatedBackgroundIntensity(pathname: string): AnimatedBackgroundIntensity {
  const path = normalizePath(pathname);

  if (path === "/" || path === "/search") {
    return "normal";
  }

  if (path === "/about" || path === "/guide" || path === "/onboarding") {
    return "normal";
  }

  if (
    path === "/mypage" ||
    path === "/my-benefits" ||
    path.startsWith("/mypage/") ||
    path === "/terms" ||
    path === "/privacy" ||
    path === "/notices" ||
    path === "/auth/login" ||
    path === "/auth/signup"
  ) {
    return "subtle";
  }

  if (/^\/notices\/[^/]+$/.test(path)) {
    return "subtle";
  }

  return "normal";
}
