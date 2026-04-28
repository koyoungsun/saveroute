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

const palette = {
  primary: "#F97316",
  darkSlate: "#1E293B",
  softOrange: "#FDBA74",
  mutedGray: "#94A3B8",
  green: "#22C55E",
  grid: "rgba(15, 23, 42, 0.10)",
  tooltipBg: "rgba(33, 37, 41, 0.92)",
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

const labels = ["1일", "5일", "10일", "15일", "20일", "25일", "30일"];

export function DailySearchLineChart() {
  return (
    <Line
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels,
        datasets: [
          {
            label: "검색 수",
            data: [420, 620, 580, 740, 880, 960, 1234],
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

export function DailySignupLineChart() {
  return (
    <Line
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels,
        datasets: [
          {
            label: "신규회원",
            data: [4, 7, 6, 9, 8, 11, 12],
            borderColor: palette.green,
            backgroundColor: "rgba(34, 197, 94, 0.12)",
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

export function BrandTopBarChart() {
  return (
    <Bar
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels: ["롯데월드", "CGV", "스타벅스", "에버랜드", "서울랜드"],
        datasets: [
          {
            label: "검색 수",
            data: [980, 760, 690, 540, 420],
            backgroundColor: "rgba(249, 115, 22, 0.85)",
            borderRadius: 8,
          },
        ],
      }}
    />
  );
}

export function BrandRequestTopBarChart() {
  return (
    <Bar
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels: ["올리브영", "다이소", "노브랜드", "이케아", "쿠팡"],
        datasets: [
          {
            label: "요청 수",
            data: [28, 21, 15, 10, 8],
            backgroundColor: "rgba(253, 186, 116, 0.95)",
            borderRadius: 8,
          },
        ],
      }}
    />
  );
}

export function GenderDoughnutChart() {
  return (
    <Doughnut
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { position: "bottom" as const } },
      }}
      data={{
        labels: ["남성", "여성", "기타", "응답 안 함"],
        datasets: [
          {
            data: [38, 44, 3, 15],
            backgroundColor: [palette.primary, palette.darkSlate, palette.green, palette.mutedGray],
            borderWidth: 0,
          },
        ],
      }}
    />
  );
}

export function AgeGroupBarChart() {
  return (
    <Bar
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { display: false } },
      }}
      data={{
        labels: ["10대", "20대", "30대", "40대", "50대", "60대+"],
        datasets: [
          {
            label: "검색 수",
            data: [90, 420, 360, 240, 160, 80],
            backgroundColor: "rgba(30, 41, 59, 0.85)",
            borderRadius: 8,
          },
        ],
      }}
    />
  );
}

export function CategoryPieChart() {
  return (
    <Pie
      options={{
        ...baseOptions,
        plugins: { ...baseOptions.plugins, legend: { position: "bottom" as const } },
      }}
      data={{
        labels: ["여가", "식음료", "쇼핑", "교통"],
        datasets: [
          {
            data: [42, 28, 22, 8],
            backgroundColor: [palette.primary, palette.darkSlate, palette.softOrange, palette.mutedGray],
            borderWidth: 0,
          },
        ],
      }}
    />
  );
}
