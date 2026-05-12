"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

const benefitChildren = [
  {
    id: "benefit-categories",
    label: "혜택 카테고리",
    href: "/admin/benefit-categories",
    icon: "bi-diagram-3",
  },
  {
    id: "providers",
    label: "제공사 관리",
    href: "/admin/providers",
    icon: "bi-building",
  },
  {
    id: "benefit-products",
    label: "혜택 상품 관리",
    href: "/admin/benefit-products",
    icon: "bi-credit-card-2-front",
  },
] as const;

const benefitHrefs = benefitChildren.map((c) => c.href);

const topNavItems = [
  { id: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: "bi-speedometer2" },
  { id: "brands", label: "브랜드 관리", href: "/admin/brands", icon: "bi-shop" },
  { id: "discounts", label: "할인 관리", href: "/admin/discounts", icon: "bi-tags" },
] as const;

const midNavItems = [
  { id: "brand-requests", label: "브랜드 요청", href: "/admin/brand-requests", icon: "bi-chat-dots" },
  { id: "promo-slots", label: "추천 구좌 관리", href: "/admin/promo-slots", icon: "bi-megaphone" },
  { id: "search-logs", label: "검색 로그", href: "/admin/search-logs", icon: "bi-search" },
  { id: "stats", label: "통계", href: "/admin/stats", icon: "bi-bar-chart" },
  {
    id: "data-seed-guide",
    label: "데이터 시드 가이드",
    href: "/admin/data-seed-guide",
    icon: "bi-clipboard-data",
  },
  { id: "update-check", label: "업데이트 확인", href: "/admin/update-check", icon: "bi-arrow-repeat" },
  { id: "accounts", label: "관리자 계정", href: "/admin/accounts", icon: "bi-people" },
  { id: "audit-logs", label: "감사 로그", href: "/admin/audit-logs", icon: "bi-shield-check" },
] as const;

function isBenefitSectionActive(activePathname: string) {
  return benefitHrefs.some(
    (href) => activePathname === href || activePathname.startsWith(`${href}/`),
  );
}

function NavLink({
  href,
  label,
  icon,
  activePathname,
  sub = false,
}: {
  href: string;
  label: string;
  icon: string;
  activePathname: string;
  sub?: boolean;
}) {
  const isActive = activePathname === href || activePathname.startsWith(`${href}/`);

  return (
    <div className="px-1">
      <Link
        href={href}
        className={[
          "sr-nav-link nav-link d-flex align-items-center gap-2 py-2 rounded-3",
          sub ? "sr-nav-sublink px-3 ps-4 ms-2" : "px-3",
          isActive ? "sr-active" : "",
        ].join(" ")}
        aria-current={isActive ? "page" : undefined}
      >
        <i className={`bi ${icon} sr-nav-icon flex-shrink-0`} aria-hidden="true" />
        <span className={sub ? "fw-medium" : "fw-semibold"}>{label}</span>
      </Link>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const activePathname = useSyncExternalStore(
    () => () => undefined,
    () => pathname ?? "",
    () => "",
  );

  const benefitSectionActive = useMemo(() => isBenefitSectionActive(activePathname), [activePathname]);

  const [benefitsManuallyOpen, setBenefitsManuallyOpen] = useState(false);
  const benefitsOpen = benefitSectionActive || benefitsManuallyOpen;

  return (
    <aside
      className="sr-sidebar text-white flex-shrink-0 vh-100 overflow-auto border-end border-dark"
      style={{ width: "240px" }}
    >
      <div className="px-3 py-3 border-bottom border-secondary-subtle">
        <div className="fw-bold lh-1">SaveRoute</div>
        <div className="sr-sidebar-section-label mt-1">Admin Console</div>
      </div>

      <nav className="nav flex-column px-2 py-3 gap-1" aria-label="관리자 메뉴">
        <div className="px-2 pb-2 sr-sidebar-section-label">MENU</div>

        {topNavItems.map((item) => (
          <NavLink key={item.id} {...item} activePathname={activePathname} />
        ))}

        <div className="px-1 pt-1">
          <button
            type="button"
            className={[
              "sr-nav-group-toggle nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 w-100 text-start border-0",
              benefitSectionActive ? "sr-active" : "",
            ].join(" ")}
            aria-expanded={benefitsOpen}
            aria-controls="admin-sidebar-benefit-subnav"
            id="admin-sidebar-benefit-heading"
            onClick={() => setBenefitsManuallyOpen((open) => !open)}
          >
            <i className="bi bi-stack sr-nav-icon flex-shrink-0" aria-hidden="true" />
            <span className="fw-semibold flex-grow-1">혜택 데이터</span>
            <i
              className={`bi ${benefitsOpen ? "bi-chevron-down" : "bi-chevron-right"} flex-shrink-0 opacity-75`}
              aria-hidden="true"
            />
          </button>

          <div
            id="admin-sidebar-benefit-subnav"
            role="region"
            aria-labelledby="admin-sidebar-benefit-heading"
            className={benefitsOpen ? "mt-1 d-flex flex-column gap-1" : "d-none"}
          >
            {benefitChildren.map((item) => (
              <NavLink key={item.id} {...item} activePathname={activePathname} sub />
            ))}
          </div>
        </div>

        {midNavItems.map((item) => (
          <NavLink key={item.id} {...item} activePathname={activePathname} />
        ))}
      </nav>
    </aside>
  );
}
