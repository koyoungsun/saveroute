import {
  formatStatusLabel,
  getStatusBadgeClassName,
} from "@/lib/ui/format-status-label";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`badge px-2 py-1 fw-semibold ${getStatusBadgeClassName(status)}`}
      style={{ minWidth: "72px", borderRadius: 4 }}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
