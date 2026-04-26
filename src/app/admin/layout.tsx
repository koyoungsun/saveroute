import "bootstrap/dist/css/bootstrap.min.css";

import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminLayout>{children}</AdminLayout>;
}
