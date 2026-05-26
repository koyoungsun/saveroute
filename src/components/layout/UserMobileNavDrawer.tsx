"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { MenuBrandHeader } from "@/components/layout/MenuBrandHeader";
import { buildFloatingMenuLinkGroups } from "@/lib/user/floating-menu-config";
import { cn } from "@/lib/utils";

type UserMobileNavDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UserMobileNavDrawer({
  isOpen,
  onClose,
  pathname,
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

  const menuGroups = buildFloatingMenuLinkGroups(true);

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
          <MenuBrandHeader
            className="sr-user-mobile-nav__brand-header"
            logoLinkClassName="sr-user-mobile-nav__brand-logo-link"
            logoClassName="sr-user-mobile-nav__brand-logo"
            sloganClassName="sr-user-mobile-nav__brand-slogan"
            sloganAccentClassName="sr-user-mobile-nav__brand-slogan-accent"
            onLogoClick={onClose}
          />
          <button
            type="button"
            className="sr-user-mobile-nav__close"
            aria-label="메뉴 닫기"
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} strokeWidth={2.2} />
          </button>
        </div>

        <nav className="sr-user-mobile-nav__list" aria-label="모바일 메뉴">
          {menuGroups.map((group, groupIndex) => (
            <div key={group.id} className="sr-user-mobile-nav__group">
              {groupIndex > 0 ? (
                <div className="sr-user-mobile-nav__divider" aria-hidden="true" />
              ) : null}

              {group.label ? (
                <p className="sr-user-mobile-nav__group-label">{group.label}</p>
              ) : null}

              {group.items.map((item) => {
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
            </div>
          ))}
        </nav>
      </aside>
    </div>,
    document.body,
  );
}
