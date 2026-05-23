"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { UserPage } from "@/components/layout/UserPage";
import { SearchHubChrome } from "@/components/search/SearchHubChrome";

export type EmptyStateVariant =
  | "default"
  | "no_keyword"
  | "unregistered_brand"
  | "no_registered_benefits"
  | "search_error";

interface EmptyStateProps {
  keyword?: string;
  variant?: EmptyStateVariant;
}

type Feedback =
  | "idle"
  | "loading"
  | "success"
  | "max_reached"
  | "error"
  | "unauthenticated";

const COPY: Record<
  EmptyStateVariant,
  { title: string; subtitle: string; showRequest?: boolean }
> = {
  no_keyword: {
    title: "어디서 할인받을 수 있을까요?",
    subtitle: "브랜드명을 검색하면 카드·통신사 혜택을 한번에 볼 수 있어요.",
    showRequest: false,
  },
  default: {
    title: "아직 할인 정보가 없어요.",
    subtitle: "요청하시면 업데이트 후보에 반영할게요.",
    showRequest: true,
  },
  unregistered_brand: {
    title: "아직 등록되지 않은 브랜드입니다.",
    subtitle: "원하시는 브랜드를 알려주시면 업데이트 검토에 참고할게요.",
    showRequest: true,
  },
  no_registered_benefits: {
    title: "등록된 보유 혜택이 없어요.",
    subtitle: "내 혜택을 추가하면 받을 수 있는 할인을 먼저 보여드려요.",
    showRequest: false,
  },
  search_error: {
    title: "검색 결과를 불러오지 못했어요.",
    subtitle: "잠시 후 다시 시도해 주세요. 문제가 계속되면 다른 브랜드를 검색해 보세요.",
    showRequest: false,
  },
};

const SHOW_SEARCH_EMPTY_HERO_IMAGE = false;

export function EmptyState({ keyword, variant = "default" }: EmptyStateProps) {
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (variant !== "default" && variant !== "unregistered_brand") {
      return;
    }

    const q = keyword?.trim();
    if (!q) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/brand-requests?keyword=${encodeURIComponent(q)}`,
          { credentials: "same-origin" },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { request_count?: number };
        if (!cancelled) {
          setRequestCount(typeof data.request_count === "number" ? data.request_count : 0);
        }
      } catch {
        if (!cancelled) setRequestCount(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [keyword, variant]);

  const handleRequest = async () => {
    const q = keyword?.trim();
    if (!q || submitting) return;

    setSubmitting(true);
    setFeedback("loading");
    try {
      const res = await fetch("/api/brand-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ keyword: q }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        status?: string;
        request_count?: number;
        error?: string;
      };

      if (res.status === 401) {
        setFeedback("unauthenticated");
        return;
      }

      if (!res.ok) {
        setFeedback("error");
        return;
      }

      if (data.status === "max_reached") {
        setFeedback("max_reached");
        if (typeof data.request_count === "number") {
          setRequestCount(data.request_count);
        }
        return;
      }

      setFeedback("success");
      if (typeof data.request_count === "number") {
        setRequestCount(data.request_count);
      }
    } catch {
      setFeedback("error");
    } finally {
      setSubmitting(false);
    }
  };

  const feedbackText =
    feedback === "loading"
      ? "요청 중..."
      : feedback === "success"
        ? "요청이 접수되었습니다."
        : feedback === "max_reached"
          ? "이미 최다 요청된 업체입니다."
          : feedback === "unauthenticated"
            ? "로그인 후 요청할 수 있어요."
            : feedback === "error"
              ? "요청 중 오류가 발생했습니다."
              : null;

  const count = requestCount ?? 0;
  const highlightPopular = count >= 3;
  const copy = COPY[variant];
  const showRequest = copy.showRequest !== false;
  const trimmedKeyword = keyword?.trim() ?? "";

  return (
    <UserPage tone="comfortable" className="sr-user-search-results-page">
      <div className="sr-user-search-results-rail sr-user-content-width">
        <SearchHubChrome variant="results" defaultValue={trimmedKeyword} />

        <div className="sr-user-search-results-list">
      <div className="sr-user-search-empty sr-user-search-panel sr-user-search-panel--empty text-center">
        {SHOW_SEARCH_EMPTY_HERO_IMAGE ? (
          <div className="sr-user-card mb-4 w-[min(500px,88vw)] overflow-hidden p-3">
            <Image
              src="/icons/icon_noimg.png"
              alt=""
              width={500}
              height={500}
              className="h-auto w-full object-contain"
              sizes="(max-width: 500px) 88vw, 500px"
              aria-hidden
            />
          </div>
        ) : null}

        {trimmedKeyword ? (
          <p className="sr-user-t-body sr-user-search-panel__body">
            <span className="sr-user-search-results-header__brand">{trimmedKeyword}</span> 검색 결과
          </p>
        ) : null}

        <h1 className="sr-user-t-page-title sr-user-search-panel__title mt-2 leading-snug">
          {copy.title}
        </h1>
        <p className="sr-user-t-body sr-user-search-panel__body mx-auto mt-2 max-w-md">{copy.subtitle}</p>

        {variant === "no_keyword" ? (
          <Link href="/" className="sr-user-search-panel__secondary sr-user-btn-secondary sr-user-btn-secondary--block mx-auto mt-6 max-w-xs">
            홈으로
          </Link>
        ) : null}

        {variant === "no_registered_benefits" ? (
          <Link
            href="/my-benefits"
            className="sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--block mx-auto mt-6 max-w-xs"
          >
            내 혜택 추가하기
          </Link>
        ) : null}

        {variant === "search_error" ? (
          <div className="mx-auto mt-6 flex w-full max-w-xs flex-col gap-2">
            {trimmedKeyword ? (
              <Link
                href={`/search?keyword=${encodeURIComponent(trimmedKeyword)}`}
                className="sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--block"
              >
                다시 검색하기
              </Link>
            ) : null}
            <Link href="/" className="sr-user-search-panel__secondary sr-user-btn-secondary sr-user-btn-secondary--block">
              홈으로
            </Link>
          </div>
        ) : null}

        {showRequest ? (
          <>
            <button
              type="button"
              onClick={() => void handleRequest()}
              disabled={submitting}
              className="sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--block mx-auto mt-6 max-w-xs disabled:opacity-50"
            >
              업데이트 요청하기
            </button>
            {feedback === "unauthenticated" ? (
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(`/search?keyword=${encodeURIComponent(keyword ?? "")}`)}`}
                className="sr-user-link sr-user-t-body mt-3 inline-block font-semibold underline-offset-2 hover:underline"
              >
                로그인하고 요청하기
              </Link>
            ) : null}
          </>
        ) : null}

        {feedbackText ? (
          <p className="sr-user-t-body sr-user-canvas-text-secondary mt-3" role="status" aria-live="polite">
            {feedbackText}
          </p>
        ) : null}

        {showRequest ? (
          <p
            className={
              highlightPopular
                ? "sr-user-accent-text sr-user-t-muted mt-3 font-semibold"
                : "sr-user-t-muted sr-user-canvas-text-muted mt-3"
            }
          >
            요청 수가 많은 업체부터 먼저 확인합니다.
            {count > 0 ? ` (현재 요청 ${count}회)` : null}
          </p>
        ) : null}
      </div>
        </div>
      </div>
    </UserPage>
  );
}
