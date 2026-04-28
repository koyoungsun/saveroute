interface StatusBadgeProps {
  status: string;
}

const statusClassNames: Record<string, string> = {
  active: "bg-success",
  draft: "bg-secondary",
  expired: "bg-danger",
  hidden: "bg-dark",
  pending: "bg-warning text-dark",
  processing: "bg-info text-dark",
  completed: "bg-success",
  ignored: "bg-secondary",
  inactive: "bg-secondary",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`badge rounded-pill px-2 py-1 fw-semibold ${statusClassNames[status] ?? "bg-secondary"}`}
      style={{ minWidth: "72px", textTransform: "uppercase" }}
    >
      {status}
    </span>
  );
}
