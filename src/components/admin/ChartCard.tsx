interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  height?: number;
}

export function ChartCard({
  title,
  description,
  children,
  height = 300,
}: ChartCardProps) {
  return (
    <div className="sr-chart-card card h-100 border-0">
      <div className="sr-card-header card-header bg-white py-3 border-bottom">
        <div className="d-flex align-items-start justify-content-between gap-3">
          <div className="min-w-0">
            <div className="fw-bold text-body">{title}</div>
            {description ? (
              <div className="small text-muted mt-1 fw-semibold">{description}</div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="card-body p-3">
        <div style={{ height }}>
          {children ? (
            children
          ) : (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted">
              <div className="spinner-border spinner-border-sm mb-2" role="status" aria-label="loading" />
              <div className="small">데이터 없음</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
