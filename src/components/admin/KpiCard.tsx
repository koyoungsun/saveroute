interface KpiCardProps {
  title: string;
  value: string;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
  changeText?: string;
  icon?: string;
}

export function KpiCard({
  title,
  value,
  variant = "primary",
  changeText,
  icon,
}: KpiCardProps) {
  return (
    <div className={`sr-kpi-card card border-0 bg-${variant}-subtle h-100`}>
      <div
        className="card-body d-flex gap-3 align-items-center"
        style={{ minHeight: "112px" }}
      >
        <div
          className="sr-kpi-icon d-flex align-items-center justify-content-center flex-shrink-0"
          aria-hidden="true"
        >
          <i className={`bi ${icon ?? "bi-circle-fill"}`} style={{ fontSize: "20px" }} />
        </div>

        <div className="min-w-0">
          <div className="text-muted small fw-semibold">{title}</div>
          <div className="mt-1 fs-2 fw-bold lh-1">{value}</div>
          {changeText ? <div className="small text-muted">{changeText}</div> : null}
        </div>
      </div>
    </div>
  );
}
