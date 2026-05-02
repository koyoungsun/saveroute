"use client";

import { useEffect, useState } from "react";

interface EmptyStateProps {
  keyword?: string;
}

type Feedback = "idle" | "loading" | "success" | "max_reached" | "error";

export function EmptyState({ keyword }: EmptyStateProps) {
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
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
  }, [keyword]);

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

      if (res.status === 401 || !res.ok) {
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
          : feedback === "error"
            ? "요청 중 오류가 발생했습니다."
            : null;

  const count = requestCount ?? 0;
  const highlightPopular = count >= 3;

  return (
    <div className="flex flex-col items-center px-4 pt-16 text-center">
      <div className="mb-4 text-4xl" aria-hidden="true">
        🔍
      </div>
      <h1 className="text-lg font-semibold text-gray-800">
        아직 할인 정보가 없어요.
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        요청하시면 업데이트 후보에 반영할게요.
      </p>

      <button
        type="button"
        onClick={() => void handleRequest()}
        disabled={submitting}
        className="mt-6 w-full max-w-xs rounded-xl border border-blue-600 py-3 font-medium text-blue-600 disabled:opacity-50"
      >
        업데이트 요청하기
      </button>

      {feedbackText ? (
        <p
          className="mt-3 text-sm text-gray-600"
          role="status"
          aria-live="polite"
        >
          {feedbackText}
        </p>
      ) : null}

      <p
        className={
          highlightPopular
            ? "mt-3 text-xs font-semibold text-orange-600"
            : "mt-3 text-xs text-gray-400"
        }
      >
        요청 수가 많은 업체부터 먼저 확인합니다.
        {count > 0 ? ` (현재 요청 ${count}회)` : null}
      </p>
    </div>
  );
}
