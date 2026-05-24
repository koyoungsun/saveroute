"use client";

import { useMemo, type CSSProperties } from "react";

import type { AnimatedBackgroundIntensity } from "@/lib/user/animated-background-intensity";
import { cn } from "@/lib/utils";

export type { AnimatedBackgroundIntensity };

type AnimatedBackgroundProps = {
  intensity?: AnimatedBackgroundIntensity;
};

const GRID_SIZE = 48;
const TWINKLE_COLUMNS = 36;
const TWINKLE_ROWS = 28;
const TWINKLE_RATIO = 0.35;
const WAVE_SLOT = 4;

type TwinkleDot = {
  id: string;
  x: number;
  y: number;
  delay: number;
  duration: number;
  wave: boolean;
};

function hashGridCell(row: number, col: number) {
  return ((row * 73856093) ^ (col * 19349663)) >>> 0;
}

function buildTwinkleDots(): TwinkleDot[] {
  const dots: TwinkleDot[] = [];

  for (let row = 0; row < TWINKLE_ROWS; row += 1) {
    for (let col = 0; col < TWINKLE_COLUMNS; col += 1) {
      const hash = hashGridCell(row, col);
      if (hash % 100 >= TWINKLE_RATIO * 100) {
        continue;
      }

      const wave = (hash >> 8) % WAVE_SLOT === 0;
      const delay = wave ? ((row + col) * 0.18) % 6 : (hash % 6500) / 1000;
      const duration = 3.5 + (hash % 3000) / 1000;

      dots.push({
        id: `${row}-${col}`,
        x: col * GRID_SIZE + GRID_SIZE / 2,
        y: row * GRID_SIZE + GRID_SIZE / 2,
        delay,
        duration,
        wave,
      });
    }
  }

  return dots;
}

export function AnimatedBackground({ intensity = "normal" }: AnimatedBackgroundProps) {
  const enableTwinkle = intensity === "subtle";
  const twinkleDots = useMemo(
    () => (enableTwinkle ? buildTwinkleDots() : []),
    [enableTwinkle],
  );

  if (intensity === "none") {
    return null;
  }

  return (
    <div
      className={cn("sr-animated-bg", `sr-animated-bg--${intensity}`)}
      aria-hidden="true"
    >
      <div className="sr-animated-bg__gradient" />
      <div className="sr-animated-bg__grid">
        {enableTwinkle ? (
          <div className="sr-animated-bg__dots">
            {twinkleDots.map((dot) => (
              <span
                key={dot.id}
                className={cn(
                  "sr-animated-bg__dot",
                  dot.wave && "sr-animated-bg__dot--wave",
                )}
                style={
                  {
                    left: `${dot.x}px`,
                    top: `${dot.y}px`,
                    "--sr-dot-delay": `${dot.delay}s`,
                    "--sr-dot-duration": `${dot.duration}s`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
