"use client";

import type { AdminUser } from "@/lib/admin/auth";
import { formatStatusLabel } from "@/lib/ui/format-status-label";
import { usePathname } from "next/navigation";

const ADMIN_ROUTE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/admin/dashboard", title: "Dashboard" },
  { prefix: "/admin/brands", title: "브랜드관리" },
  { prefix: "/admin/discounts", title: "할인관리" },
  { prefix: "/admin/providers", title: "제공사관리" },
  { prefix: "/admin/benefit-products", title: "혜택상품관리" },
  { prefix: "/admin/benefit-categories", title: "혜택카테고리" },
  { prefix: "/admin/stats", title: "통계" },
  { prefix: "/admin/search-logs", title: "검색로그" },
  { prefix: "/admin/brand-requests", title: "브랜드요청" },
  { prefix: "/admin/benefit-product-requests", title: "카드요청" },
  { prefix: "/admin/promo-slots", title: "추천구좌관리" },
  { prefix: "/admin/update-check", title: "업데이트확인" },
  { prefix: "/admin/accounts", title: "관리자계정" },
  { prefix: "/admin/audit-logs", title: "감사로그" },
];

function pickAdminHeaderTitle(pathname: string) {
  const path = (pathname ?? "").trim();
  if (!path.startsWith("/admin")) return "";

  // longest prefix match
  let best: { prefix: string; title: string } | null = null;
  for (const entry of ADMIN_ROUTE_TITLES) {
    if (path === entry.prefix || path.startsWith(`${entry.prefix}/`)) {
      if (!best || entry.prefix.length > best.prefix.length) {
        best = entry;
      }
    }
  }
  return best?.title ?? "Admin";
}

export function AdminHeader({ adminUser }: { adminUser: AdminUser }) {
  const pathname = usePathname();
  const title = pickAdminHeaderTitle(pathname ?? "");

  return (
    <header className="sr-admin-header">
      <div className="sr-admin-header-inner">
        <div className="sr-admin-header-title" aria-label="현재 페이지">
          {title}
        </div>
        <div className="sr-admin-header-actions">
          <span className="sr-admin-header-email d-none d-md-inline">
            <i className="bi bi-person-circle sr-admin-frame-icon me-1" aria-hidden="true" />
            {adminUser.email ?? adminUser.userId}
          </span>
          <span className="sr-role-badge badge rounded-pill px-3 py-2">
            {formatStatusLabel(adminUser.role)}
          </span>
          <button type="button" className="btn btn-sm sr-admin-header-btn">
            <i className="bi bi-box-arrow-right sr-admin-frame-icon me-1" aria-hidden="true" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
