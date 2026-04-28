import {
  AgeGroupBarChart,
  BrandRequestTopBarChart,
  BrandTopBarChart,
  CategoryPieChart,
  DailySearchLineChart,
} from "@/components/admin/AdminCharts";
import { ChartCard } from "@/components/admin/ChartCard";
import { PaginatedTable } from "@/components/admin/PaginatedTable";

const rankingRows = [
  [1, "롯데월드", "1,240", "320", "188"],
  [2, "CGV", "1,120", "284", "160"],
  [3, "스타벅스", "890", "210", "92"],
  [4, "올리브영", "740", "180", "55"],
  [5, "에버랜드", "980", "240", "88"],
  [6, "다이소", "690", "120", "21"],
  [7, "노브랜드", "540", "98", "10"],
  [8, "이케아", "420", "80", "6"],
  [9, "쿠팡", "1,010", "260", "120"],
  [10, "메가박스", "390", "64", "14"],
  [11, "롯데시네마", "410", "70", "17"],
  [12, "버거킹", "380", "58", "11"],
] as const;

export default function StatsPage() {
  return (
    <>
      <h1 className="h3 mb-4">Statistics</h1>

      <div className="sr-block card">
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

      <PaginatedTable
        title="기간 내 브랜드별 검색 순위"
        pageSize={10}
        fixedRows={10}
        className="sr-block"
        columns={[
          { header: "순위" },
          { header: "브랜드명" },
          { header: "검색 수" },
          { header: "상세 조회" },
          { header: "할인 클릭" },
        ]}
        rows={rankingRows.map(([rank, brand, searches, detailViews, clicks]) => [
          rank,
          brand,
          searches,
          detailViews,
          clicks,
        ])}
      />
    </>
  );
}
