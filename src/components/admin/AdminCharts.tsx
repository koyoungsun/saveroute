"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
  },
};

const labels = ["1일", "5일", "10일", "15일", "20일", "25일", "30일"];

export function DailySearchLineChart() {
  return (
    <div style={{ height: "260px" }}>
      <Line
        options={chartOptions}
        data={{
          labels,
          datasets: [
            {
              label: "검색 수",
              data: [420, 620, 580, 740, 880, 960, 1234],
              borderColor: "#0d6efd",
              backgroundColor: "rgba(13, 110, 253, 0.15)",
            },
          ],
        }}
      />
    </div>
  );
}

export function DailySignupLineChart() {
  return (
    <div style={{ height: "260px" }}>
      <Line
        options={chartOptions}
        data={{
          labels,
          datasets: [
            {
              label: "신규회원",
              data: [4, 7, 6, 9, 8, 11, 12],
              borderColor: "#198754",
              backgroundColor: "rgba(25, 135, 84, 0.15)",
            },
          ],
        }}
      />
    </div>
  );
}

export function BrandTopBarChart() {
  return (
    <div style={{ height: "260px" }}>
      <Bar
        options={chartOptions}
        data={{
          labels: ["롯데월드", "CGV", "스타벅스", "에버랜드", "서울랜드"],
          datasets: [
            {
              label: "검색 수",
              data: [980, 760, 690, 540, 420],
              backgroundColor: "#0d6efd",
            },
          ],
        }}
      />
    </div>
  );
}

export function BrandRequestTopBarChart() {
  return (
    <div style={{ height: "260px" }}>
      <Bar
        options={chartOptions}
        data={{
          labels: ["올리브영", "다이소", "노브랜드", "이케아", "쿠팡"],
          datasets: [
            {
              label: "요청 수",
              data: [28, 21, 15, 10, 8],
              backgroundColor: "#ffc107",
            },
          ],
        }}
      />
    </div>
  );
}

export function GenderDoughnutChart() {
  return (
    <div style={{ height: "240px" }}>
      <Doughnut
        options={chartOptions}
        data={{
          labels: ["남성", "여성", "기타", "응답 안 함"],
          datasets: [
            {
              data: [38, 44, 3, 15],
              backgroundColor: ["#0d6efd", "#dc3545", "#6f42c1", "#adb5bd"],
            },
          ],
        }}
      />
    </div>
  );
}

export function AgeGroupBarChart() {
  return (
    <div style={{ height: "240px" }}>
      <Bar
        options={chartOptions}
        data={{
          labels: ["10대", "20대", "30대", "40대", "50대", "60대+"],
          datasets: [
            {
              label: "검색 수",
              data: [90, 420, 360, 240, 160, 80],
              backgroundColor: "#20c997",
            },
          ],
        }}
      />
    </div>
  );
}

export function CategoryPieChart() {
  return (
    <div style={{ height: "240px" }}>
      <Pie
        options={chartOptions}
        data={{
          labels: ["여가", "식음료", "쇼핑", "교통"],
          datasets: [
            {
              data: [42, 28, 22, 8],
              backgroundColor: ["#0d6efd", "#198754", "#ffc107", "#dc3545"],
            },
          ],
        }}
      />
    </div>
  );
}
