"use client";

import Link from "next/link";
import { SearchX, type LucideIcon } from "lucide-react";
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

type EmptyStateCopy = {
  title: string;
  subtitle: string;
  showRequest?: boolean;
  icon?: LucideIcon;
  showSimilarSearchLink?: boolean;
};

const COPY: Record<EmptyStateVariant, EmptyStateCopy> = {
  no_keyword: {
    title: "어디서 할인받을 수 있을까요?",
    subtitle: "브랜드명을 검색하면 카드·통신사 혜택을 한번에 볼 수 있어요.",
    showRequest: false,
  },
  default: {
    title: "검색 결과를 찾지 못했어요",
    subtitle: "원하시는 브랜드를 알려주시면\n우선 검토 후 추가할게요.",
    showRequest: true,
    showSimilarSearchLink: true,
  },
  unregistered_brand: {
    title: "아직 등록되지 않은 브랜드예요",
    subtitle: "원하시는 브랜드를 알려주시면\n우선 검토 후 추가할게요.",
    showRequest: true,
    showSimilarSearchLink: true,
  },
  no_registered_benefits: {
    title: "등록된 보유 혜택이 없어요",
    subtitle: "내 혜택을 추가하면 받을 수 있는 할인을 먼저 보여드려요.",
    showRequest: false,
  },
  search_error: {
    title: "검색 결과를 불러오지 못했어요",
    subtitle: "잠시 후 다시 시도해 주세요.\n문제가 계속되면 다른 브랜드를 검색해 보세요.",
    showRequest: false,
  },
};

function shouldHideSearchChromeActions(variant: EmptyStateVariant) {
  return (
    variant === "default" ||
    variant === "unregistered_brand" ||
    variant === "search_error" ||
    variant === "no_registered_benefits"
  );
}

function EmptyStateIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="sr-user-search-empty-state__icon-wrap" aria-hidden="true">
      <Icon className="sr-user-search-empty-state__icon" strokeWidth={1.75} />
    </div>
  );
}

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
        ? "요청이 접수되었어요."
        : feedback === "max_reached"
          ? "이미 최다 요청된 업체예요."
          : feedback === "unauthenticated"
            ? "로그인 후 요청할 수 있어요."
            : feedback === "error"
              ? "요청 중 오류가 발생했어요."
              : null;

  const count = requestCount ?? 0;
  const copy = COPY[variant];
  const showRequest = copy.showRequest !== false;
  const trimmedKeyword = keyword?.trim() ?? "";
  const hideSearchActions = shouldHideSearchChromeActions(variant);
  const Icon = copy.icon ?? SearchX;

  return (
    <UserPage tone="comfortable" className="sr-user-search-results-page">
      <div className="sr-user-search-results-rail sr-user-content-width">
        <SearchHubChrome
          variant="results"
          defaultValue={trimmedKeyword}
          hideSuggestions={hideSearchActions}
          hideSubmitButton={hideSearchActions}
        />

        <div className="sr-user-search-results-list">
          <div className="sr-user-search-empty-state">
            <EmptyStateIcon icon={Icon} />

            <h1 className="sr-user-search-empty-state__title">{copy.title}</h1>
            <p className="sr-user-search-empty-state__description">
              {copy.subtitle.split("\n").map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </p>

            {variant === "no_keyword" ? (
              <Link
                href="/"
                className="sr-user-search-empty-state__cta sr-user-search-panel__secondary sr-user-btn-secondary sr-user-btn-secondary--block"
              >
                홈으로
              </Link>
            ) : null}

            {variant === "no_registered_benefits" ? (
              <Link
                href="/my-benefits"
                className="sr-user-search-empty-state__cta sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--block"
              >
                내 혜택 추가하기
              </Link>
            ) : null}

            {variant === "search_error" ? (
              <div className="sr-user-search-empty-state__actions">
                {trimmedKeyword ? (
                  <Link
                    href={`/search?keyword=${encodeURIComponent(trimmedKeyword)}`}
                    className="sr-user-search-empty-state__cta sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--block"
                  >
                    다시 검색하기
                  </Link>
                ) : null}
                <Link
                  href="/"
                  className="sr-user-search-empty-state__cta sr-user-search-panel__secondary sr-user-btn-secondary sr-user-btn-secondary--block"
                >
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
                  className="sr-user-search-empty-state__cta sr-user-search-form__submit sr-user-btn-primary sr-user-btn-primary--block disabled:opacity-50"
                >
                  업데이트 요청하기
                </button>

                {feedback === "unauthenticated" ? (
                  <Link
                    href={`/auth/login?redirect=${encodeURIComponent(`/search?keyword=${encodeURIComponent(keyword ?? "")}`)}`}
                    className="sr-user-search-empty-state__link"
                  >
                    로그인하고 요청하기
                  </Link>
                ) : null}

                {feedbackText ? (
                  <p
                    className="sr-user-search-empty-state__feedback"
                    role="status"
                    aria-live="polite"
                  >
                    {feedbackText}
                  </p>
                ) : null}

                <p className="sr-user-search-empty-state__helper">
                  요청이 많은 브랜드부터 먼저 확인해요
                  {count > 0 ? ` · 현재 ${count}회` : null}
                </p>

                {copy.showSimilarSearchLink ? (
                  <Link href="/" className="sr-user-search-empty-state__link">
                    비슷한 브랜드 검색해보기
                  </Link>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </UserPage>
  );
}
