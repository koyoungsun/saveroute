const CARD_SEARCH_STOPWORD = "카드";

export function stripCardSearchStopwordToken(token: string): string | null {
  if (token === CARD_SEARCH_STOPWORD) {
    return null;
  }

  if (
    token.endsWith(CARD_SEARCH_STOPWORD) &&
    token.length > CARD_SEARCH_STOPWORD.length
  ) {
    const stripped = token.slice(0, -CARD_SEARCH_STOPWORD.length);
    return stripped.length > 0 ? stripped : null;
  }

  return token;
}

/** 카드 상품 검색용: 소문자·공백 압축 + '카드' 불용어 제거 */
export function normalizeCardProductSearchKey(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, " ").toLowerCase();
  if (!collapsed) {
    return "";
  }

  const tokens = collapsed.split(" ");
  const normalizedTokens: string[] = [];

  for (const token of tokens) {
    const stripped = stripCardSearchStopwordToken(token);
    if (stripped) {
      normalizedTokens.push(stripped);
    }
  }

  return normalizedTokens.join(" ");
}
