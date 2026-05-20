import { SEARCH_LOG_DEDUP_MS } from "./search-log-constants";

export function shouldSkipClientSearchLogDedup(
  normalizedKeyword: string,
  nowMs: number,
  recentByKeyword: ReadonlyMap<string, number>,
  windowMs: number = SEARCH_LOG_DEDUP_MS,
): boolean {
  const lastAt = recentByKeyword.get(normalizedKeyword);
  if (lastAt == null) {
    return false;
  }
  return nowMs - lastAt < windowMs;
}

export function markClientSearchLogDedup(
  recentByKeyword: Map<string, number>,
  normalizedKeyword: string,
  nowMs: number,
): void {
  recentByKeyword.set(normalizedKeyword, nowMs);
}
