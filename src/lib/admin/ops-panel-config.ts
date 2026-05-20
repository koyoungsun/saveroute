export const OPS_PANEL_POLL_INTERVAL_MS = 60_000;

export const OPS_PANEL_WINDOW_PRESETS = {
  minutes_10: 10,
  minutes_30: 30,
  hours_3: 180,
  today: "today",
} as const;

export type OpsPanelWindowPreset = keyof typeof OPS_PANEL_WINDOW_PRESETS;

/** 초기 운영 기본값 — 추후 Admin 설정(10분/30분/3시간/오늘)에서 교체 가능 */
export const OPS_PANEL_ACTIVE_WINDOW_PRESET: OpsPanelWindowPreset = "hours_3";

export function resolveOpsPanelWindowSince(preset: OpsPanelWindowPreset): string {
  const value = OPS_PANEL_WINDOW_PRESETS[preset];

  if (value === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }

  return new Date(Date.now() - value * 60 * 1000).toISOString();
}

export function getOpsPanelWindowLabel(preset: OpsPanelWindowPreset): string {
  switch (preset) {
    case "minutes_10":
      return "최근 10분";
    case "minutes_30":
      return "최근 30분";
    case "hours_3":
      return "최근 3시간";
    case "today":
      return "오늘";
    default:
      return "최근 3시간";
  }
}

export function getOpsPanelPollIntervalLabel(intervalMs = OPS_PANEL_POLL_INTERVAL_MS): string {
  return `${Math.round(intervalMs / 1000)}s`;
}
