"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Coins,
  CreditCard,
  Gift,
  Percent,
  Signal,
  Star,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";

import { SearchBar } from "@/components/search/SearchBar";
import {
  FLOATING_MENU_EVENT,
  type FloatingMenuState,
} from "@/lib/user/floating-menu-events";
import { MAIN_LOGO_TAGLINE } from "@/lib/user/brand-slogan";
import { SHOW_MAIN_LOGO_TAGLINE } from "@/lib/user/home-layout-flags";
import {
  SEARCH_HUB_LOGO_DISPLAY_HEIGHT,
  SEARCH_HUB_LOGO_DISPLAY_WIDTH,
  SEARCH_HUB_LOGO_SRC,
} from "@/lib/user/search-hub-branding";
import { cn } from "@/lib/utils";

import styles from "./HomeOrbitHero.module.css";

type HudNode = {
  id: string;
  label: string;
  Icon: LucideIcon;
  angle: number;
};

const ORBIT_CENTER = 200;
const RING_OUTER = 194;
const RING_MAIN = 178;
const RING_INNER = 136;
const SEARCH_PULSE_MS = 800;

const HUD_NODES: HudNode[] = [
  { id: "percent-a", label: "할인", Icon: Percent, angle: 335 },
  { id: "card", label: "카드", Icon: CreditCard, angle: 25 },
  { id: "gift", label: "혜택", Icon: Gift, angle: 70 },
  { id: "coupon", label: "쿠폰", Icon: TicketPercent, angle: 115 },
  { id: "coin", label: "포인트", Icon: Coins, angle: 160 },
  { id: "star", label: "멤버십", Icon: Star, angle: 205 },
  { id: "signal", label: "통신", Icon: Signal, angle: 250 },
  { id: "percent-b", label: "할인", Icon: Percent, angle: 295 },
];

export function HomeOrbitHero() {
  const [isSearching, setIsSearching] = useState(false);
  const [menuActive, setMenuActive] = useState(false);
  const searchPulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onMenuState = (event: Event) => {
      const { phase } = (event as CustomEvent<FloatingMenuState>).detail;
      setMenuActive(phase === "opening" || phase === "open");
    };

    window.addEventListener(FLOATING_MENU_EVENT, onMenuState);
    return () => window.removeEventListener(FLOATING_MENU_EVENT, onMenuState);
  }, []);

  const triggerSearchPulse = useCallback(() => {
    setIsSearching(true);

    if (searchPulseTimer.current) {
      clearTimeout(searchPulseTimer.current);
    }

    searchPulseTimer.current = setTimeout(() => {
      setIsSearching(false);
      searchPulseTimer.current = null;
    }, SEARCH_PULSE_MS);
  }, []);

  const handleSearchAreaClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;

      if (target.closest('button[type="submit"]')) {
        triggerSearchPulse();
      }
    },
    [triggerSearchPulse],
  );

  const handleSearchAreaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter") {
        return;
      }

      const target = event.target as HTMLElement;

      if (target.closest(".sr-user-search-bar__input")) {
        triggerSearchPulse();
      }
    },
    [triggerSearchPulse],
  );

  return (
    <div
      className={cn(
        "sr-user-search-hub sr-user-search-hub--home",
        styles.root,
        isSearching && styles.isSearching,
        menuActive && styles.menuActive,
      )}
    >
      <section className={styles.hudStage} aria-label="SaveRoute 홈 비주얼">
        <div className={styles.depthField} aria-hidden="true">
          <div className={styles.centerHalo} />
        </div>

        <div className={styles.hudAtmosphere} aria-hidden="true">
          <div className={styles.hudSvgWrap}>
          <svg
            className={styles.hudSvg}
            viewBox="0 0 400 400"
            role="presentation"
            focusable="false"
          >
            <defs>
              <linearGradient id="sr-ring-main-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(120, 150, 255, 0.95)" />
                <stop offset="50%" stopColor="rgba(94, 92, 230, 0.9)" />
                <stop offset="100%" stopColor="rgba(118, 100, 255, 0.92)" />
              </linearGradient>

              <linearGradient id="sr-arc-energy" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(94, 92, 230, 0)" />
                <stop offset="50%" stopColor="rgba(126, 162, 255, 0.12)" />
                <stop offset="78%" stopColor="rgba(180, 205, 255, 0.38)" />
                <stop offset="92%" stopColor="rgba(220, 232, 255, 0.58)" />
                <stop offset="100%" stopColor="rgba(235, 242, 255, 0.72)" />
              </linearGradient>

              <linearGradient id="sr-outer-sweep-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="20%" stopColor="rgba(150, 170, 255, 0.15)" />
                <stop offset="55%" stopColor="rgba(255, 255, 255, 0.65)" />
                <stop offset="100%" stopColor="rgba(120, 150, 255, 0.25)" />
              </linearGradient>

              <filter id="sr-outer-sweep-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="1.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle
              className={styles.ringOuterGlow}
              cx={ORBIT_CENTER}
              cy={ORBIT_CENTER}
              r={RING_OUTER}
            />
            <g className={styles.outerSweepGroup}>
              <circle
                className={styles.outerSweepArcGlow}
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r={RING_OUTER}
                pathLength={100}
              />
              <circle
                className={styles.outerSweepArc}
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r={RING_OUTER}
                pathLength={100}
              />
            </g>
            <circle
              className={styles.ringInnerDotted}
              cx={ORBIT_CENTER}
              cy={ORBIT_CENTER}
              r={RING_INNER}
              pathLength={1000}
            />
            <g className={styles.energyArcGroup}>
              <circle
                className={styles.energyArcTail}
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r={RING_MAIN}
                pathLength={100}
                stroke="url(#sr-arc-energy)"
              />
              <circle
                className={styles.energyArcHead}
                cx={ORBIT_CENTER}
                cy={ORBIT_CENTER}
                r={RING_MAIN}
                pathLength={100}
                stroke="url(#sr-arc-energy)"
              />
            </g>
            <circle
              className={styles.ringMain}
              cx={ORBIT_CENTER}
              cy={ORBIT_CENTER}
              r={RING_MAIN}
            />
          </svg>
          </div>

          <div className={styles.innerCometLayer}>
            <div className={styles.innerCometRunner}>
              <div className={styles.innerCometAnchor}>
                <div className={styles.innerCometSprite}>
                  <span className={styles.innerCometTail} />
                  <span className={styles.innerCometHead} />
                </div>
              </div>
            </div>
          </div>

          {HUD_NODES.map(({ id, label, Icon, angle }) => (
            <div
              key={id}
              className={styles.hudNodeSlot}
              style={{ "--node-angle": `${angle}deg` } as CSSProperties}
            >
              <div className={styles.hudNode}>
                <Icon className={styles.hudNodeIcon} aria-hidden="true" />
                <span className="sr-only">{label}</span>
              </div>
            </div>
          ))}

          <div className={styles.cometLayer}>
            <div className={styles.cometRunner}>
              <div className={styles.cometAnchor}>
                <div className={styles.cometSprite}>
                  <span className={styles.cometTail} />
                  <span className={styles.cometHead} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.brandCore}>
          <Link href="/" className={styles.logoLink} aria-label="SaveRoute 홈">
            <Image
              src={SEARCH_HUB_LOGO_SRC}
              alt="SaveRoute"
              width={Math.round(SEARCH_HUB_LOGO_DISPLAY_WIDTH * 1.38)}
              height={Math.round(SEARCH_HUB_LOGO_DISPLAY_HEIGHT * 1.38)}
              priority
              className={styles.logo}
            />
          </Link>
          {SHOW_MAIN_LOGO_TAGLINE ? (
            <p className={styles.slogan}>{MAIN_LOGO_TAGLINE}</p>
          ) : null}
        </div>
      </section>

      <div
        className={cn("sr-user-search-hub__form", styles.searchWrap)}
        onClick={handleSearchAreaClick}
        onKeyDownCapture={handleSearchAreaKeyDown}
      >
        <SearchBar />
      </div>
    </div>
  );
}
