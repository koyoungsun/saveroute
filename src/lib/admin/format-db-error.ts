/** Supabase PostgREST / Postgres style errors from `supabase.from(...)` */

export type SupabaseLikeError = {
  message: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

function pickTableOrView(text: string | undefined | null): string | undefined {
  if (!text) return undefined;

  let m =
    text.match(/Could not find the table '([^']+)'/i) ||
    text.match(/relation '(?:public\.)?([^']+)' does not exist/i);
  if (m?.[1]) return `테이블/뷰: ${m[1].trim()}`;

  m = text.match(/schema cache[^\n]*table '([^']+)'/i);
  if (m?.[1]) return `테이블: ${m[1].trim()}`;

  return undefined;
}

function pickColumn(text: string | undefined | null): string | undefined {
  if (!text) return undefined;

  const m =
    text.match(/column '([^']+)' does not exist/i) ||
    text.match(/Could not find the '([^']+)' column/i);
  if (m?.[1]) return `컬럼: ${m[1].trim()}`;
  return undefined;
}

/** Operator-facing 한국어 줄 단위 요약 — 어느 테이블/컬럼이 빠졌는지 최대한 구체적으로 */
export function describeSupabaseQueryFailure(
  operationLabel: string,
  error: SupabaseLikeError,
): string {
  const lines: string[] = [];
  lines.push(`[${operationLabel}]`);
  lines.push(`메시지: ${error.message}`);

  if (error.code) {
    lines.push(`코드: ${error.code}`);
  }

  const combined = [error.message, error.details, error.hint].filter(Boolean).join(" \n");
  const tableLine = pickTableOrView(combined);
  const columnLine = pickColumn(combined);
  if (tableLine) lines.push(`확인: ${tableLine}`);
  if (columnLine) lines.push(`확인: ${columnLine}`);

  if (error.details) {
    lines.push(`상세: ${error.details}`);
  }
  if (error.hint) {
    lines.push(`힌트: ${error.hint}`);
  }

  lines.push(
    "조치: Supabase에 필요한 마이그레이션이 적용되었는지, 스키마 캐시가 최신인지 확인하세요.",
  );

  return lines.join("\n");
}
