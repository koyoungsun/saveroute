"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  createNoticeAction,
  updateNoticeAction,
} from "@/app/(user)/notices/actions";

type NoticeFormProps = {
  mode: "create" | "edit";
  noticeId?: string;
  initialTitle?: string;
  initialBody?: string;
  initialPublished?: boolean;
};

export function NoticeForm({
  mode,
  noticeId,
  initialTitle = "",
  initialBody = "",
  initialPublished = false,
}: NoticeFormProps) {
  const action =
    mode === "create"
      ? createNoticeAction
      : updateNoticeAction.bind(null, noticeId ?? "");

  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="sr-user-stack">
      <div>
        <label htmlFor="notice-title" className="text-sm font-semibold text-gray-700">
          제목
        </label>
        <input
          id="notice-title"
          name="title"
          type="text"
          required
          defaultValue={initialTitle}
          className="sr-user-input mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
          placeholder="공지 제목"
        />
      </div>

      <div>
        <label htmlFor="notice-body" className="text-sm font-semibold text-gray-700">
          내용
        </label>
        <textarea
          id="notice-body"
          name="body"
          required
          rows={10}
          defaultValue={initialBody}
          className="sr-user-input mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm leading-6"
          placeholder="공지 내용을 입력하세요."
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={initialPublished}
          className="size-4 rounded border-gray-300"
        />
        게시함 (체크하면 사용자에게 공개)
      </label>

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="sr-user-btn-primary inline-flex h-11 items-center justify-center rounded-3xl px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "저장 중..." : mode === "create" ? "공지 등록" : "수정 저장"}
        </button>
        <Link
          href="/notices/manage"
          className="sr-user-btn-secondary inline-flex h-11 items-center justify-center rounded-3xl px-5 text-sm font-semibold"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
