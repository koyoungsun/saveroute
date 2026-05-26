import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminOpsPanel } from "@/components/admin/AdminOpsPanel";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminUser } from "@/lib/admin/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
  adminUser: AdminUser;
}

export function AdminLayout({ children, adminUser }: AdminLayoutProps) {
  return (
    <div className="sr-admin d-flex w-100 vh-100 overflow-hidden">
      <div className="sr-admin-ambient" aria-hidden="true" />

      <AdminSidebar />

      <div className="sr-admin-frame d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <AdminHeader adminUser={adminUser} />
        <div className="d-flex flex-grow-1 overflow-hidden">
          <main className="sr-admin-main container-fluid overflow-auto flex-grow-1">{children}</main>
          <AdminOpsPanel />
        </div>
      </div>
    </div>
  );
}
