export type AdminAuditLogRow = {
  id: number;
  admin_user_id: string;
  action: string;
  target_table: string;
  target_id: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  create: "생성",
  update: "수정",
  deactivate: "비활성",
  status_change: "상태 변경",
};

const TARGET_LABELS: Record<string, string> = {
  brands: "브랜드",
  discounts: "할인",
  providers: "제공사",
  benefit_products: "혜택상품",
  promo_slots: "프로모션 슬롯",
  brand_requests: "업데이트 요청",
  benefit_product_requests: "카드 요청",
  provider_requests: "카드사 요청",
};

export function formatAuditActionLabel(action: string) {
  return ACTION_LABELS[action] ?? action;
}

export function formatAuditTargetLabel(targetTable: string) {
  return TARGET_LABELS[targetTable] ?? targetTable;
}

export function readAuditSummary(log: AdminAuditLogRow): string {
  const summary = log.after_data?.summary;
  if (typeof summary === "string" && summary.trim()) {
    return summary.trim();
  }

  const target = formatAuditTargetLabel(log.target_table);
  const action = formatAuditActionLabel(log.action);
  return `${target} ${action}`;
}

export function summarizeAuditMetadata(log: AdminAuditLogRow): string {
  const payload = log.after_data ?? log.before_data;
  if (!payload) {
    return "-";
  }

  const { summary: _summary, ...rest } = payload;
  const keys = Object.keys(rest);
  if (keys.length === 0) {
    return "-";
  }

  const preview = keys.slice(0, 4).map((key) => {
    const value = rest[key];
    if (value == null || value === "") {
      return `${key}: -`;
    }
    if (typeof value === "object") {
      return `${key}: ${JSON.stringify(value)}`;
    }
    return `${key}: ${String(value)}`;
  });

  return preview.join(" · ");
}
