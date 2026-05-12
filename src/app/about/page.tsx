import Image from "next/image";
import Link from "next/link";

import { AboutHeroCarousel } from "@/components/about/AboutHeroCarousel";
import { UserShell } from "@/components/layout/UserShell";

export default function AboutPage() {
  return (
    <UserShell>
      <main className="mx-auto w-full max-w-4xl px-4 py-10 md:py-16">
        <AboutHeroCarousel />

        <section className="mt-8 space-y-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-[#3DB525]">
              [SaveRoute가 해결하려는 문제]
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              - 같은 브랜드라도 카드사, 통신사, 멤버십에 따라 할인 조건과 금액이
              달라요.
              <br />
              -  사용자의 혜택상품과 브랜드별 할인 정보를 연결,
              여러 앱을 오가며 비교하는 과정을 줄여 드려요.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-black text-[#3DB525]">
              [카드/통신사/멤버십 기반 탐색 구조]
            </h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              - 혜택은 카테고리, 제공사, 혜택상품 기준으로 관리되요.
              <br />
              - 보유하신 혜택과 할인 데이터의 카테고리, 제공사, 상품 조건이
              맞으면 검색 결과에서 내 혜택으로 표시되요.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black text-[#D96425]">
            * 세이브루트 사용방법
          </h2>
          <div className="mt-4 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <Image
              src="/icons/tit-saveroute.png"
              alt="세이브루트 사용 방법: 1. 내 혜택 등록 — 보유 중인 카드, 통신사 멤버십, 외부 멤버십을 먼저 등록합니다. 2. 브랜드 검색 — 식당, 영화관, 놀이동산 등 방문하려는 브랜드를 검색합니다. 3. 최적 할인 확인 — 등록한 혜택과 매칭되는 할인 중 유리한 항목을 우선 확인합니다."
              width={1024}
              height={520}
              style={{ height: "auto", width: "100%" }}
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-orange-100 bg-orange-50 p-6">
          <h2 className="text-xl font-black text-gray-950">지금 시작하세요!!</h2>
          <p className="mt-3 text-sm leading-7 text-gray-600">
            나의 정보들을 등록하고 최적 할인을 확인해보세요!
          </p>
          <Link
            href="/my-benefits"
            className="mt-5 inline-flex h-12 items-center justify-center rounded-3xl bg-sr-primary px-4 text-sm font-semibold text-white hover:bg-sr-primary-hover"
          >
            나의 혜택정보 등록하기
          </Link>
        </section>
      </main>
    </UserShell>
  );
}
