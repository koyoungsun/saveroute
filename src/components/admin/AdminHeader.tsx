export function AdminHeader() {
  return (
    <header className="sr-admin-header navbar navbar-light border-bottom px-4 py-2">
      <div className="d-flex align-items-center gap-3">
        <div>
          <div className="navbar-brand mb-0 fw-bold">SaveRoute Admin</div>
          <div className="small text-muted fw-semibold">CoreRoute 운영 콘솔</div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small d-none d-md-inline">admin@example.com</span>
        <span className="sr-role-badge badge rounded-pill px-3 py-2">
          master
        </span>
        <button type="button" className="btn btn-outline-secondary btn-sm">
          Logout
        </button>
      </div>
    </header>
  );
}
