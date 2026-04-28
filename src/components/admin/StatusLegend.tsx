"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";

type LegendType = "discount" | "request" | "account" | "generic";

type LegendItem = {
  key: string;
  badgeText: string;
  statusForBadge?: string;
  description: string;
};

const legends: Record<LegendType, { title: string; items: LegendItem[] }> = {
  discount: {
    title: "상태 안내 (할인)",
    items: [
      {
        key: "draft",
        badgeText: "draft",
        statusForBadge: "draft",
        description: "미노출",
      },
      {
        key: "active",
        badgeText: "active",
        statusForBadge: "active",
        description: "사용자 노출",
      },
      {
        key: "expired",
        badgeText: "expired",
        statusForBadge: "expired",
        description: "만료",
      },
      {
        key: "hidden",
        badgeText: "hidden",
        statusForBadge: "hidden",
        description: "비노출",
      },
    ],
  },
  request: {
    title: "상태 안내 (요청)",
    items: [
      {
        key: "pending",
        badgeText: "pending",
        statusForBadge: "pending",
        description: "대기",
      },
      {
        key: "processing",
        badgeText: "processing",
        statusForBadge: "processing",
        description: "처리중",
      },
      {
        key: "completed",
        badgeText: "completed",
        statusForBadge: "completed",
        description: "반영 완료",
      },
      {
        key: "ignored",
        badgeText: "ignored",
        statusForBadge: "ignored",
        description: "제외",
      },
    ],
  },
  account: {
    title: "상태/권한 안내 (계정)",
    items: [
      {
        key: "active",
        badgeText: "active",
        statusForBadge: "active",
        description: "접근 가능",
      },
      {
        key: "inactive",
        badgeText: "inactive",
        statusForBadge: "inactive",
        description: "접근 제한",
      },
      {
        key: "master",
        badgeText: "master",
        description: "전체 권한",
      },
      {
        key: "operator",
        badgeText: "operator",
        description: "운영 권한",
      },
    ],
  },
  generic: {
    title: "상태 안내",
    items: [
      {
        key: "active",
        badgeText: "active",
        statusForBadge: "active",
        description: "사용중",
      },
      {
        key: "hidden",
        badgeText: "hidden",
        statusForBadge: "hidden",
        description: "숨김",
      },
      {
        key: "pending",
        badgeText: "pending",
        statusForBadge: "pending",
        description: "대기",
      },
      {
        key: "completed",
        badgeText: "completed",
        statusForBadge: "completed",
        description: "완료",
      },
    ],
  },
};

export function StatusLegend({
  type,
  className,
}: {
  type: LegendType;
  className?: string;
}) {
  const legend = legends[type];

  return (
    <div
      className={["sr-status-legend", className].filter(Boolean).join(" ")}
      role="note"
      aria-label="Notice"
    >
      <div className="text-muted" style={{ fontSize: "12px", lineHeight: 1.55 }}>
        <span className="me-2">{legend.title}:</span>
        <span className="d-inline-flex flex-wrap gap-2">
          {legend.items.map((item) => (
            <span key={item.key} className="d-inline-flex align-items-center gap-1">
              {item.statusForBadge ? (
                <StatusBadge status={item.statusForBadge} />
              ) : (
                <span className="badge text-bg-light text-dark border px-2 py-1 fw-semibold">
                  {item.badgeText}
                </span>
              )}
              <span className="text-muted">:</span>
              <span className="text-muted">{item.description}</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

