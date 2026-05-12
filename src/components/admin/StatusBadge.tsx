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
  reviewing: "text-bg-info",
  completed: "text-bg-success",
  ignored: "text-bg-light text-dark border",
  rejected: "text-bg-secondary",
  inactive: "text-bg-light text-dark border",
  scheduled: "text-bg-info",
  view_detail: "text-bg-info",
  use_discount: "text-bg-warning",
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
