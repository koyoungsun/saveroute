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
    <div className={`card bg-${variant}-subtle h-100`}>
      <div className="card-body">
        <div className="text-muted small">{title}</div>
        <div className="fs-3 fw-bold">{value}</div>
        {changeText ? <div className="small text-muted">{changeText}</div> : null}
      </div>
    </div>
  );
}
