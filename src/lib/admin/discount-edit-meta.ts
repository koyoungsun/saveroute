export function formatDiscountElapsedDays(
  isoDate: string,
  nowMs = Date.now(),
): number {
  const then = new Date(isoDate).getTime();
  if (Number.isNaN(then)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMs - then) / 86_400_000));
}

export function formatDiscountElapsedBadge(
  prefix: "작성 후" | "수정 후",
  isoDate: string,
): string {
  const days = formatDiscountElapsedDays(isoDate);
  if (days === 0) {
    return `${prefix} 오늘`;
  }

  return `${prefix} ${days}일 경과`;
}
