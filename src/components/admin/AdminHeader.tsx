export function AdminHeader() {
  return (
    <header className="navbar navbar-light bg-white border-bottom px-4">
      <span className="navbar-brand mb-0 h1">SaveRoute Admin</span>

      <div className="d-flex align-items-center gap-3">
        <span className="text-muted">admin@example.com</span>
        <span className="badge bg-primary">master</span>
        <button type="button" className="btn btn-outline-secondary btn-sm">
          Logout
        </button>
      </div>
    </header>
  );
}
