"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";

import { UserMobileNavDrawer } from "@/components/layout/UserMobileNavDrawer";
import { useUserMobileViewport } from "@/components/layout/use-user-mobile-viewport";

const primaryNavItems = [
  { id: "home", label: "홈", href: "/" },
  { id: "notices", label: "공지사항", href: "/notices" },
  { id: "about", label: "서비스 소개", href: "/about" },
  { id: "my-benefits", label: "My Benefits", href: "/my-benefits" },
  { id: "mypage", label: "My Page", href: "/mypage" },
] as const;

const mobileNavItems = [
  ...primaryNavItems,
  { id: "terms", label: "약관", href: "/terms" },
  { id: "privacy", label: "개인정보처리방침", href: "/privacy" },
] as const;

const LOGO_INTRINSIC_WIDTH = 204;
const LOGO_INTRINSIC_HEIGHT = 40;
const LOGO_DISPLAY_HEIGHT = 28;
const LOGO_DISPLAY_WIDTH = Math.round(
  LOGO_INTRINSIC_WIDTH * (LOGO_DISPLAY_HEIGHT / LOGO_INTRINSIC_HEIGHT),
);

function useStablePathname() {
  const pathname = usePathname();

  return useSyncExternalStore(
    () => () => undefined,
    () => pathname ?? "",
    () => "",
  );
}

export function UserHeader() {
  const pathname = useStablePathname();
  const isMobileViewport = useUserMobileViewport();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const toggleMenu = useCallback(() => setIsMenuOpen((current) => !current), []);

  return (
    <>
      <header className="sr-user-header sticky top-0 z-40">
        <div className="sr-user-app-header__inner sr-user-header__bar">
          <div className="sr-user-header__side sr-user-header__side--start" aria-hidden="true">
            <span className="sr-user-header__side-spacer" />
          </div>

          <Link
            href="/"
            onClick={closeMenu}
            className="sr-user-header__logo block shrink-0"
            aria-label="SaveRoute 홈"
          >
            <Image
              src="/icons/logo_saveroute_n.png"
              alt=""
              width={LOGO_DISPLAY_WIDTH}
              height={LOGO_DISPLAY_HEIGHT}
              priority
              className="sr-user-header__logo-image"
              aria-hidden="true"
            />
          </Link>

          <div className="sr-user-header__side sr-user-header__side--end">
            {isMobileViewport ? (
              <button
                type="button"
                className="sr-user-btn-icon sr-user-header__menu-btn sr-user-mobile-menu-trigger"
                onClick={toggleMenu}
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
            ) : (
              <span className="sr-user-header__side-spacer" aria-hidden="true" />
            )}
          </div>
        </div>
      </header>

      {isMobileViewport ? (
        <UserMobileNavDrawer
          isOpen={isMenuOpen}
          onClose={closeMenu}
          pathname={pathname}
          items={mobileNavItems}
        />
      ) : null}
    </>
  );
}
