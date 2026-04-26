import { StatusBadge } from "@/components/admin/StatusBadge";

const logs = [
  ["01-15 14:32", "롯데월드", "롯데월드", "여성", "20대", "matched"],
  ["01-15 14:31", "올리브영", "-", "-", "-", "unmatched"],
  ["01-15 14:30", "CGV", "CGV", "남성", "30대", "matched"],
] as const;

export default function SearchLogsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Search Logs</h1>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <input type="date" className="form-control" defaultValue="2025-01-01" />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" defaultValue="2025-01-31" />
            </div>
            <div className="col-md-2">
              <input className="form-control" placeholder="keyword" />
            </div>
            <div className="col-md-2">
              <select className="form-select" defaultValue="">
                <option value="">결과</option>
                <option>matched</option>
                <option>unmatched</option>
              </select>
            </div>
            <div className="col-md-1">
              <select className="form-select" defaultValue="">
                <option value="">성별</option>
                <option>남성</option>
                <option>여성</option>
              </select>
            </div>
            <div className="col-md-1">
              <select className="form-select" defaultValue="">
                <option value="">연령대</option>
                <option>20대</option>
                <option>30대</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>시각</th>
                <th>키워드</th>
                <th>매칭 브랜드</th>
                <th>성별</th>
                <th>연령대</th>
                <th>결과</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(([time, keyword, brand, gender, age, status]) => (
                <tr key={`${time}-${keyword}`}>
                  <td>{time}</td>
                  <td>{keyword}</td>
                  <td>{brand}</td>
                  <td>{gender}</td>
                  <td>{age}</td>
                  <td>
                    <StatusBadge status={status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
