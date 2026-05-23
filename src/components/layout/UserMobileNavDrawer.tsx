"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { SAVEROUTE_SLOGAN } from "@/lib/user/brand-slogan";
import { cn } from "@/lib/utils";

type MobileNavItem = {
  id: string;
  label: string;
  href: string;
};

type UserMobileNavDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  items: readonly MobileNavItem[];
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function UserMobileNavDrawer({
  isOpen,
  onClose,
  pathname,
  items,
}: UserMobileNavDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      setVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const onResize = () => {
      if (window.matchMedia("(min-width: 431px)").matches) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div className="sr-user-mobile-nav" data-open={visible ? "true" : "false"}>
      <button
        type="button"
        className="sr-user-mobile-nav__overlay"
        aria-label="메뉴 닫기"
        onClick={onClose}
      />

      <aside
        id="mobile-user-menu"
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
        className="sr-user-mobile-nav__panel"
      >
        <div className="sr-user-mobile-nav__header">
          <p className="sr-user-mobile-nav__title">메뉴</p>
          <button
            type="button"
            className="sr-user-mobile-nav__close"
            aria-label="메뉴 닫기"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <nav className="sr-user-mobile-nav__list" aria-label="모바일 메뉴">
          {items.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "sr-user-mobile-nav__link",
                  isActive && "sr-user-mobile-nav__link--active",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <footer className="sr-user-mobile-nav__brand" aria-label="SaveRoute 브랜드">
          <div className="sr-user-mobile-nav__brand-divider" aria-hidden="true" />
          <p className="sr-user-mobile-nav__brand-name">
            Save<span className="sr-user-mobile-nav__brand-accent">Route</span>
          </p>
          <p className="sr-user-mobile-nav__brand-slogan">{SAVEROUTE_SLOGAN}</p>
          <p className="sr-user-mobile-nav__brand-copy">© 2026 SaveRoute</p>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
