"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type EmptyStateVariant =
  | "default"
  | "unregistered_brand"
  | "no_registered_benefits";

interface EmptyStateProps {
  keyword?: string;
  variant?: EmptyStateVariant;
}

type Feedback = "idle" | "loading" | "success" | "max_reached" | "error";

const COPY: Record<
  EmptyStateVariant,
  { title: string; subtitle: string }
> = {
  default: {
    title: "아직 할인 정보가 없어요.",
    subtitle: "요청하시면 업데이트 후보에 반영할게요.",
  },
  unregistered_brand: {
    title: "아직 등록되지 않은 브랜드입니다.",
    subtitle: "원하시는 브랜드를 알려주시면 업데이트 검토에 참고할게요.",
  },
  no_registered_benefits: {
    title: "등록된 보유혜택이 없습니다.",
    subtitle: "내 혜택을 추가하면 맞춤 할인을 볼 수 있어요.",
  },
};

export function EmptyState({ keyword, variant = "default" }: EmptyStateProps) {
  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (variant === "no_registered_benefits") {
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

  const copy = COPY[variant];

  return (
    <div className="flex flex-col items-center px-4 pt-16 text-center">
      <div className="mb-4 w-[500px] max-w-full">
        <Image
          src="/icons/icon_noimg.png"
          alt=""
          width={500}
          height={500}
          className="h-auto w-full object-contain"
          sizes="500px"
          aria-hidden
        />
      </div>
      <h1 className="-mt-[30px] text-[1.6875rem] font-semibold leading-snug text-[#409A53]">
        {copy.title}
      </h1>
      <p className="mt-2 text-sm text-gray-500">{copy.subtitle}</p>

      {variant === "no_registered_benefits" ? (
        <a
          href="/my-benefits"
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-3xl bg-sr-primary font-medium text-white hover:bg-sr-primary-hover"
        >
          내 혜택 추가하기
        </a>
      ) : (
        <button
          type="button"
          onClick={() => void handleRequest()}
          disabled={submitting}
          className="mt-6 flex h-12 w-full max-w-xs items-center justify-center rounded-3xl bg-sr-primary font-medium text-white hover:bg-sr-primary-hover disabled:opacity-50"
        >
          업데이트 요청하기
        </button>
      )}

      {feedbackText ? (
        <p
          className="mt-3 text-sm text-gray-600"
          role="status"
          aria-live="polite"
        >
          {feedbackText}
        </p>
      ) : null}

      {variant === "no_registered_benefits" ? null : (
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
      )}
    </div>
  );
}
