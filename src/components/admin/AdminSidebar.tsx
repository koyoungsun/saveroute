/* eslint-disable @next/next/no-async-client-component */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "bi-speedometer2" },
  { label: "Brands", href: "/admin/brands", icon: "bi-shop" },
  { label: "Discounts", href: "/admin/discounts", icon: "bi-tags" },
  { label: "Benefit Categories", href: "/admin/benefit-categories", icon: "bi-diagram-3" },
  { label: "Providers", href: "/admin/providers", icon: "bi-building" },
  { label: "Benefit Products", href: "/admin/benefit-products", icon: "bi-credit-card-2-front" },
  { label: "Brand Requests", href: "/admin/brand-requests", icon: "bi-chat-dots" },
  { label: "Update Check", href: "/admin/update-check", icon: "bi-arrow-repeat" },
  { label: "Search Logs", href: "/admin/search-logs", icon: "bi-search" },
  { label: "Stats", href: "/admin/stats", icon: "bi-bar-chart" },
  { label: "Accounts", href: "/admin/accounts", icon: "bi-people" },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: "bi-shield-check" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sr-sidebar text-white flex-shrink-0 vh-100 overflow-auto border-end border-dark"
      style={{ width: "240px" }}
    >
      <div className="px-3 py-3 border-bottom border-secondary-subtle">
        <div className="fw-bold lh-1">SaveRoute</div>
        <div className="sr-sidebar-section-label mt-1">Admin Console</div>
      </div>

      <nav className="nav flex-column px-2 py-3 gap-1">
        <div className="px-2 pb-2 sr-sidebar-section-label">MENU</div>
        {menuItems.map((item) => (
          <div key={item.href} className="px-1">
          <Link
            href={item.href}
            className={[
              "sr-nav-link sr-nav-link nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3",
              pathname === item.href ? "sr-active" : "",
            ].join(" ")}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <i className={`bi ${item.icon} sr-nav-icon`} aria-hidden="true" />
            <span className="fw-semibold">{item.label}</span>
          </Link>
          </div>
        ))}
      </nav>
    </aside>
  );
}
