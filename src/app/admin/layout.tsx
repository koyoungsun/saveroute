import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./admin.css";

import { redirect } from "next/navigation";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { resolveAdminGate } from "@/lib/admin/auth";

const spoqaHanSansNeoCss =
  "https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css";
const notoSansKrCss =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap";

export default async function AdminRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gate = await resolveAdminGate();

  if (gate.type === "login") {
    redirect(`/auth/login?redirect=${encodeURIComponent("/admin/dashboard")}`);
  }

  if (gate.type === "denied") {
    redirect("/");
  }

  if (gate.type === "schema") {
    return (
      <>
        <link rel="stylesheet" href={spoqaHanSansNeoCss} />
        <link rel="stylesheet" href={notoSansKrCss} />
        <div className="sr-admin container py-5">
          <div className="alert alert-danger shadow-sm border-0" role="alert">
            <div className="fw-bold mb-2">관리자 권한 확인 중 데이터베이스 오류</div>
            <p className="mb-3 small">
              다음 내용으로 테이블/컬럼 누락이나 마이그레이션 미적용 여부를 판별할 수 있습니다.
            </p>
            <pre
              className="mb-0 p-3 bg-white border rounded small"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: "60vh", overflow: "auto" }}
            >
              {gate.detail}
            </pre>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link rel="stylesheet" href={spoqaHanSansNeoCss} />
      <link rel="stylesheet" href={notoSansKrCss} />
      <AdminLayout adminUser={gate.adminUser}>{children}</AdminLayout>
    </>
  );
}
