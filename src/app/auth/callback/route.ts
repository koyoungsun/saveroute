import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { logAuthDebug } from "@/lib/auth/log-auth-debug";
import {
  SR_OAUTH_NEXT_COOKIE,
  sanitizeOAuthNextPath,
} from "@/lib/auth/oauth-return-path";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function clearOAuthNextCookie(response: NextResponse) {
  response.cookies.set(SR_OAUTH_NEXT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const cookieStore = await cookies();
  const cookieRaw = cookieStore.get(SR_OAUTH_NEXT_COOKIE)?.value;
  const fromCookie =
    cookieRaw !== undefined && cookieRaw !== ""
      ? sanitizeOAuthNextPath(cookieRaw)
      : null;

  const nextFromQuery = url.searchParams.get("next");
  const fromQuery =
    nextFromQuery != null &&
    nextFromQuery.startsWith("/") &&
    !nextFromQuery.startsWith("//")
      ? sanitizeOAuthNextPath(nextFromQuery)
      : null;
  const safeNext = fromCookie ?? fromQuery ?? "/";

  if (!code) {
    const response = NextResponse.redirect(new URL("/auth/login", url.origin));
    clearOAuthNextCookie(response);
    return response;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const response = NextResponse.redirect(
      new URL(`/auth/login?error=oauth`, url.origin),
    );
    clearOAuthNextCookie(response);
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    const response = NextResponse.redirect(new URL("/auth/login", url.origin));
    clearOAuthNextCookie(response);
    return response;
  }

  logAuthDebug("oauth-callback", {
    userId: user.id,
    email: user.email ?? undefined,
    activeUserBenefitsCount: 0,
  });

  const response = NextResponse.redirect(new URL(safeNext, url.origin));
  clearOAuthNextCookie(response);
  return response;
}
