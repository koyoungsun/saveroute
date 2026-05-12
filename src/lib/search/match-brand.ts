import type { BrandCandidateRow } from "./helpers";
import { isOrderedSubsequence, normalizeKeyword } from "./helpers";

export type MatchStrategy =
  | "exact_name"
  | "exact_alias"
  | "exact_slug"
  | "partial_name"
  | "partial_alias"
  | "fuzzy";

export type BrandMatchResult = {
  brand: BrandCandidateRow;
  strategy: MatchStrategy;
  score: number;
};

/** PostgREST ilike 패턴용 이스케이프 (%, _, \\) */
export function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const STRATEGY_WEIGHT: Record<MatchStrategy, number> = {
  exact_name: 1_000_000,
  exact_alias: 900_000,
  exact_slug: 800_000,
  partial_name: 700_000,
  partial_alias: 600_000,
  fuzzy: 500_000,
};

/** 짧은 브랜드명(더 구체적으로 보이는 매칭)에 소폭 가산 */
function specificityBonus(brand: BrandCandidateRow): number {
  const n = normalizeKeyword(brand.name);
  return Math.max(0, 220 - Math.min(220, n.length));
}

export function strategyDebugLabel(strategy: MatchStrategy): string {
  const labels: Record<MatchStrategy, string> = {
    exact_name: "exact name",
    exact_alias: "exact alias",
    exact_slug: "exact slug",
    partial_name: "partial name",
    partial_alias: "partial alias",
    fuzzy: "fuzzy fallback",
  };
  return labels[strategy];
}

export function slugExactMatch(brand: BrandCandidateRow, keyword: string, normalized: string): boolean {
  const kl = keyword.trim().toLowerCase();
  const slug = brand.slug?.toLowerCase() ?? "";
  const slugNorm = normalizeKeyword(brand.slug);
  if (slugNorm === normalized) return true;
  if (slug === kl) return true;
  const parts = slug.split("-").filter(Boolean);
  return parts.some((p) => p === kl || normalizeKeyword(p) === normalized);
}

export function filterExactNameCandidates(rows: BrandCandidateRow[], keyword: string): BrandCandidateRow[] {
  const kl = keyword.trim().toLowerCase();
  return rows.filter((b) => b.name.trim().toLowerCase() === kl);
}

export function filterExactAliasCandidates(
  rows: BrandCandidateRow[],
  keyword: string,
  normalized: string,
): BrandCandidateRow[] {
  const raw = keyword.trim();
  const kl = raw.toLowerCase();
  return rows.filter((b) =>
    (b.aliases ?? []).some((alias) => {
      const t = alias.trim();
      const tl = t.toLowerCase();
      return tl === kl || normalizeKeyword(t) === normalized || t === raw;
    }),
  );
}

export function filterPartialNameCandidates(rows: BrandCandidateRow[], normalized: string): BrandCandidateRow[] {
  if (normalized.length < 2) return [];
  return rows.filter((b) => normalizeKeyword(b.name).includes(normalized));
}

export function filterPartialAliasCandidates(
  rows: BrandCandidateRow[],
  normalized: string,
): BrandCandidateRow[] {
  if (normalized.length < 2) return [];
  return rows.filter((b) =>
    (b.aliases ?? []).some((alias) => {
      const an = normalizeKeyword(alias);
      if (!an) return false;
      return an.includes(normalized);
    }),
  );
}

export function filterFuzzyCandidates(rows: BrandCandidateRow[], normalized: string): BrandCandidateRow[] {
  if (normalized.length < 3) return [];
  return rows.filter(
    (b) =>
      isOrderedSubsequence(normalized, normalizeKeyword(b.name)) ||
      isOrderedSubsequence(normalized, normalizeKeyword(b.slug)) ||
      (b.aliases ?? []).some((alias) => isOrderedSubsequence(normalized, normalizeKeyword(alias))),
  );
}

export function pickBestInTier(
  brands: BrandCandidateRow[],
  strategy: MatchStrategy,
): BrandCandidateRow | null {
  if (brands.length === 0) return null;
  const weight = STRATEGY_WEIGHT[strategy];
  const scored = brands.map((brand) => ({
    brand,
    score: weight + specificityBonus(brand),
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.brand.name.localeCompare(b.brand.name, "ko");
  });
  return scored[0]!.brand;
}

export function buildMatchResult(brand: BrandCandidateRow, strategy: MatchStrategy): BrandMatchResult {
  return {
    brand,
    strategy,
    score: STRATEGY_WEIGHT[strategy] + specificityBonus(brand),
  };
}

export function dedupeBrandsById(rows: BrandCandidateRow[]): BrandCandidateRow[] {
  const map = new Map<number, BrandCandidateRow>();
  for (const row of rows) {
    map.set(row.id, row);
  }
  return [...map.values()];
}

/**
 * DB 없이 풀 브랜드 배열에 동일 티어 순서를 적용 (테스트·회귀용).
 * 운영 검색은 DB 단계별 조회와 함께 `performSearch`를 사용합니다.
 */
export function resolveBrandMatchFromPool(
  brands: BrandCandidateRow[],
  keyword: string,
): BrandMatchResult | null {
  const normalized = normalizeKeyword(keyword);
  if (!keyword.trim()) return null;

  const t1 = filterExactNameCandidates(brands, keyword);
  const b1 = pickBestInTier(t1, "exact_name");
  if (b1) return buildMatchResult(b1, "exact_name");

  const t2 = filterExactAliasCandidates(brands, keyword, normalized);
  const b2 = pickBestInTier(t2, "exact_alias");
  if (b2) return buildMatchResult(b2, "exact_alias");

  const t3 = brands.filter((b) => slugExactMatch(b, keyword, normalized));
  const b3 = pickBestInTier(t3, "exact_slug");
  if (b3) return buildMatchResult(b3, "exact_slug");

  const t4 = filterPartialNameCandidates(brands, normalized);
  const b4 = pickBestInTier(t4, "partial_name");
  if (b4) return buildMatchResult(b4, "partial_name");

  const t5 = filterPartialAliasCandidates(brands, normalized);
  const b5 = pickBestInTier(t5, "partial_alias");
  if (b5) return buildMatchResult(b5, "partial_alias");

  const t6 = filterFuzzyCandidates(brands, normalized);
  const b6 = pickBestInTier(t6, "fuzzy");
  if (b6) return buildMatchResult(b6, "fuzzy");

  return null;
}
