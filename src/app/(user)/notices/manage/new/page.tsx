import Link from "next/link";
import { redirect } from "next/navigation";

import { NoticeForm } from "@/app/(user)/notices/NoticeForm";
import { UserPage } from "@/components/layout/UserPage";
import { resolveAdminGate } from "@/lib/admin/auth";

export default async function NewNoticePage() {
  const gate = await resolveAdminGate();

  if (gate.type === "login") {
    redirect("/auth/login?next=/notices/manage/new");
  }

  if (gate.type !== "ok") {
    redirect("/notices");
  }

  return (
    <UserPage tone="comfortable" className="sr-user-stack">
      <div>
        <Link href="/notices/manage" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← 공지 관리
        </Link>
        <h1 className="mt-3 text-2xl font-black text-gray-950">새 공지 작성</h1>
      </div>

      <section className="sr-user-card rounded-3xl p-6">
        <NoticeForm mode="create" />
      </section>
    </UserPage>
  );
}
