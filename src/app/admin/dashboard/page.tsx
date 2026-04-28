import {
  AgeGroupBarChart,
  BrandRequestTopBarChart,
  BrandTopBarChart,
  CategoryPieChart,
  DailySearchLineChart,
  DailySignupLineChart,
  GenderDoughnutChart,
} from "@/components/admin/AdminCharts";
import { ChartCard } from "@/components/admin/ChartCard";
import { KpiCard } from "@/components/admin/KpiCard";
import { StatusBadge } from "@/components/admin/StatusBadge";

const kpis = [
  ["오늘 검색 수", "1,234", "primary", "bi-search"],
  ["누적 검색 수", "48,290", "secondary", "bi-search"],
  ["오늘 신규회원", "12", "success", "bi-people"],
  ["활성 할인 수", "892", "primary", "bi-tags"],
  ["업데이트 필요", "47", "warning", "bi-tags"],
  ["미지원 요청", "134", "danger", "bi-exclamation-circle"],
] as const;

const staleDiscounts = [
  ["롯데월드", "KT VIP", "KT", "2025-01-10", "active"],
  ["CGV", "SKT T멤버십", "SKT", "2025-01-08", "active"],
  ["스타벅스", "신한카드", "신한카드", "2025-01-03", "active"],
];

const recentUnmatched = [
  ["올리브영", "28", "pending"],
  ["다이소", "21", "pending"],
  ["노브랜드", "15", "processing"],
];

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="h3 mb-4">Dashboard</h1>

      <div className="row g-4 mb-5">
        {kpis.map(([title, value, variant, icon]) => (
          <div key={title} className="col-6 col-md-4 col-xl-2">
            <KpiCard title={title} value={value} variant={variant} icon={icon} />
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <ChartCard title="일별 검색 추이" description="최근 30일 검색량 추이" height={300}>
            <DailySearchLineChart />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="일별 신규회원" description="최근 30일 가입자 추이" height={300}>
            <DailySignupLineChart />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="브랜드별 검색 TOP 10" description="검색량 상위 브랜드" height={300}>
            <BrandTopBarChart />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard title="미지원 요청 TOP 10" description="업데이트 요청이 많은 키워드" height={300}>
            <BrandRequestTopBarChart />
          </ChartCard>
        </div>
        <div className="col-lg-4">
          <ChartCard title="성별 검색 분포" description="성별 기준 검색 비율" height={280}>
            <GenderDoughnutChart />
          </ChartCard>
        </div>
        <div className="col-lg-4">
          <ChartCard title="연령대별 검색 분포" description="연령대 기준 검색량" height={280}>
            <AgeGroupBarChart />
          </ChartCard>
        </div>
        <div className="col-lg-4">
          <ChartCard title="카테고리별 검색 비율" description="카테고리별 검색 분포" height={280}>
            <CategoryPieChart />
          </ChartCard>
        </div>
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold py-3">
              업데이트 필요 할인
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>브랜드</th>
                    <th>제목</th>
                    <th>제공사</th>
                    <th>최근 확인일</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {staleDiscounts.map(([brand, title, provider, checkedAt, status]) => (
                    <tr key={`${brand}-${title}`}>
                      <td className="fw-semibold">{brand}</td>
                      <td className="text-truncate" style={{ maxWidth: "260px" }}>
                        {title}
                      </td>
                      <td>{provider}</td>
                      <td>{checkedAt}</td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white fw-semibold py-3">
              최근 미지원 검색어
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>키워드</th>
                    <th>검색 수</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUnmatched.map(([keyword, count, status]) => (
                    <tr key={keyword}>
                      <td className="fw-semibold">{keyword}</td>
                      <td className="text-end">{count}</td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
