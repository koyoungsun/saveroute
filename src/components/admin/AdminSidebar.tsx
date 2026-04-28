/* eslint-disable @next/next/no-async-client-component */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Brands", href: "/admin/brands" },
  { label: "Discounts", href: "/admin/discounts" },
  { label: "Benefit Categories", href: "/admin/benefit-categories" },
  { label: "Providers", href: "/admin/providers" },
  { label: "Benefit Products", href: "/admin/benefit-products" },
  { label: "Brand Requests", href: "/admin/brand-requests" },
  { label: "Update Check", href: "/admin/update-check" },
  { label: "Search Logs", href: "/admin/search-logs" },
  { label: "Stats", href: "/admin/stats" },
  { label: "Accounts", href: "/admin/accounts" },
  { label: "Audit Logs", href: "/admin/audit-logs" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="bg-dark text-white flex-shrink-0 vh-100 overflow-auto border-end border-dark"
      style={{ width: "240px" }}
    >
      <div className="px-3 py-3 border-bottom border-secondary-subtle">
        <div className="fw-bold lh-1">SaveRoute</div>
        <div className="text-white-50 small mt-1">Admin Console</div>
      </div>

      <nav className="nav nav-pills flex-column px-2 py-3 gap-1">
        {menuItems.map((item) => (
          <div key={item.href} className="px-1">
          <Link
            href={item.href}
            className={[
              "nav-link d-flex align-items-center justify-content-between px-3 py-2",
              pathname === item.href
                ? "active bg-primary text-white"
                : "text-white-50",
            ].join(" ")}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            <span className="small fw-semibold">{item.label}</span>
          </Link>
          </div>
        ))}
      </nav>
    </aside>
  );
}
