import Link from "next/link";

const menuItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Brands", href: "/admin/brands" },
  { label: "Discounts", href: "/admin/discounts" },
  { label: "Benefit Categories", href: "/admin/benefit-categories" },
  { label: "Providers", href: "/admin/providers" },
  { label: "Benefit Products", href: "/admin/benefit-products" },
  { label: "Brand Requests", href: "/admin/brand-requests" },
  { label: "Update Check", href: "/admin/update-check" },
  { label: "Search Logs", href: "/admin/search-logs" },
  { label: "Stats", href: "/admin/stats" },
  { label: "Accounts", href: "/admin/accounts" },
  { label: "Audit Logs", href: "/admin/audit-logs" },
];

export function AdminSidebar() {
  return (
    <aside
      className="bg-dark text-white flex-shrink-0 vh-100 overflow-auto"
      style={{ width: "240px" }}
    >
      <div className="p-3 border-bottom border-secondary">
        <div className="fw-bold">SaveRoute Admin</div>
      </div>

      <nav className="nav flex-column p-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-link text-white-50 px-2 py-2"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
