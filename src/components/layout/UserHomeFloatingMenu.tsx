"use client";

import Link from "next/link";
import { LogOut, Mail, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { MenuBrandHeader } from "@/components/layout/MenuBrandHeader";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";
import { emitFloatingMenuState } from "@/lib/user/floating-menu-events";
import { buildSaverouteContactMailto } from "@/lib/user/brand-slogan";
import {
  buildFloatingMenuLinkGroups,
  GUEST_ACCOUNT_MENU_ITEMS,
  type FloatingMenuAccountLinkItem,
  type FloatingMenuLinkItem,
} from "@/lib/user/floating-menu-config";
import { usePwaInstall } from "@/lib/pwa/use-pwa-install";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import styles from "./UserHomeFloatingMenu.module.css";

const INK_DURATION_MS = 720;
const ITEM_STAGGER_MS = 50;
const ITEM_BASE_DELAY_MS = 280;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === href || pathname === "/search";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type InkOrigin = {
  x: number;
  y: number;
};

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function getItemDelay(index: number, total: number, visible: boolean) {
  if (visible) {
    return `${ITEM_BASE_DELAY_MS + index * ITEM_STAGGER_MS}ms`;
  }

  return `${Math.max(0, (total - 1 - index) * 40)}ms`;
}

type MenuLinkRowProps = {
  item: FloatingMenuLinkItem;
  index: number;
  totalItemCount: number;
  pathname: string;
  visible: boolean;
  onNavigate: () => void;
};

function MenuLinkRow({
  item,
  index,
  totalItemCount,
  pathname,
  visible,
  onNavigate,
}: MenuLinkRowProps) {
  const Icon = item.icon;
  const isActive = isActivePath(pathname, item.href);

  return (
    <li className={styles.menuListItem}>
      <Link
        href={item.href}
        style={{
          transitionDelay: getItemDelay(index, totalItemCount, visible),
        }}
        className={cn(styles.menuItem, isActive && styles.menuItemActive)}
        aria-current={isActive ? "page" : undefined}
        onClick={onNavigate}
      >
        <Icon aria-hidden="true" className={styles.menuItemIcon} strokeWidth={1.75} />
        <span className={styles.menuItemLabel}>{item.label}</span>
      </Link>
    </li>
  );
}

type MenuAccountLinkRowProps = {
  item: FloatingMenuAccountLinkItem;
  index: number;
  totalItemCount: number;
  visible: boolean;
  onNavigate: () => void;
};

function MenuAccountLinkRow({
  item,
  index,
  totalItemCount,
  visible,
  onNavigate,
}: MenuAccountLinkRowProps) {
  const Icon = item.icon;

  return (
    <li className={styles.menuListItem}>
      <Link
        href={item.href}
        style={{ transitionDelay: getItemDelay(index, totalItemCount, visible) }}
        className={cn(styles.menuItem, styles.menuItemAccount)}
        onClick={onNavigate}
      >
        <Icon aria-hidden="true" className={styles.menuItemIcon} strokeWidth={1.75} />
        <span className={styles.menuItemLabel}>{item.label}</span>
      </Link>
    </li>
  );
}

export function UserHomeFloatingMenu() {
  const menuId = useId();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [inkOrigin, setInkOrigin] = useState<InkOrigin>({ x: 0, y: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const { showInstallButton } = usePwaInstall();

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMenu = useCallback(() => {
    emitFloatingMenuState({ open: false, phase: "closing" });
    setVisible(false);

    window.setTimeout(() => {
      setIsOpen(false);
      emitFloatingMenuState({ open: false, phase: "closed" });
      toggleRef.current?.focus();
    }, INK_DURATION_MS);
  }, []);

  const openMenu = useCallback(() => {
    const rect = toggleRef.current?.getBoundingClientRect();

    if (rect) {
      setInkOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    setIsOpen(true);
    emitFloatingMenuState({ open: true, phase: "opening" });

    requestAnimationFrame(() => {
      setVisible(true);
      emitFloatingMenuState({ open: true, phase: "open" });
    });
  }, []);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
  }, [closeMenu, isOpen, openMenu]);

  useEffect(() => {
    setIsOpen(false);
    setVisible(false);
    emitFloatingMenuState({ open: false, phase: "closed" });
  }, [pathname]);

  useEffect(() => {
    const supabase = createClient();

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        setIsAuthenticated(Boolean(data.user));
        setAuthReady(true);
      })
      .catch(() => {
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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeMenu, isOpen]);

  useEffect(() => {
    if (!isOpen || !visible) {
      return;
    }

    const menu = menuRef.current;
    if (!menu) {
      return;
    }

    const focusable = getFocusableElements(menu);
    const first = focusable[0];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusable.length === 0) {
        return;
      }

      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    menu.addEventListener("keydown", onKeyDown);

    return () => {
      menu.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, visible]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    closeMenu();
    router.push("/");
    router.refresh();
  }

  function handleLogoutAction() {
    void handleLogout();
  }

  const accountLinks =
    !authReady || isAuthenticated ? [] : GUEST_ACCOUNT_MENU_ITEMS;
  const menuLinkGroups = buildFloatingMenuLinkGroups(isAuthenticated);
  const linkItemCount = menuLinkGroups.reduce(
    (count, group) => count + group.items.length,
    0,
  );
  const utilityItemCount =
    (showInstallButton ? 1 : 0) + 1 + (isAuthenticated ? 1 : 0);
  const totalItemCount = linkItemCount + accountLinks.length + utilityItemCount;
  const contactMailto = buildSaverouteContactMailto("SaveRoute 문의");

  let itemIndex = 0;

  const inkStyle = {
    "--ink-origin-x": `${inkOrigin.x}px`,
    "--ink-origin-y": `${inkOrigin.y}px`,
  } as CSSProperties;

  const overlay =
    mounted && isOpen
      ? createPortal(
          <div
            className={cn(styles.overlay, visible && styles.overlayOpen)}
            aria-hidden={!visible}
          >
            <div
              className={cn(styles.inkDisc, visible && styles.inkDiscVisible)}
              style={inkStyle}
              aria-hidden="true"
            />

            <div
              ref={menuRef}
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label="SaveRoute 메뉴"
              className={cn(styles.menuScene, visible && styles.menuSceneVisible)}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  closeMenu();
                }
              }}
            >
              <div className={styles.menuContent}>
                <MenuBrandHeader
                  className={styles.menuBrandHeader}
                  logoLinkClassName={styles.menuBrandLogoLink}
                  logoClassName={styles.menuBrandLogo}
                  sloganClassName={styles.menuSlogan}
                  sloganAccentClassName={styles.menuSloganAccent}
                  onLogoClick={closeMenu}
                />

                <nav className={styles.menuNav} aria-label="주요 메뉴">
                  {menuLinkGroups.map((group, groupIndex) => (
                    <div key={group.id} className={styles.menuGroup}>
                      {groupIndex > 0 ? (
                        <div
                          className={styles.menuDivider}
                          aria-hidden="true"
                          style={{
                            transitionDelay: getItemDelay(
                              itemIndex++,
                              totalItemCount,
                              visible,
                            ),
                          }}
                        />
                      ) : null}

                      {group.label ? (
                        <p
                          className={styles.menuGroupLabel}
                          style={{
                            transitionDelay: getItemDelay(
                              itemIndex++,
                              totalItemCount,
                              visible,
                            ),
                          }}
                        >
                          {group.label}
                        </p>
                      ) : null}

                      <ul className={styles.menuList}>
                        {group.items.map((item) => {
                          const currentIndex = itemIndex;
                          itemIndex += 1;

                          return (
                            <MenuLinkRow
                              key={item.id}
                              item={item}
                              index={currentIndex}
                              totalItemCount={totalItemCount}
                              pathname={pathname}
                              visible={visible}
                              onNavigate={closeMenu}
                            />
                          );
                        })}
                      </ul>
                    </div>
                  ))}

                  <div
                    className={styles.menuDivider}
                    aria-hidden="true"
                    style={{
                      transitionDelay: getItemDelay(itemIndex++, totalItemCount, visible),
                    }}
                  />

                  <ul className={styles.menuList}>
                    {accountLinks.map((item) => {
                      const currentIndex = itemIndex;
                      itemIndex += 1;

                      return (
                        <MenuAccountLinkRow
                          key={item.id}
                          item={item}
                          index={currentIndex}
                          totalItemCount={totalItemCount}
                          visible={visible}
                          onNavigate={closeMenu}
                        />
                      );
                    })}

                    {showInstallButton ? (
                      <li className={styles.menuListItem}>
                        <InstallAppButton
                          variant="menu"
                          style={{
                            transitionDelay: getItemDelay(
                              itemIndex++,
                              totalItemCount,
                              visible,
                            ),
                          }}
                          onAction={closeMenu}
                        />
                      </li>
                    ) : null}

                    <li className={styles.menuListItem}>
                      <a
                        href={contactMailto}
                        style={{
                          transitionDelay: getItemDelay(
                            itemIndex++,
                            totalItemCount,
                            visible,
                          ),
                        }}
                        className={cn(styles.menuItem, styles.menuItemAccount)}
                        aria-label="이메일 문의하기"
                        onClick={closeMenu}
                      >
                        <Mail
                          aria-hidden="true"
                          className={styles.menuItemIcon}
                          strokeWidth={1.75}
                        />
                        <span className={styles.menuItemLabel}>이메일 문의하기</span>
                      </a>
                    </li>

                    {isAuthenticated ? (
                      <li className={styles.menuListItem}>
                        <button
                          type="button"
                          style={{
                            transitionDelay: getItemDelay(
                              itemIndex,
                              totalItemCount,
                              visible,
                            ),
                          }}
                          className={cn(
                            styles.menuItem,
                            styles.menuItemAccount,
                            styles.menuItemLogout,
                          )}
                          onClick={handleLogoutAction}
                        >
                          <LogOut
                            aria-hidden="true"
                            className={styles.menuItemIcon}
                            strokeWidth={1.75}
                          />
                          <span className={styles.menuItemLabel}>로그아웃</span>
                        </button>
                      </li>
                    ) : null}
                  </ul>
                </nav>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="sr-user-floating-menu">
        <div className="sr-user-floating-menu__inner sr-user-app-header__inner">
          <button
            ref={toggleRef}
            type="button"
            className={cn(styles.iconButton, isOpen && styles.iconButtonOpen)}
            aria-label={isOpen ? "메뉴 닫기" : "메뉴 열기"}
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={toggleMenu}
          >
            {isOpen ? (
              <X aria-hidden="true" size={26} strokeWidth={2.2} />
            ) : (
              <Menu aria-hidden="true" size={26} strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
      {overlay}
    </>
  );
}
