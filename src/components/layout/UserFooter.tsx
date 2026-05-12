import Link from "next/link";
import { Mail } from "lucide-react";

const CONTACT_EMAIL = "srrtr4@gmail.com";
const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}`;

export function UserFooter() {
  return (
    <footer className="relative z-10 border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-lg font-black text-gray-950 dark:text-gray-50">
              Save<span className="text-orange-500">Route</span>
            </p>
            <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
              나의 혜택정보로 빠르게 할인 정보를 찾아드립니다.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <nav className="flex flex-wrap gap-x-3 gap-y-2 text-sm font-semibold text-gray-600 dark:text-gray-300 sm:justify-end">
              <Link href="/about" className="hover:text-orange-600 dark:hover:text-orange-400">
                서비스 소개
              </Link>
              <Link href="/terms" className="hover:text-orange-600 dark:hover:text-orange-400">
                약관
              </Link>
              <Link href="/privacy" className="hover:text-orange-600 dark:hover:text-orange-400">
                개인정보처리방침
              </Link>
            </nav>

            <a
              href={CONTACT_MAILTO}
              className="group inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg py-1 pl-0 pr-1 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#409A53]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 sm:justify-end"
              aria-label={`문의 및 제휴: ${CONTACT_EMAIL} 로 메일 보내기`}
            >
              <Mail
                className="size-4 shrink-0 text-[#409A53] opacity-90 transition-colors group-hover:text-[#52b86a] dark:text-[#5cb97a] dark:group-hover:text-[#6bc489]"
                aria-hidden
              />
              <span className="text-sm font-medium text-[#409A53] transition-colors group-hover:text-[#52b86a] dark:text-[#5cb97a] dark:group-hover:text-[#6bc489]">
                문의 및 제휴
              </span>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                ·
              </span>
              <span className="text-xs text-gray-500 transition-colors group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300">
                {CONTACT_EMAIL}
              </span>
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          Copyright © 2026 SaveRoute. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
