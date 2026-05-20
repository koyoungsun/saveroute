const STATUS_LABELS: Record<string, string> = {
  active: "활성",
  inactive: "비활성",
  pending: "대기중",
  approved: "승인",
  rejected: "반려",
  completed: "완료",
  processing: "처리중",
  success: "성공",
  failed: "실패",
  draft: "임시저장",
  deleted: "삭제됨",
  hidden: "숨김",
  expired: "종료됨",
  scheduled: "예약됨",
  published: "게시중",
  unpublished: "게시중지",
  enabled: "사용",
  disabled: "사용안함",
  warning: "주의",
  error: "오류",
  loading: "불러오는 중",
  reviewing: "검토중",
  ignored: "무시",
  matched: "매칭됨",
  unmatched: "미매칭",
  view_detail: "상세보기",
  use_discount: "할인 활용",
  high: "높음",
  medium: "보통",
  low: "낮음",
  master: "마스터",
  operator: "운영자",
  admin: "관리자",
  internal: "내부",
  external: "외부",
};

export const STATUS_BADGE_CLASS_NAMES: Record<string, string> = {
  active: "text-bg-warning",
  draft: "text-bg-light text-dark border",
  expired: "text-bg-danger",
  hidden: "text-bg-secondary",
  pending: "text-bg-warning",
  processing: "text-bg-warning",
  reviewing: "text-bg-info",
  completed: "text-bg-success",
  ignored: "text-bg-light text-dark border",
  rejected: "text-bg-secondary",
  approved: "text-bg-success",
  inactive: "text-bg-light text-dark border",
  scheduled: "text-bg-info",
  view_detail: "text-bg-info",
  use_discount: "text-bg-warning",
  matched: "text-bg-success",
  unmatched: "text-bg-secondary",
  success: "text-bg-success",
  failed: "text-bg-danger",
  master: "text-bg-dark",
  operator: "text-bg-primary",
  admin: "text-bg-primary",
  internal: "text-bg-light text-dark border",
  external: "text-bg-light text-dark border",
  high: "bg-success",
  medium: "bg-warning text-dark",
  low: "bg-danger",
};

export function formatStatusLabel(status: string | null | undefined): string {
  if (!status) {
    return "-";
  }

  const key = status.trim().toLowerCase();
  return STATUS_LABELS[key] ?? status;
}

export function getStatusBadgeClassName(status: string): string {
  const key = status.trim().toLowerCase();
  return STATUS_BADGE_CLASS_NAMES[key] ?? "text-bg-light text-dark border";
}

export const DISCOUNT_STATUS_OPTIONS = [
  { value: "draft", label: "임시저장" },
  { value: "active", label: "활성" },
  { value: "expired", label: "종료됨" },
  { value: "hidden", label: "숨김" },
] as const;

export const BRAND_STATUS_FILTER_OPTIONS = [
  { value: "active", label: "활성" },
  { value: "hidden", label: "숨김" },
] as const;

export const BRAND_REQUEST_STATUS_OPTIONS = [
  { value: "pending", label: "대기중" },
  { value: "reviewing", label: "검토중" },
  { value: "completed", label: "완료" },
  { value: "rejected", label: "반려" },
] as const;

export const BENEFIT_PRODUCT_REQUEST_STATUS_OPTIONS = [
  { value: "pending", label: "대기중" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
] as const;

export const PROVIDER_REQUEST_STATUS_OPTIONS = [
  { value: "pending", label: "대기중" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
] as const;

export const SEARCH_RESULT_STATUS_OPTIONS = [
  { value: "matched", label: "매칭됨" },
  { value: "unmatched", label: "미매칭" },
] as const;

export const CONFIDENCE_OPTIONS = [
  { value: "high", label: "높음" },
  { value: "medium", label: "보통" },
  { value: "low", label: "낮음" },
] as const;

export const LINK_TYPE_OPTIONS = [
  { value: "internal", label: "내부" },
  { value: "external", label: "외부" },
] as const;
