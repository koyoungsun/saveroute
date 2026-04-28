export function AdminHeader() {
  return (
    <header className="navbar navbar-light bg-white border-bottom px-4 py-2">
      <div className="d-flex align-items-center gap-3">
        <span className="navbar-brand mb-0 fw-semibold">SaveRoute Admin</span>
      </div>

      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small d-none d-md-inline">admin@example.com</span>
        <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
          master
        </span>
        <button type="button" className="btn btn-outline-secondary btn-sm">
          Logout
        </button>
      </div>
    </header>
  );
}
