"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import { FontSizeControl } from "@/components/settings/FontSizeControl";
import { cn } from "@/lib/utils";

const primaryNavItems = [
  { id: "home", label: "홈", href: "/" },
  { id: "about", label: "서비스 소개", href: "/about" },
  { id: "my-benefits", label: "My Benefits", href: "/my-benefits" },
  { id: "mypage", label: "My Page", href: "/mypage" },
] as const;

const mobileNavItems = [
  ...primaryNavItems,
  { id: "terms", label: "약관", href: "/terms" },
  { id: "privacy", label: "개인정보처리방침", href: "/privacy" },
] as const;

function useStablePathname() {
  const pathname = usePathname();
  return useSyncExternalStore(
    () => () => undefined,
    () => pathname ?? "",
    () => "",
  );
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function UserHeader() {
  const pathname = useStablePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4">
        <Link
          href="/"
          onClick={closeMenu}
          className="block h-10 shrink-0 bg-white"
          aria-label="SaveRoute 홈"
        >
          <Image
            src="/icons/logo_saveroute_n.png"
            alt=""
            width={204}
            height={40}
            priority
            style={{ height: "40px", width: "auto" }}
            aria-hidden="true"
          />
        </Link>

        <div className="relative z-40 hidden min-w-0 flex-1 flex-wrap items-center justify-end gap-3 md:flex">
          <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="주요 메뉴">
            {primaryNavItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex h-12 shrink-0 items-center rounded-3xl px-4 text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-sr-primary text-white hover:bg-sr-primary-hover"
                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-600",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <FontSizeControl variant="toolbar" />
        </div>

        <button
          type="button"
          className="ml-auto inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm md:hidden"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-user-menu"
          aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
        >
          {isMenuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {isMenuOpen ? (
        <div
          id="mobile-user-menu"
          className="relative z-40 border-t border-gray-100 bg-white px-4 py-3 shadow-lg md:hidden"
        >
          <nav className="mx-auto grid w-full max-w-5xl gap-1" aria-label="모바일 메뉴">
            {mobileNavItems.map((item) => {
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={closeMenu}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex h-12 items-center rounded-3xl px-4 text-sm font-semibold",
                    isActive
                      ? "bg-sr-primary text-white hover:bg-sr-primary-hover"
                      : "text-gray-700 hover:bg-orange-50 hover:text-orange-600",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mx-auto mt-4 w-full max-w-5xl border-t border-gray-100 pt-4">
            <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              글자 크기
            </p>
            <div className="flex justify-center">
              <FontSizeControl variant="toolbar" />
            </div>
            <p className="mt-3 text-center text-[11px] text-gray-400">
              <Link
                href="/mypage/settings"
                className="font-medium underline decoration-gray-300 underline-offset-4 hover:text-gray-600"
                onClick={closeMenu}
              >
                설정 페이지에서 더 보기
              </Link>
            </p>
          </div>
        </div>
      ) : null}
    </header>
  );
}
