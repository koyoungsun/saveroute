import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { NoticeForm } from "@/app/(user)/notices/NoticeForm";
import { UserPage } from "@/components/layout/UserPage";
import { resolveAdminGate } from "@/lib/admin/auth";
import { toAppNotice, type AppNoticeRow } from "@/lib/app-notices";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type EditNoticePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditNoticePage({ params }: EditNoticePageProps) {
  const gate = await resolveAdminGate();

  if (gate.type === "login") {
    redirect("/auth/login?next=/notices/manage");
  }

  if (gate.type !== "ok") {
    redirect("/notices");
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_notices")
    .select("id,title,body,is_published,published_at,created_by,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const notice = toAppNotice(data as AppNoticeRow);

  return (
    <UserPage tone="comfortable" className="sr-user-stack">
      <div>
        <Link href="/notices/manage" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
          ← 공지 관리
        </Link>
        <h1 className="mt-3 text-2xl font-black text-gray-950">공지 수정</h1>
      </div>

      <section className="sr-user-card rounded-3xl p-6">
        <NoticeForm
          mode="edit"
          noticeId={notice.id}
          initialTitle={notice.title}
          initialBody={notice.body}
          initialPublished={notice.isPublished}
        />
      </section>
    </UserPage>
  );
}
