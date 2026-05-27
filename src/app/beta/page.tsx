import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { UserPage } from "@/components/layout/UserPage";
import {
  SEARCH_HUB_LOGO_DISPLAY_HEIGHT,
  SEARCH_HUB_LOGO_DISPLAY_WIDTH,
  SEARCH_HUB_LOGO_SRC,
} from "@/lib/user/search-hub-branding";

export const metadata: Metadata = {
  title: "SaveRoute Beta",
  robots: { index: false, follow: false },
};

export default function BetaPage() {
  return (
    <UserPage tone="comfortable" className="sr-user-page">
      <div className="sr-user-content-width mx-auto flex w-full flex-1 items-center justify-center px-4 py-10">
        <section
          className="sr-user-content-card w-full max-w-md text-center"
          aria-label="SaveRoute Beta 안내"
        >
          <div className="flex justify-center">
            <Image
              src={SEARCH_HUB_LOGO_SRC}
              alt="SaveRoute"
              width={SEARCH_HUB_LOGO_DISPLAY_WIDTH}
              height={SEARCH_HUB_LOGO_DISPLAY_HEIGHT}
              priority
              style={{ height: "auto", width: "auto" }}
            />
          </div>

          <h1 className="mt-4 text-lg font-extrabold text-slate-900">
            나의 최적 할인 루트, SaveRoute
          </h1>
          <p className="mt-3 text-sm font-medium text-slate-700">
            현재 할인 데이터와 계산기를 준비 중입니다.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            곧 더 정확한 할인 검색으로 만나요.
          </p>

          <div className="mt-6">
            <Link href="/" className="sr-user-btn-primary sr-user-btn-primary--block">
              홈으로 이동
            </Link>
          </div>
        </section>
      </div>
    </UserPage>
  );
}

