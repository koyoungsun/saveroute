"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { ZoomProvider } from "@/components/settings/ZoomProvider";
import {
  SHOW_ACCOUNT_FLOATING_MENU,
  SHOW_ACCOUNT_FOOTER,
  SHOW_ACCOUNT_HEADER,
  SHOW_AUTH_FLOATING_MENU,
  SHOW_AUTH_FOOTER,
  SHOW_AUTH_HEADER,
  SHOW_CONTENT_FLOATING_MENU,
  SHOW_CONTENT_FOOTER,
  SHOW_CONTENT_HEADER,
  SHOW_CONTENT_FONT_SIZE_CONTROLS,
  SHOW_FONT_SIZE_CONTROLS,
  SHOW_HOME_FLOATING_MENU,
  SHOW_LEGACY_HOME_DESKTOP_NAV,
  SHOW_USER_HOME_FOOTER,
  SHOW_USER_HOME_HEADER,
} from "@/lib/user/home-layout-flags";

import { PwaServiceWorkerRegister } from "@/components/pwa/PwaServiceWorkerRegister";

import { UserDesktopFloatingNav } from "./UserDesktopFloatingNav";
import { UserFooter } from "./UserFooter";
import { UserHeader } from "./UserHeader";
import { UserHomeFloatingMenu } from "./UserHomeFloatingMenu";
import { UserNavigationTransition } from "./UserNavigationTransition";
import { UserZoomContent } from "./UserZoomContent";
import { UserZoomControl } from "./UserZoomControl";

type UserShellInnerProps = {
  children: ReactNode;
};

type HubKind = "search" | "auth" | "account" | "content";

function isSearchHubPath(pathname: string) {
  return pathname === "/" || pathname === "/search";
}

function isAuthPath(pathname: string) {
  return pathname === "/auth/login" || pathname === "/auth/signup";
}

function isAccountHubPath(pathname: string) {
  return pathname === "/mypage" || pathname === "/my-benefits";
}

function isContentHubPath(pathname: string) {
  if (pathname === "/terms" || pathname === "/privacy" || pathname === "/notices") {
    return true;
  }

  if (pathname.startsWith("/notices/manage")) {
    return false;
  }

  return /^\/notices\/[^/]+$/.test(pathname);
}

function getHubKind(pathname: string): HubKind | null {
  if (isSearchHubPath(pathname)) return "search";
  if (isAuthPath(pathname)) return "auth";
  if (isAccountHubPath(pathname)) return "account";
  if (isContentHubPath(pathname)) return "content";
  return null;
}

export function UserShellInner({ children }: UserShellInnerProps) {
  const pathname = usePathname() ?? "";
  const hubKind = getHubKind(pathname);
  const isMinimalChromePage = hubKind !== null;

  const showHeader = !isMinimalChromePage
    ? true
    : hubKind === "content"
      ? SHOW_CONTENT_HEADER
      : hubKind === "account"
        ? SHOW_ACCOUNT_HEADER
        : hubKind === "auth"
          ? SHOW_AUTH_HEADER
          : SHOW_USER_HOME_HEADER;

  const showFooter = !isMinimalChromePage
    ? true
    : hubKind === "content"
      ? SHOW_CONTENT_FOOTER
      : hubKind === "account"
        ? SHOW_ACCOUNT_FOOTER
        : hubKind === "auth"
          ? SHOW_AUTH_FOOTER
          : SHOW_USER_HOME_FOOTER;

  const showLegacyDesktopNav =
    !isMinimalChromePage ||
    (hubKind === "search" ? SHOW_LEGACY_HOME_DESKTOP_NAV : false);

  const showFloatingMenu =
    (hubKind === "search" && SHOW_HOME_FLOATING_MENU) ||
    (hubKind === "auth" && SHOW_AUTH_FLOATING_MENU) ||
    (hubKind === "account" && SHOW_ACCOUNT_FLOATING_MENU) ||
    (hubKind === "content" && SHOW_CONTENT_FLOATING_MENU);

  const showFontSizeControls =
    hubKind === "content" ? SHOW_CONTENT_FONT_SIZE_CONTROLS : SHOW_FONT_SIZE_CONTROLS;

  const showZoomControl = !showFloatingMenu && showFontSizeControls;

  return (
    <ZoomProvider>
      <PwaServiceWorkerRegister />
      <div className="sr-user-app flex min-h-dvh flex-col">
        {showHeader ? <UserHeader /> : null}
        {showLegacyDesktopNav ? <UserDesktopFloatingNav /> : null}
        <main className="sr-user-app-shell relative z-10 flex min-h-0 flex-1 flex-col overflow-visible">
          <UserZoomContent>
            <Suspense fallback={children}>
              <UserNavigationTransition>{children}</UserNavigationTransition>
            </Suspense>
          </UserZoomContent>
        </main>
        <div id="sr-user-bottom-dock-root" />
        {showFooter ? <UserFooter /> : null}
        {showFloatingMenu ? <UserHomeFloatingMenu /> : null}
        {showZoomControl ? <UserZoomControl /> : null}
      </div>
    </ZoomProvider>
  );
}
