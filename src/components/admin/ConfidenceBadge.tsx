interface ConfidenceBadgeProps {
  confidence: "high" | "medium" | "low";
}

const confidenceClassNames: Record<ConfidenceBadgeProps["confidence"], string> = {
  high: "bg-success",
  medium: "bg-warning text-dark",
  low: "bg-danger",
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return (
    <span
      className={`badge px-2 py-1 fw-semibold ${confidenceClassNames[confidence]}`}
      style={{ minWidth: "72px", textTransform: "uppercase", borderRadius: 4 }}
    >
      {confidence}
    </span>
  );
}
