import {
  AgeGroupBarChart,
  BrandRequestTopBarChart,
  BrandTopBarChart,
  CategoryPieChart,
  DailySearchLineChart,
} from "@/components/admin/AdminCharts";
import { ChartCard } from "@/components/admin/ChartCard";
import { PaginatedTable } from "@/components/admin/PaginatedTable";
import { formatRank, getRankedItems } from "@/lib/admin/rank-items";

const rankingRowsData = [
  { brand: "롯데월드", searches: 1240, detailViews: 320, clicks: 188 },
  { brand: "CGV", searches: 1120, detailViews: 284, clicks: 160 },
  { brand: "쿠팡", searches: 1120, detailViews: 260, clicks: 120 },
  { brand: "스타벅스", searches: 890, detailViews: 210, clicks: 92 },
  { brand: "에버랜드", searches: 890, detailViews: 240, clicks: 88 },
  { brand: "올리브영", searches: 740, detailViews: 180, clicks: 55 },
  { brand: "다이소", searches: 690, detailViews: 120, clicks: 21 },
  { brand: "노브랜드", searches: 540, detailViews: 98, clicks: 10 },
  { brand: "롯데시네마", searches: 410, detailViews: 70, clicks: 17 },
  { brand: "이케아", searches: 420, detailViews: 80, clicks: 6 },
  { brand: "메가박스", searches: 390, detailViews: 64, clicks: 14 },
  { brand: "버거킹", searches: 380, detailViews: 58, clicks: 11 },
] as const;

function formatCount(value: number) {
  return value.toLocaleString("ko-KR");
}

export default function StatsPage() {
  const rankedRows = getRankedItems(
    rankingRowsData.map((row) => ({ ...row })),
    "searches",
  );

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
        rows={rankedRows.map((row) => [
          <span
            key={`${row.brand}-rank`}
            className="badge text-bg-light text-dark border fw-semibold"
            style={{ minWidth: "52px" }}
          >
            {formatRank(row.rank)}
          </span>,
          row.brand,
          formatCount(row.searches),
          formatCount(row.detailViews),
          formatCount(row.clicks),
        ])}
      />
    </>
  );
}
