import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

const logs = [
  ["01-15 14:32", "롯데월드", "롯데월드", "여성", "20대", "matched"],
  ["01-15 14:31", "올리브영", "-", "-", "-", "unmatched"],
  ["01-15 14:30", "CGV", "CGV", "남성", "30대", "matched"],
  ["01-15 14:29", "다이소", "-", "-", "-", "unmatched"],
  ["01-15 14:28", "스타벅스", "스타벅스", "-", "-", "matched"],
  ["01-15 14:27", "이케아", "-", "-", "-", "unmatched"],
  ["01-15 14:26", "쿠팡", "-", "-", "-", "unmatched"],
  ["01-15 14:25", "메가박스", "메가박스", "여성", "30대", "matched"],
  ["01-15 14:24", "롯데시네마", "롯데시네마", "남성", "40대", "matched"],
  ["01-15 14:23", "버거킹", "-", "-", "-", "unmatched"],
  ["01-15 14:22", "맥도날드", "-", "-", "-", "unmatched"],
  ["01-15 14:21", "GS25", "-", "-", "-", "unmatched"],
  ["01-15 14:20", "CU", "-", "-", "-", "unmatched"],
  ["01-15 14:19", "홈플러스", "-", "-", "-", "unmatched"],
  ["01-15 14:18", "이마트", "-", "-", "-", "unmatched"],
] as const;

export default function SearchLogsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Search Logs</h1>

      <div className="sr-block card">
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

      <PaginatedTable
        title="검색 로그"
        legendType="generic"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "시각" },
          { header: "키워드" },
          { header: "매칭 브랜드" },
          { header: "성별" },
          { header: "연령대" },
          { header: "결과" },
        ]}
        rows={logs.map(([time, keyword, brand, gender, age, status]) => {
          const key = `${time}-${keyword}`;
          return [
            time,
            keyword,
            brand,
            gender,
            age,
            <StatusBadge key={`${key}-status`} status={status} />,
          ];
        })}
      />
    </>
  );
}
