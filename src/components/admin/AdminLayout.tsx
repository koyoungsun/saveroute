import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="d-flex w-100 vh-100">
      <AdminSidebar />

      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <AdminHeader />
        <main className="container-fluid p-4 overflow-auto flex-grow-1">
          {children}
        </main>
      </div>
    </div>
  );
}
