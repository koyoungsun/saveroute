"use client";

import { useMemo, useState } from "react";

type PeriodType = "daily" | "weekly" | "monthly" | "custom";
type ExportTarget = "search" | "click" | "request" | "user_benefits";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function StatsExportForm() {
  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<PeriodType>("daily");
  const [target, setTarget] = useState<ExportTarget>("search");
  const [startDate, setStartDate] = useState(toDateInputValue(today));
  const [endDate, setEndDate] = useState(toDateInputValue(today));

  const handleDownload = () => {
    const params = new URLSearchParams({
      period,
      target,
    });

    if (period === "custom") {
      params.set("start", startDate);
      params.set("end", endDate);
    }

    window.location.href = `/api/admin/stats/export?${params.toString()}`;
  };

  return (
    <div className="card sr-block mb-4">
      <div className="card-header sr-card-header py-3">
        <div className="admin-card-title">통계 엑셀 다운로드</div>
        <div className="small text-muted mt-1">
          일간/주간/월간/직접 기간 기준으로 최대 31일치 집계 데이터를 다운로드합니다.
        </div>
      </div>
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-semibold" htmlFor="stats-export-period">
              기간 타입
            </label>
            <select
              id="stats-export-period"
              className="form-select"
              value={period}
              onChange={(event) => setPeriod(event.target.value as PeriodType)}
            >
              <option value="daily">일간</option>
              <option value="weekly">주간</option>
              <option value="monthly">월간</option>
              <option value="custom">직접 기간 선택</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold" htmlFor="stats-export-target">
              다운로드 대상
            </label>
            <select
              id="stats-export-target"
              className="form-select"
              value={target}
              onChange={(event) => setTarget(event.target.value as ExportTarget)}
            >
              <option value="search">검색 통계</option>
              <option value="click">클릭 통계</option>
              <option value="request">업데이트 요청 통계</option>
              <option value="user_benefits">보유혜택 등록 통계</option>
            </select>
          </div>

          {period === "custom" ? (
            <>
              <div className="col-md-2">
                <label className="form-label fw-semibold" htmlFor="stats-export-start">
                  시작일
                </label>
                <input
                  id="stats-export-start"
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold" htmlFor="stats-export-end">
                  종료일
                </label>
                <input
                  id="stats-export-end"
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </>
          ) : null}

          <div className={period === "custom" ? "col-md-2" : "col-md-3"}>
            <button
              type="button"
              className="btn btn-success w-100"
              onClick={handleDownload}
            >
              <i className="bi bi-download me-2" aria-hidden="true" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        <div className="small text-muted mt-3">
          원본 로그 전체가 아니라 집계 테이블 또는 31일 이내 집계 결과를 사용합니다.
        </div>
      </div>
    </div>
  );
}
