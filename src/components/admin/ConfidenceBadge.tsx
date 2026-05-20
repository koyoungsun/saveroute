import {
  formatStatusLabel,
  getStatusBadgeClassName,
} from "@/lib/ui/format-status-label";

interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return (
    <span
      className={`badge px-2 py-1 fw-semibold ${getStatusBadgeClassName(confidence)}`}
      style={{ minWidth: "72px", borderRadius: 4 }}
    >
      {formatStatusLabel(confidence)}
    </span>
  );
}
