/** Admin dashboard "오늘" 집계 기준 타임존 (KST). */
export const ADMIN_STATS_TIMEZONE = "Asia/Seoul";

export type StatsDayWindow = {
  timezone: string;
  /** KST 기준 YYYY-MM-DD */
  localDateLabel: string;
  /** created_at >= startIso */
  start: Date;
  /** created_at < endExclusiveIso */
  endExclusive: Date;
  startIso: string;
  endExclusiveIso: string;
};

function formatKstDateLabel(referenceDate: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ADMIN_STATS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referenceDate);
}

/**
 * search_logs "오늘" COUNT 범위: KST 00:00 <= created_at < 다음날 00:00
 * (전체 COUNT(*) 가 아님)
 */
export function getSearchLogsTodayWindow(referenceDate = new Date()): StatsDayWindow {
  const localDateLabel = formatKstDateLabel(referenceDate);
  const start = new Date(`${localDateLabel}T00:00:00+09:00`);
  const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return {
    timezone: ADMIN_STATS_TIMEZONE,
    localDateLabel,
    start,
    endExclusive,
    startIso: start.toISOString(),
    endExclusiveIso: endExclusive.toISOString(),
  };
}
