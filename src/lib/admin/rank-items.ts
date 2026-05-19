export type RankedItem<T> = T & { rank: number };

function readScore(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return NaN;
}

/**
 * Competition-style ranks for score-sorted lists.
 * Equal scores share the same rank; the next rank skips occupied positions.
 *
 * Example scores [100, 100, 80, 70, 70, 60] → ranks [1, 1, 3, 4, 4, 6]
 */
export function getRankedItems<T extends object>(
  items: readonly T[],
  scoreKey: keyof T,
): RankedItem<T>[] {
  const sorted = [...items].sort(
    (a, b) => readScore(b[scoreKey]) - readScore(a[scoreKey]),
  );

  let prevScore: number | null = null;
  let prevRank = 0;

  return sorted.map((item, index) => {
    const score = readScore(item[scoreKey]);
    let rank: number;

    if (index === 0) {
      rank = 1;
    } else if (score === prevScore) {
      rank = prevRank;
    } else {
      rank = index + 1;
    }

    prevScore = score;
    prevRank = rank;

    return { ...item, rank };
  });
}

export function formatRank(rank: number) {
  return `${rank}위`;
}
