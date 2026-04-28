interface KpiCardProps {
  title: string;
  value: string;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "secondary";
  changeText?: string;
}

export function KpiCard({
  title,
  value,
  variant = "primary",
  changeText,
}: KpiCardProps) {
  return (
    <div className={`card border-0 shadow-sm bg-${variant}-subtle h-100`}>
      <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: "112px" }}>
        <div className="text-muted small fw-semibold">{title}</div>
        <div className="mt-1 display-6 fw-bold lh-1">{value}</div>
        {changeText ? <div className="small text-muted">{changeText}</div> : null}
      </div>
    </div>
  );
}
