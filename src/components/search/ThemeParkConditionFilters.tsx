"use client";

import { useState } from "react";

const visitorOptions = [
  { value: "self", label: "본인만" },
  { value: "plus_1", label: "동반 1명" },
  { value: "plus_2", label: "동반 2명" },
  { value: "plus_3_or_more", label: "동반 3명 이상" },
];

const ticketOptions = [
  { value: "all", label: "전체" },
  { value: "full_day", label: "종일권" },
  { value: "afternoon", label: "오후권" },
  { value: "free_pass", label: "자유이용권" },
  { value: "admission", label: "입장권" },
];

export function ThemeParkConditionFilters() {
  const [visitorGroup, setVisitorGroup] = useState("self");
  const [ticketType, setTicketType] = useState("all");

  return (
    <section className="rounded-2xl border border-[#409A53]/20 bg-[#409A53]/[0.04] p-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#409A53]">
          추가 조건
        </p>
        <h2 className="mt-1 text-base font-extrabold text-gray-950">
          놀이동산 이용 조건
        </h2>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          상세 요금 비교는 준비 중입니다.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <p className="text-xs font-bold text-gray-700">방문 인원</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {visitorOptions.map((option) => {
              const active = visitorGroup === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisitorGroup(option.value)}
                  className={`min-h-10 rounded-xl border px-3 text-sm font-bold transition ${
                    active
                      ? "border-[#409A53] bg-white text-[#409A53] shadow-sm"
                      : "border-gray-100 bg-white/70 text-gray-500"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-700">이용권 종류</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {ticketOptions.map((option) => {
              const active = ticketType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTicketType(option.value)}
                  className={`min-h-10 shrink-0 rounded-xl border px-3 text-sm font-bold transition ${
                    active
                      ? "border-[#409A53] bg-white text-[#409A53] shadow-sm"
                      : "border-gray-100 bg-white/70 text-gray-500"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
