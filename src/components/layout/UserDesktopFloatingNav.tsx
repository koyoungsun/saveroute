"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { UserDesktopNavZoomControl } from "@/components/layout/UserDesktopNavZoomControl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const desktopNavItems = [
  { id: "home", label: "Home", href: "/" },
  { id: "notices", label: "공지", href: "/notices" },
  { id: "my-benefits", label: "내 혜택", href: "/my-benefits" },
  { id: "mypage", label: "마이페이지", href: "/mypage" },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function UserDesktopFloatingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(Boolean(data.user));
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
      setAuthReady(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!authReady || !isAuthenticated) {
    return null;
  }

  return (
    <nav className="sr-user-desktop-nav" aria-label="주요 메뉴">
      <ul className="sr-user-desktop-nav__list">
        {desktopNavItems.map((item) => {
          const isActive = isActivePath(pathname ?? "", item.href);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "sr-user-desktop-nav__link",
                  isActive && "sr-user-desktop-nav__link--active",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            className="sr-user-desktop-nav__link sr-user-desktop-nav__link--action"
            onClick={() => void handleLogout()}
          >
            로그아웃
          </button>
        </li>
      </ul>
      <UserDesktopNavZoomControl />
    </nav>
  );
}
