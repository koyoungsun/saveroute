export const ZOOM_STORAGE_KEY = "sr_zoom_level";

export const ZOOM_LEVELS = [0.9, 1, 1.1, 1.2] as const;

export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

export const ZOOM_DEFAULT: ZoomLevel = 1;

export function isZoomLevel(value: number): value is ZoomLevel {
  return (ZOOM_LEVELS as readonly number[]).includes(value);
}

export function clampZoomLevel(raw: number): ZoomLevel {
  if (!Number.isFinite(raw)) {
    return ZOOM_DEFAULT;
  }

  let nearest: ZoomLevel = ZOOM_DEFAULT;
  let minDistance = Number.POSITIVE_INFINITY;

  for (const level of ZOOM_LEVELS) {
    const distance = Math.abs(level - raw);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = level;
    }
  }

  return nearest;
}

export function readZoomLevel(): ZoomLevel {
  if (typeof window === "undefined") {
    return ZOOM_DEFAULT;
  }

  try {
    const raw = localStorage.getItem(ZOOM_STORAGE_KEY);
    if (raw == null || raw === "") {
      return ZOOM_DEFAULT;
    }

    const parsed = Number.parseFloat(raw);
    const clamped = clampZoomLevel(parsed);

    if (parsed !== clamped) {
      writeZoomLevel(clamped);
    }

    return clamped;
  } catch {
    return ZOOM_DEFAULT;
  }
}

export function writeZoomLevel(level: ZoomLevel): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(level));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function formatZoomPercent(level: ZoomLevel): string {
  return `${Math.round(level * 100)}%`;
}

export function getNextZoomLevel(level: ZoomLevel): ZoomLevel {
  const index = ZOOM_LEVELS.indexOf(level);
  return ZOOM_LEVELS[Math.min(index + 1, ZOOM_LEVELS.length - 1)] ?? level;
}

export function getPrevZoomLevel(level: ZoomLevel): ZoomLevel {
  const index = ZOOM_LEVELS.indexOf(level);
  return ZOOM_LEVELS[Math.max(index - 1, 0)] ?? level;
}
