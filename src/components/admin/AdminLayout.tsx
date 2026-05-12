import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminUser } from "@/lib/admin/auth";

interface AdminLayoutProps {
  children: React.ReactNode;
  adminUser: AdminUser;
}

export function AdminLayout({ children, adminUser }: AdminLayoutProps) {
  return (
    <div className="sr-admin d-flex w-100 vh-100">
      <AdminSidebar />

      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <AdminHeader adminUser={adminUser} />
        <main className="container-fluid p-4 overflow-auto flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
}
