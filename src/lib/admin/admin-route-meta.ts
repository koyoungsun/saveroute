export type AdminRouteMeta = {
  title: string;
  icon: string;
};

const ADMIN_ROUTE_ENTRIES: { prefix: string; meta: AdminRouteMeta }[] = [
  { prefix: "/admin/dashboard", meta: { title: "Dashboard", icon: "bi-speedometer2" } },
  { prefix: "/admin/brands", meta: { title: "브랜드 관리", icon: "bi-shop" } },
  { prefix: "/admin/discounts", meta: { title: "할인 관리", icon: "bi-tags" } },
  { prefix: "/admin/benefit-categories", meta: { title: "혜택 카테고리", icon: "bi-diagram-3" } },
  { prefix: "/admin/providers", meta: { title: "제공사 관리", icon: "bi-building" } },
  { prefix: "/admin/benefit-products", meta: { title: "혜택 상품 관리", icon: "bi-credit-card-2-front" } },
  { prefix: "/admin/brand-requests", meta: { title: "브랜드 요청", icon: "bi-chat-dots" } },
  { prefix: "/admin/promo-slots", meta: { title: "추천 구좌 관리", icon: "bi-megaphone" } },
  { prefix: "/admin/search-logs", meta: { title: "검색 로그", icon: "bi-search" } },
  { prefix: "/admin/stats", meta: { title: "통계", icon: "bi-bar-chart" } },
  { prefix: "/admin/data-seed-guide", meta: { title: "데이터 시드 가이드", icon: "bi-clipboard-data" } },
  { prefix: "/admin/update-check", meta: { title: "업데이트 확인", icon: "bi-arrow-repeat" } },
  { prefix: "/admin/accounts", meta: { title: "관리자 계정", icon: "bi-people" } },
  { prefix: "/admin/audit-logs", meta: { title: "감사 로그", icon: "bi-shield-check" } },
];

const DEFAULT_ROUTE_META: AdminRouteMeta = {
  title: "SaveRoute Admin",
  icon: "bi-shield-check",
};

export function resolveAdminRouteMeta(pathname: string): AdminRouteMeta {
  const normalized = pathname.split("?")[0] ?? pathname;

  const matched = ADMIN_ROUTE_ENTRIES.find(
    (entry) =>
      normalized === entry.prefix || normalized.startsWith(`${entry.prefix}/`),
  );

  return matched?.meta ?? DEFAULT_ROUTE_META;
}
