import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./admin.css";

import { AdminLayout } from "@/components/admin/AdminLayout";

const spoqaHanSansNeoCss =
  "https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css";
const notoSansKrCss =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap";

export default function AdminRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href={spoqaHanSansNeoCss} />
      <link rel="stylesheet" href={notoSansKrCss} />
      <AdminLayout>{children}</AdminLayout>
    </>
  );
}
