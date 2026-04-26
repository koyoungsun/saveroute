interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

export function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="card h-100">
      <div className="card-header bg-white fw-semibold">{title}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}
