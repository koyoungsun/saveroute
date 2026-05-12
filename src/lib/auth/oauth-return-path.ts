/** OAuth 완료 후 이동 경로를 잠깐 보관하는 쿠키 (redirect_to에는 쿼리를 붙이지 않기 위함). */
export const SR_OAUTH_NEXT_COOKIE = "sr_oauth_next";

/**
 * Supabase `redirect_to` 검증은 보통 쿼리 없는 URL만 허용 목록과 맞습니다.
 * `?next=` 는 400을 유발할 수 있어 쿠키로만 전달합니다.
 */
export function getOAuthCallbackUrl(): string {
  return `${window.location.origin}/auth/callback`;
}

export function sanitizeOAuthNextPath(value: string): string {
  const t = value.trim();
  if (!t.startsWith("/") || t.startsWith("//")) {
    return "/";
  }
  return t;
}

export async function stashOAuthReturnPath(nextPath: string): Promise<void> {
  const next = sanitizeOAuthNextPath(nextPath);
  await fetch("/api/auth/oauth-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ next }),
  });
}
