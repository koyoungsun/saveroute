import Link from "next/link";

import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { formatNoticeDate, toAppNotice, type AppNoticeRow } from "@/lib/app-notices";
import { resolveAdminGate } from "@/lib/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NoticesPage() {
  const supabase = await createServerSupabaseClient();
  const gate = await resolveAdminGate();
  const isAdmin = gate.type === "ok";

  const { data, error } = await supabase
    .from("app_notices")
    .select("id,title,body,is_published,published_at,created_by,created_at,updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const notices = error ? [] : (data ?? []).map((row) => toAppNotice(row as AppNoticeRow));

  return (
    <ContentPageShell>
      <div className="sr-user-content-page__header">
        <header className="sr-user-account-page__intro">
          <h1 className="sr-user-account-page__title">공지사항</h1>
          <p className="sr-user-account-page__description">
            SaveRoute 서비스 업데이트와 안내를 확인하세요.
          </p>
        </header>
        {isAdmin ? (
          <Link
            href="/notices/manage"
            className="sr-user-btn-secondary sr-user-content-page__admin-link inline-flex h-10 shrink-0 items-center justify-center px-4 text-sm font-semibold"
          >
            관리
          </Link>
        ) : null}
      </div>

      <section className="sr-user-notice-list">
        {notices.length === 0 ? (
          <div className="sr-user-content-card sr-user-content-card--empty text-center">
            <p className="sr-user-content-page__prose">등록된 공지가 없습니다.</p>
          </div>
        ) : (
          notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/notices/${notice.id}`}
              className="sr-user-notice-list__item"
            >
              <p className="sr-user-content-page__meta">
                {formatNoticeDate(notice.publishedAt ?? notice.createdAt)}
              </p>
              <h2 className="sr-user-notice-list__title">{notice.title}</h2>
              <p className="sr-user-notice-list__excerpt">{notice.body}</p>
            </Link>
          ))
        )}
      </section>
    </ContentPageShell>
  );
}
