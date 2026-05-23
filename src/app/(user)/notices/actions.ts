"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveAdminGate } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type NoticeFormState = {
  error?: string;
};

function parseNoticeForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const isPublished = formData.get("is_published") === "on";

  if (!title) {
    return { error: "제목을 입력해 주세요." } as const;
  }

  if (!body) {
    return { error: "내용을 입력해 주세요." } as const;
  }

  return {
    title,
    body,
    isPublished,
  } as const;
}

async function requireAdminGate() {
  const gate = await resolveAdminGate();

  if (gate.type === "login") {
    redirect("/auth/login?next=/notices/manage");
  }

  if (gate.type !== "ok") {
    redirect("/notices");
  }

  return gate.adminUser;
}

export async function createNoticeAction(
  _prevState: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  const adminUser = await requireAdminGate();
  const parsed = parseNoticeForm(formData);

  if ("error" in parsed) {
    return parsed;
  }

  const supabase = createSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("app_notices").insert({
    title: parsed.title,
    body: parsed.body,
    is_published: parsed.isPublished,
    published_at: parsed.isPublished ? nowIso : null,
    created_by: adminUser.userId,
  });

  if (error) {
    return { error: `공지 저장에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/notices");
  revalidatePath("/notices/manage");
  redirect("/notices/manage");
}

export async function updateNoticeAction(
  noticeId: string,
  _prevState: NoticeFormState,
  formData: FormData,
): Promise<NoticeFormState> {
  await requireAdminGate();
  const parsed = parseNoticeForm(formData);

  if ("error" in parsed) {
    return parsed;
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("app_notices")
    .select("is_published,published_at")
    .eq("id", noticeId)
    .maybeSingle();

  if (readError || !existing) {
    return { error: "공지를 찾을 수 없습니다." };
  }

  const publishedAt =
    parsed.isPublished && !existing.is_published
      ? new Date().toISOString()
      : parsed.isPublished
        ? existing.published_at
        : null;

  const { error } = await supabase
    .from("app_notices")
    .update({
      title: parsed.title,
      body: parsed.body,
      is_published: parsed.isPublished,
      published_at: publishedAt,
    })
    .eq("id", noticeId);

  if (error) {
    return { error: `공지 수정에 실패했습니다: ${error.message}` };
  }

  revalidatePath("/notices");
  revalidatePath(`/notices/${noticeId}`);
  revalidatePath("/notices/manage");
  redirect("/notices/manage");
}

export async function deleteNoticeAction(noticeId: string) {
  await requireAdminGate();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("app_notices").delete().eq("id", noticeId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notices");
  revalidatePath("/notices/manage");
  redirect("/notices/manage");
}

export async function toggleNoticePublishedAction(noticeId: string, nextPublished: boolean) {
  await requireAdminGate();

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("app_notices")
    .select("published_at")
    .eq("id", noticeId)
    .maybeSingle();

  if (readError || !existing) {
    throw new Error("공지를 찾을 수 없습니다.");
  }

  const { error } = await supabase
    .from("app_notices")
    .update({
      is_published: nextPublished,
      published_at:
        nextPublished && !existing.published_at
          ? new Date().toISOString()
          : nextPublished
            ? existing.published_at
            : null,
    })
    .eq("id", noticeId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notices");
  revalidatePath("/notices/manage");
}

export async function toggleNoticePublishedFormAction(formData: FormData) {
  const noticeId = String(formData.get("noticeId") ?? "");
  const nextPublished = formData.get("nextPublished") === "true";
  await toggleNoticePublishedAction(noticeId, nextPublished);
}

export async function deleteNoticeFormAction(formData: FormData) {
  const noticeId = String(formData.get("noticeId") ?? "");
  await deleteNoticeAction(noticeId);
}
