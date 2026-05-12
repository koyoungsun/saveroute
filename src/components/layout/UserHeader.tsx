"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

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
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          onClick={closeMenu}
          className="block h-10 bg-white"
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

        <nav className="hidden items-center gap-2 md:flex" aria-label="주요 메뉴">
          {primaryNavItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex h-12 items-center rounded-3xl px-4 text-sm font-semibold transition-colors",
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

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm md:hidden"
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
          className="border-t border-gray-100 bg-white px-4 py-3 shadow-lg md:hidden"
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
        </div>
      ) : null}
    </header>
  );
}
