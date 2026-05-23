const DATA_PAGE_PREFIXES = [
  "/search",
  "/mypage",
  "/my-benefits",
  "/notices",
  "/onboarding",
] as const;

const STATIC_PAGE_PATHS = new Set([
  "/terms",
  "/privacy",
  "/guide",
  "/about",
]);

export function isDataPageRoute(pathname: string) {
  if (pathname === "/") {
    return false;
  }

  if (STATIC_PAGE_PATHS.has(pathname)) {
    return false;
  }

  if (/^\/notices\/[^/]+$/.test(pathname) && !pathname.startsWith("/notices/manage")) {
    return false;
  }

  return DATA_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isStaticPageRoute(pathname: string) {
  if (STATIC_PAGE_PATHS.has(pathname)) {
    return true;
  }

  if (/^\/notices\/[^/]+$/.test(pathname) && !pathname.startsWith("/notices/manage")) {
    return true;
  }

  return false;
}
