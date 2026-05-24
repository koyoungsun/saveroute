import Link from "next/link";
import { notFound } from "next/navigation";

import { ContentPageShell } from "@/components/layout/ContentPageShell";
import { formatNoticeDate, toAppNotice, type AppNoticeRow } from "@/lib/app-notices";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type NoticeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NoticeDetailPage({ params }: NoticeDetailPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("app_notices")
    .select("id,title,body,is_published,published_at,created_by,created_at,updated_at")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const notice = toAppNotice(data as AppNoticeRow);

  return (
    <ContentPageShell>
      <Link href="/notices" className="sr-user-content-page__back-link">
        ← 공지 목록
      </Link>

      <article className="sr-user-content-card">
        <p className="sr-user-content-page__meta">
          {formatNoticeDate(notice.publishedAt ?? notice.createdAt)}
        </p>
        <h1 className="sr-user-content-page__article-title">{notice.title}</h1>
        <div className="sr-user-content-page__prose sr-user-content-page__prose--pre">
          {notice.body}
        </div>
      </article>
    </ContentPageShell>
  );
}
