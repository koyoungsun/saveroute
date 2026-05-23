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

    <section className="sr-user-card" aria-label="놀이동산 이용 조건 미리보기">

      <div className="flex flex-wrap items-start justify-between gap-2">

        <div>

          <p className="sr-user-t-badge sr-user-text-link uppercase tracking-[0.18em]">

            추가 조건

          </p>

          <h2 className="sr-user-t-section-title sr-user-text-primary mt-1">

            놀이동산 이용 조건

          </h2>

          <p className="sr-user-t-muted sr-user-text-muted mt-1">

            UI 미리보기입니다. 선택해도 할인 결과는 아직 바뀌지 않아요.

          </p>

        </div>

        <span className="sr-user-badge sr-user-t-badge sr-user-text-muted px-2.5 py-1 uppercase tracking-wide">

          준비 중

        </span>

      </div>



      <div className="mt-4 space-y-4 opacity-90">

        <div>

          <p className="sr-user-t-body sr-user-text-secondary font-bold">방문 인원</p>

          <div className="mt-2 grid grid-cols-2 gap-2">

            {visitorOptions.map((option) => {

              const active = visitorGroup === option.value;

              return (

                <button

                  key={option.value}

                  type="button"

                  aria-pressed={active}

                  onClick={() => setVisitorGroup(option.value)}

                  className={`sr-user-segment sr-user-t-body min-h-10 px-3 ${

                    active ? "sr-user-segment--active" : ""

                  }`}

                >

                  {option.label}

                </button>

              );

            })}

          </div>

        </div>



        <div>

          <p className="sr-user-t-body sr-user-text-secondary font-bold">이용권 종류</p>

          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">

            {ticketOptions.map((option) => {

              const active = ticketType === option.value;

              return (

                <button

                  key={option.value}

                  type="button"

                  aria-pressed={active}

                  onClick={() => setTicketType(option.value)}

                  className={`sr-user-segment sr-user-t-body min-h-10 shrink-0 px-3 ${

                    active ? "sr-user-segment--active" : ""

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

