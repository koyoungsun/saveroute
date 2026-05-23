"use client";

import { useMemo, type CSSProperties } from "react";

import styles from "./DataScanFragments.module.css";

const SCAN_KEYWORDS_FULL = [
  "%",
  "CARD",
  "VIP",
  "POINT",
  "BEST",
  "SCAN",
  "ROUTE",
  "SAVE",
] as const;

const SCAN_KEYWORDS_LITE = ["%", "CARD", "VIP", "SCAN", "ROUTE"] as const;

type FragmentVariant = "blue" | "violet" | "white";

type ScanFragment = {
  id: string;
  text: string;
  left: number;
  top: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  peakOpacity: number;
  variant: FragmentVariant;
};

type DataScanFragmentsProps = {
  className?: string;
  intensity?: "full" | "lite";
};

const VARIANT_CLASS: Record<FragmentVariant, string> = {
  blue: styles.variantBlue,
  violet: styles.variantViolet,
  white: styles.variantWhite,
};

function buildFragments(keywords: readonly string[]): ScanFragment[] {
  return keywords.map((text, index) => {
    const seed = (index + 1) * 19;

    return {
      id: `scan-${index}`,
      text,
      left: 5 + (seed * 2.9) % 90,
      top: 6 + (seed * 4.1) % 86,
      delay: index * 140,
      duration: 1300 + (index % 3) * 180,
      driftX: 18 + (index % 4) * 6,
      driftY: -12 - (index % 3) * 5,
      peakOpacity: 0.14 + (index % 3) * 0.04,
      variant: (["blue", "violet", "white"] as const)[index % 3],
    };
  });
}

export function DataScanFragments({
  className,
  intensity = "full",
}: DataScanFragmentsProps) {
  const fragments = useMemo(
    () =>
      buildFragments(intensity === "lite" ? SCAN_KEYWORDS_LITE : SCAN_KEYWORDS_FULL),
    [intensity],
  );

  return (
    <div
      className={[styles.field, intensity === "lite" && styles.fieldLite, className]
        .filter(Boolean)
        .join(" ")}
      aria-hidden="true"
    >
      {fragments.map((fragment) => (
        <span
          key={fragment.id}
          className={[styles.fragment, VARIANT_CLASS[fragment.variant]].join(" ")}
          style={
            {
              left: `${fragment.left}%`,
              top: `${fragment.top}%`,
              "--scan-delay": `${fragment.delay}ms`,
              "--scan-duration": `${fragment.duration}ms`,
              "--scan-drift-x": `${fragment.driftX}px`,
              "--scan-drift-y": `${fragment.driftY}px`,
              "--scan-peak": fragment.peakOpacity,
            } as CSSProperties
          }
        >
          {fragment.text}
        </span>
      ))}
    </div>
  );
}
