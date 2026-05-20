"use client";

import { StatusBadge } from "@/components/admin/StatusBadge";

type LegendType = "discount" | "request" | "account" | "generic";

type LegendItem = {
  key: string;
  statusForBadge: string;
  description: string;
};

const legends: Record<LegendType, { title: string; items: LegendItem[] }> = {
  discount: {
    title: "상태 안내 (할인)",
    items: [
      {
        key: "draft",
        statusForBadge: "draft",
        description: "미노출",
      },
      {
        key: "active",
        statusForBadge: "active",
        description: "사용자 노출",
      },
      {
        key: "expired",
        statusForBadge: "expired",
        description: "만료",
      },
      {
        key: "hidden",
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
        statusForBadge: "pending",
        description: "신규·재요청 대기",
      },
      {
        key: "reviewing",
        statusForBadge: "reviewing",
        description: "검토·등록 진행 중",
      },
      {
        key: "completed",
        statusForBadge: "completed",
        description: "브랜드 반영 완료",
      },
      {
        key: "rejected",
        statusForBadge: "rejected",
        description: "중복·불필요 등 반려",
      },
    ],
  },
  account: {
    title: "상태/권한 안내 (계정)",
    items: [
      {
        key: "active",
        statusForBadge: "active",
        description: "접근 가능",
      },
      {
        key: "inactive",
        statusForBadge: "inactive",
        description: "접근 제한",
      },
      {
        key: "master",
        statusForBadge: "master",
        description: "전체 권한",
      },
      {
        key: "operator",
        statusForBadge: "operator",
        description: "운영 권한",
      },
    ],
  },
  generic: {
    title: "상태 안내",
    items: [
      {
        key: "active",
        statusForBadge: "active",
        description: "사용중",
      },
      {
        key: "hidden",
        statusForBadge: "hidden",
        description: "숨김",
      },
      {
        key: "pending",
        statusForBadge: "pending",
        description: "대기",
      },
      {
        key: "completed",
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
              <StatusBadge status={item.statusForBadge} />
              <span className="text-muted">:</span>
              <span className="text-muted">{item.description}</span>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

