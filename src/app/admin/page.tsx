import { redirect } from "next/navigation";

/** /admin 접속 시 대시보드로 진입 */
export default function AdminIndexPage() {
  redirect("/admin/dashboard");
}
