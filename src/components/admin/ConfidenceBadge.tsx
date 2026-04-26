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
    <span className={`badge ${confidenceClassNames[confidence]}`}>
      {confidence}
    </span>
  );
}
