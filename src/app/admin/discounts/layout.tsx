import "./discounts.css";

export default function AdminDiscountsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="sr-admin-discounts">{children}</div>;
}
