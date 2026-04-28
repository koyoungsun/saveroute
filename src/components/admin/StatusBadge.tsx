interface StatusBadgeProps {
  status: string;
}

const statusClassNames: Record<string, string> = {
  active: "text-bg-warning",
  draft: "text-bg-light text-dark border",
  expired: "text-bg-danger",
  hidden: "text-bg-secondary",
  pending: "text-bg-warning",
  processing: "text-bg-warning",
  completed: "text-bg-secondary",
  ignored: "text-bg-light text-dark border",
  inactive: "text-bg-light text-dark border",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`badge px-2 py-1 fw-semibold ${statusClassNames[status] ?? "text-bg-light text-dark border"}`}
      style={{ minWidth: "72px", textTransform: "uppercase", borderRadius: 4 }}
    >
      {status}
    </span>
  );
}
