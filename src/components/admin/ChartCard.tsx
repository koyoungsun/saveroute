interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-header bg-white fw-semibold py-3">{title}</div>
      <div className="card-body p-3">{children}</div>
    </div>
  );
}
