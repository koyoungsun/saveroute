"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
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
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
);

const palette = {
  primary: "#F97316",
  darkSlate: "#1E293B",
  softOrange: "#FDBA74",
  mutedGray: "#94A3B8",
  green: "#22C55E",
  grid: "rgba(15, 23, 42, 0.10)",
  tooltipBg: "rgba(33, 37, 41, 0.92)",
};

export type ChartSeries = {
  labels: string[];
  values: number[];
};

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
    },
    tooltip: {
      backgroundColor: palette.tooltipBg,
      titleColor: "#ffffff",
      bodyColor: "#ffffff",
      padding: 10,
      cornerRadius: 8,
      displayColors: false,
    },
  },
  scales: {
    x: {
      grid: { color: palette.grid, drawBorder: false },
      ticks: { color: palette.mutedGray },
    },
    y: {
      grid: { color: palette.grid, drawBorder: false },
      ticks: { color: palette.mutedGray },
    },
  },
};

function hasChartData(data: ChartSeries | null | undefined) {
  return !!data && data.labels.length > 0 && data.values.some((value) => value > 0);
}

export function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted text-center px-3">
      <div className="small">{message}</div>
    </div>
  );
}

export function DailySearchLineChart({
  data,
  emptyMessage = "아직 수집된 검색 기록이 없습니다.",
}: {
  data: ChartSeries | null;
  emptyMessage?: string;
}) {
  if (!hasChartData(data)) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  return (
    <Line
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels: data!.labels,
        datasets: [
          {
            label: "검색 수",
            data: data!.values,
            borderColor: palette.primary,
            backgroundColor: "rgba(249, 115, 22, 0.14)",
            pointRadius: 0,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
        ],
      }}
    />
  );
}

export function BrandTopBarChart({
  data,
  emptyMessage = "브랜드 검색 데이터가 없습니다.",
}: {
  data: ChartSeries | null;
  emptyMessage?: string;
}) {
  if (!hasChartData(data)) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  return (
    <Bar
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels: data!.labels,
        datasets: [
          {
            label: "검색 수",
            data: data!.values,
            backgroundColor: "rgba(249, 115, 22, 0.85)",
            borderRadius: 8,
          },
        ],
      }}
    />
  );
}

export function BrandRequestTopBarChart({
  data,
  emptyMessage = "등록된 업데이트 요청이 없습니다.",
}: {
  data: ChartSeries | null;
  emptyMessage?: string;
}) {
  if (!hasChartData(data)) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  return (
    <Bar
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels: data!.labels,
        datasets: [
          {
            label: "요청 수",
            data: data!.values,
            backgroundColor: "rgba(253, 186, 116, 0.95)",
            borderRadius: 8,
          },
        ],
      }}
    />
  );
}

export function GenderDoughnutChart({
  data,
  emptyMessage = "성별 세그먼트 검색 데이터가 없습니다.",
}: {
  data: ChartSeries | null;
  emptyMessage?: string;
}) {
  if (!hasChartData(data)) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  return (
    <Doughnut
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { position: "bottom" as const } },
      }}
      data={{
        labels: data!.labels,
        datasets: [
          {
            data: data!.values,
            backgroundColor: [
              palette.primary,
              palette.darkSlate,
              palette.green,
              palette.mutedGray,
            ],
            borderWidth: 0,
          },
        ],
      }}
    />
  );
}

export function AgeGroupBarChart({
  data,
  emptyMessage = "연령대 세그먼트 검색 데이터가 없습니다.",
}: {
  data: ChartSeries | null;
  emptyMessage?: string;
}) {
  if (!hasChartData(data)) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  return (
    <Bar
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels: data!.labels,
        datasets: [
          {
            label: "검색 수",
            data: data!.values,
            backgroundColor: "rgba(30, 41, 59, 0.85)",
            borderRadius: 8,
          },
        ],
      }}
    />
  );
}

export function CategoryPieChart({
  data,
  emptyMessage = "카테고리별 검색 데이터가 없습니다.",
}: {
  data: ChartSeries | null;
  emptyMessage?: string;
}) {
  if (!hasChartData(data)) {
    return <ChartEmptyState message={emptyMessage} />;
  }

  return (
    <Pie
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { position: "bottom" as const } },
      }}
      data={{
        labels: data!.labels,
        datasets: [
          {
            data: data!.values,
            backgroundColor: [
              palette.primary,
              palette.darkSlate,
              palette.softOrange,
              palette.mutedGray,
              palette.green,
            ],
            borderWidth: 0,
          },
        ],
      }}
    />
  );
}
