import {
  AgeGroupBarChart,
  BrandRequestTopBarChart,
  BrandTopBarChart,
  CategoryPieChart,
  DailySearchLineChart,
} from "@/components/admin/AdminCharts";
import { ChartCard } from "@/components/admin/ChartCard";

const rankingRows = [
  [1, "롯데월드", "1,240", "320", "188"],
  [2, "CGV", "1,120", "284", "160"],
  [3, "스타벅스", "890", "210", "92"],
] as const;

export default function StatsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Statistics</h1>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">시작일</label>
              <input type="date" className="form-control" defaultValue="2025-01-01" />
            </div>
            <div className="col-md-3">
              <label className="form-label">종료일</label>
              <input type="date" className="form-control" defaultValue="2025-01-31" />
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-primary w-100">
                조회
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-12">
          <ChartCard title="전체 검색 추이">
            <DailySearchLineChart />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="브랜드별 검색 순위">
            <BrandTopBarChart />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="성별/연령 검색 분포">
            <AgeGroupBarChart />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="카테고리별 검색 비율">
            <CategoryPieChart />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="미지원 요청 추이">
            <BrandRequestTopBarChart />
          </ChartCard>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header bg-white fw-semibold">
          기간 내 브랜드별 검색 순위
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>순위</th>
                <th>브랜드명</th>
                <th>검색 수</th>
                <th>상세 조회</th>
                <th>할인 클릭</th>
              </tr>
            </thead>
            <tbody>
              {rankingRows.map(([rank, brand, searches, detailViews, clicks]) => (
                <tr key={brand}>
                  <td>{rank}</td>
                  <td>{brand}</td>
                  <td>{searches}</td>
                  <td>{detailViews}</td>
                  <td>{clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
