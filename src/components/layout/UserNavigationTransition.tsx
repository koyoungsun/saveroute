"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { DataScanFragments } from "@/components/loading/DataScanFragments";
import { RadarScanLoader } from "@/components/loading/RadarScanLoader";
import {
  NAVIGATION_TRANSITION_START,
  NAV_TRANSITION_ENTER_MS,
  NAV_TRANSITION_EXIT_MS,
  NAV_TRANSITION_MIN_SEARCH_LOADER_MS,
  consumePendingNavigation,
  emitNavigationTransitionReveal,
  emitNavigationTransitionStart,
  navigationHrefMatchesRoute,
  shouldAnimateUserRoute,
  type NavigationKind,
  type NavigationTransitionStart,
} from "@/lib/user/navigation-transition-events";
import { isDataPageRoute, isStaticPageRoute } from "@/lib/user/page-transition-flags";

import styles from "./UserNavigationTransition.module.css";

type UserNavigationTransitionProps = {
  children: ReactNode;
};

type ContentPhase = "visible" | "exiting" | "loading" | "entering";

function getNavigationKind(href: string): NavigationKind {
  const path = href.split("?")[0];

  if (path === "/search" || href.includes("/search?")) {
    return "search";
  }

  if (isDataPageRoute(path)) {
    return "data";
  }

  return "page";
}

function normalizeHref(href: string) {
  if (href.startsWith("http")) {
    try {
      const url = new URL(href);
      return `${url.pathname}${url.search}`;
    } catch {
      return href;
    }
  }

  return href;
}

export function UserNavigationTransition({ children }: UserNavigationTransitionProps) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = search ? `${pathname}?${search}` : pathname;

  const [contentPhase, setContentPhase] = useState<ContentPhase>("visible");
  const [showOverlay, setShowOverlay] = useState(false);
  const [searchScanActive, setSearchScanActive] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  const activeNavigationRef = useRef<NavigationTransitionStart | null>(null);
  const exitTimerDoneRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const isFirstRouteRef = useRef(true);
  const reducedMotionRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timerId = window.setTimeout(callback, delay);
    timersRef.current.push(timerId);
  }, []);

  const revealContent = useCallback(() => {
    const navigationKind = activeNavigationRef.current?.kind ?? "page";

    if (reducedMotionRef.current) {
      setShowOverlay(false);
      setSearchScanActive(false);
      setContentPhase("visible");
      consumePendingNavigation();
      if (navigationKind === "search" || navigationKind === "data") {
        emitNavigationTransitionReveal();
      }
      activeNavigationRef.current = null;
      exitTimerDoneRef.current = false;
      return;
    }

    setShowOverlay(false);
    setSearchScanActive(false);

    if (navigationKind === "search" || navigationKind === "data") {
      setContentPhase("visible");
      consumePendingNavigation();
      emitNavigationTransitionReveal();
      activeNavigationRef.current = null;
      exitTimerDoneRef.current = false;
      return;
    }

    setContentPhase("entering");

    schedule(() => {
      setContentPhase("visible");
      consumePendingNavigation();
      activeNavigationRef.current = null;
      exitTimerDoneRef.current = false;
    }, NAV_TRANSITION_ENTER_MS);
  }, [schedule]);

  const tryCompleteNavigation = useCallback(() => {
    const navigation = activeNavigationRef.current;
    if (!navigation || !exitTimerDoneRef.current) {
      return;
    }

    if (
      !navigationHrefMatchesRoute(navigation.href, pathname, search ? `?${search}` : "")
    ) {
      return;
    }

    const exitDoneAt = navigation.startedAt + NAV_TRANSITION_EXIT_MS;
    const minDoneAt =
      navigation.kind === "search"
        ? navigation.startedAt + NAV_TRANSITION_MIN_SEARCH_LOADER_MS
        : exitDoneAt;
    const revealAt = Math.max(exitDoneAt, minDoneAt);
    const delay = Math.max(0, revealAt - Date.now());

    clearTimers();
    schedule(revealContent, delay);
  }, [clearTimers, pathname, revealContent, schedule, search]);

  const startTransition = useCallback(
    (navigation: NavigationTransitionStart) => {
      if (
        activeNavigationRef.current?.href === navigation.href &&
        contentPhase !== "visible"
      ) {
        return;
      }

      clearTimers();
      activeNavigationRef.current = navigation;
      exitTimerDoneRef.current = false;

      if (reducedMotionRef.current) {
        exitTimerDoneRef.current = true;
        if (navigation.kind === "search") {
          setSearchScanActive(true);
          setShowOverlay(true);
          setContentPhase("loading");
        } else if (navigation.kind === "data") {
          setSearchScanActive(false);
          if (
            !navigationHrefMatchesRoute(
              navigation.href,
              pathname,
              search ? `?${search}` : "",
            )
          ) {
            setShowOverlay(true);
            setContentPhase("loading");
          } else {
            setContentPhase("visible");
          }
        } else {
          setSearchScanActive(false);
          setContentPhase("visible");
        }
        tryCompleteNavigation();
        return;
      }

      if (navigation.kind === "search") {
        setSearchScanActive(true);
      } else {
        setSearchScanActive(false);
      }

      setContentPhase("exiting");

      schedule(() => {
        exitTimerDoneRef.current = true;

        const routeReady = navigationHrefMatchesRoute(
          navigation.href,
          pathname,
          search ? `?${search}` : "",
        );

        if (navigation.kind === "search") {
          setContentPhase("loading");
          setShowOverlay(true);
        } else if (navigation.kind === "data" && !routeReady) {
          setContentPhase("loading");
          setShowOverlay(true);
        }

        tryCompleteNavigation();
      }, NAV_TRANSITION_EXIT_MS);
    },
    [clearTimers, contentPhase, pathname, schedule, search, tryCompleteNavigation],
  );

  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPortalRoot(document.body);
  }, []);

  useEffect(() => {
    const onNavigationStart = (event: Event) => {
      const detail = (event as CustomEvent<NavigationTransitionStart>).detail;
      if (!detail) {
        return;
      }

      startTransition(detail);
    };

    window.addEventListener(NAVIGATION_TRANSITION_START, onNavigationStart);
    return () => window.removeEventListener(NAVIGATION_TRANSITION_START, onNavigationStart);
  }, [startTransition]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") {
        return;
      }

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:")) {
        return;
      }

      const href = normalizeHref(rawHref);
      const path = href.split("?")[0];

      if (!shouldAnimateUserRoute(path)) {
        return;
      }

      if (
        navigationHrefMatchesRoute(href, pathname, search ? `?${search}` : "")
      ) {
        return;
      }

      const kind = getNavigationKind(href);

      emitNavigationTransitionStart(kind, href);
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [pathname, search]);

  useEffect(() => {
    if (isFirstRouteRef.current) {
      isFirstRouteRef.current = false;
      return;
    }

    if (activeNavigationRef.current) {
      tryCompleteNavigation();
      return;
    }

    if (reducedMotionRef.current) {
      setContentPhase("visible");
      return;
    }

    if (isDataPageRoute(pathname)) {
      setContentPhase("visible");
      return;
    }

    if (isStaticPageRoute(pathname)) {
      setContentPhase("entering");
      schedule(() => setContentPhase("visible"), NAV_TRANSITION_ENTER_MS);
      return;
    }

    setContentPhase("visible");
  }, [pathname, routeKey, schedule, tryCompleteNavigation]);

  useEffect(() => clearTimers, [clearTimers]);

  const contentClassName = [
    styles.content,
    contentPhase === "exiting" && styles.contentExiting,
    contentPhase === "loading" && styles.contentLoading,
    contentPhase === "entering" && styles.contentEntering,
    contentPhase === "visible" && styles.contentVisible,
  ]
    .filter(Boolean)
    .join(" ");

  const overlayClassName = [styles.overlay, showOverlay && styles.overlayVisible]
    .filter(Boolean)
    .join(" ");

  const overlayScanClassName = [
    styles.overlayScan,
    searchScanActive && styles.overlayScanVisible,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={contentClassName}
        style={
          {
            "--sr-nav-exit-ms": `${NAV_TRANSITION_EXIT_MS}ms`,
            "--sr-nav-enter-ms": `${NAV_TRANSITION_ENTER_MS}ms`,
          } as React.CSSProperties
        }
        onClickCapture={(event: ReactMouseEvent) => {
          if (contentPhase === "loading" || showOverlay) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {children}
      </div>

      {portalRoot && searchScanActive
        ? createPortal(
            <div className={overlayScanClassName} aria-hidden="true">
              <DataScanFragments intensity={showOverlay ? "full" : "lite"} />
            </div>,
            portalRoot,
          )
        : null}

      {portalRoot
        ? createPortal(
            <div className={overlayClassName} aria-hidden={!showOverlay}>
              {showOverlay ? (
                <div className={styles.overlayCenter}>
                  <RadarScanLoader />
                </div>
              ) : null}
            </div>,
            portalRoot,
          )
        : null}
    </>
  );
}
