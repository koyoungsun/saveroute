import Link from "next/link";
import { redirect } from "next/navigation";

import {
  deleteNoticeFormAction,
  toggleNoticePublishedFormAction,
} from "@/app/(user)/notices/actions";
import { UserPage } from "@/components/layout/UserPage";
import { resolveAdminGate } from "@/lib/admin/auth";
import { formatNoticeDate, toAppNotice, type AppNoticeRow } from "@/lib/app-notices";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function NoticesManagePage() {
  const gate = await resolveAdminGate();

  if (gate.type === "login") {
    redirect("/auth/login?next=/notices/manage");
  }

  if (gate.type !== "ok") {
    redirect("/notices");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_notices")
    .select("id,title,body,is_published,published_at,created_by,created_at,updated_at")
    .order("created_at", { ascending: false });

  const notices = error ? [] : (data ?? []).map((row) => toAppNotice(row as AppNoticeRow));

  return (
    <UserPage tone="comfortable" className="sr-user-stack">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-950">공지 관리</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            관리자만 공지를 작성·수정할 수 있습니다.
          </p>
        </div>
        <Link
          href="/notices/manage/new"
          className="sr-user-btn-primary inline-flex h-10 shrink-0 items-center justify-center rounded-3xl px-4 text-sm font-semibold text-white"
        >
          새 공지
        </Link>
      </div>

      <section className="sr-user-stack">
        {notices.length === 0 ? (
          <div className="sr-user-card rounded-3xl p-6 text-center">
            <p className="text-sm font-semibold text-gray-500">작성된 공지가 없습니다.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="sr-user-card rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        notice.isPublished
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {notice.isPublished ? "게시중" : "비공개"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatNoticeDate(notice.publishedAt ?? notice.createdAt)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-base font-black text-gray-950">{notice.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{notice.body}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/notices/manage/${notice.id}/edit`}
                    className="sr-user-btn-secondary inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-semibold"
                  >
                    수정
                  </Link>
                  <form action={toggleNoticePublishedFormAction}>
                    <input type="hidden" name="noticeId" value={notice.id} />
                    <input
                      type="hidden"
                      name="nextPublished"
                      value={notice.isPublished ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="sr-user-btn-secondary inline-flex h-9 items-center justify-center rounded-2xl px-3 text-xs font-semibold"
                    >
                      {notice.isPublished ? "비공개" : "게시"}
                    </button>
                  </form>
                  <form action={deleteNoticeFormAction}>
                    <input type="hidden" name="noticeId" value={notice.id} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <Link href="/notices" className="text-sm font-semibold text-gray-500 hover:text-gray-700">
        ← 공지사항으로
      </Link>
    </UserPage>
  );
}
