"use client";

import { useEffect, useState, type ReactNode } from "react";

import {
  NAVIGATION_TRANSITION_REVEAL,
  NAV_TRANSITION_SHELL_MS,
  peekPendingNavigation,
} from "@/lib/user/navigation-transition-events";

import styles from "./DataPageReveal.module.css";

type RevealPhase = "pending" | "shell" | "revealed";

type DataPageRevealProps = {
  children: ReactNode;
};

export function DataPageReveal({ children }: DataPageRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>("pending");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setPhase("revealed");
      return;
    }

    const beginReveal = () => {
      setPhase("shell");
      window.setTimeout(() => setPhase("revealed"), NAV_TRANSITION_SHELL_MS);
    };

    const onTransitionReveal = () => {
      beginReveal();
    };

    window.addEventListener(NAVIGATION_TRANSITION_REVEAL, onTransitionReveal);

    const pending = peekPendingNavigation();
    if (!pending) {
      setPhase("revealed");
      return () => window.removeEventListener(NAVIGATION_TRANSITION_REVEAL, onTransitionReveal);
    }

    return () => window.removeEventListener(NAVIGATION_TRANSITION_REVEAL, onTransitionReveal);
  }, []);

  return (
    <div className={styles.root} data-phase={phase} data-sr-data-page-reveal={phase}>
      {children}
    </div>
  );
}
