"use client";

import { useEffect, useState, type ReactNode } from "react";

import { NAV_TRANSITION_ENTER_MS } from "@/lib/user/navigation-transition-events";

import styles from "./PageTransition.module.css";

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setReady(true);
      return;
    }

    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={[styles.page, ready && styles.pageReady].filter(Boolean).join(" ")}
      style={{ "--sr-page-enter-ms": `${NAV_TRANSITION_ENTER_MS}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
