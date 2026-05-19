/** localStorage와 동일 키 (RootLayout 내 bootstrap 스크립트와 문자열 동기 유지) */
export const FONT_SCALE_STORAGE_KEY = "saveroute-font-scale";

export const FONT_SCALE_DEFAULT = 100;
export const FONT_SCALE_MIN = 90;
export const FONT_SCALE_MAX = 130;
export const FONT_SCALE_STEP = 10;

export function clampFontScalePercent(raw: number): number {
  if (!Number.isFinite(raw)) {
    return FONT_SCALE_DEFAULT;
  }
  const stepped = Math.round(raw / FONT_SCALE_STEP) * FONT_SCALE_STEP;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, stepped));
}

export function readFontScalePercent(): number {
  if (typeof window === "undefined") {
    return FONT_SCALE_DEFAULT;
  }
  try {
    const parsed = Number.parseInt(localStorage.getItem(FONT_SCALE_STORAGE_KEY) ?? "", 10);
    if (!Number.isFinite(parsed)) {
      return FONT_SCALE_DEFAULT;
    }
    const clamped = clampFontScalePercent(parsed);
    if (clamped !== parsed) {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(clamped));
    }
    return clamped;
  } catch {
    return FONT_SCALE_DEFAULT;
  }
}

export function writeFontScalePercent(percent: number): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const v = clampFontScalePercent(percent);
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(v));
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function applyFontScaleToDocument(percent: number): void {
  if (typeof document === "undefined") {
    return;
  }
  const v = clampFontScalePercent(percent);
  document.documentElement.style.setProperty("--font-scale", String(v / 100));
}
