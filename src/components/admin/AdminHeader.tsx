"use client";

import type { AdminUser } from "@/lib/admin/auth";
import { formatStatusLabel } from "@/lib/ui/format-status-label";

export function AdminHeader({ adminUser }: { adminUser: AdminUser }) {
  return (
    <header className="sr-admin-header">
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
