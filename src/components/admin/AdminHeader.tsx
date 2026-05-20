"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import type { AdminUser } from "@/lib/admin/auth";
import { resolveAdminRouteMeta } from "@/lib/admin/admin-route-meta";
import { formatStatusLabel } from "@/lib/ui/format-status-label";

export function AdminHeader({ adminUser }: { adminUser: AdminUser }) {
  const pathname = usePathname();
  const activePathname = useSyncExternalStore(
    () => () => undefined,
    () => pathname ?? "",
    () => "",
  );
  const routeMeta = resolveAdminRouteMeta(activePathname);

  return (
    <header className="sr-admin-header">
      <div className="sr-admin-header-brand">
        <div className="sr-admin-header-title-row">
          <i
            className={`bi ${routeMeta.icon} sr-admin-frame-icon sr-admin-header-page-icon`}
            aria-hidden="true"
          />
          <h1 className="sr-admin-header-title mb-0">{routeMeta.title}</h1>
        </div>
        <div className="sr-admin-header-subtitle">CoreRoute 운영 콘솔</div>
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
    </header>
  );
}
