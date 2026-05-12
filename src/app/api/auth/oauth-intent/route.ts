import { NextResponse } from "next/server";

import {
  SR_OAUTH_NEXT_COOKIE,
  sanitizeOAuthNextPath,
} from "@/lib/auth/oauth-return-path";

/** Google OAuth 직전에 클라이언트가 호출해 돌아올 경로를 저장합니다. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw =
    body !== null &&
    typeof body === "object" &&
    "next" in body &&
    typeof (body as { next: unknown }).next === "string"
      ? (body as { next: string }).next
      : "/my-benefits";

  const next = sanitizeOAuthNextPath(raw);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SR_OAUTH_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
