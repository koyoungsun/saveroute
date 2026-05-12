"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { AuthBrand } from "@/components/auth/AuthBrand";
import {
  getOAuthCallbackUrl,
  stashOAuthReturnPath,
} from "@/lib/auth/oauth-return-path";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const signupHref = "/auth/signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | "google">(null);

  const handleGoogle = async () => {
    setError("");
    setOauthLoading("google");
    await stashOAuthReturnPath("/");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getOAuthCallbackUrl() },
    });
    setOauthLoading(null);
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("* 이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    if (!authData.user) {
      setError("* 로그인에 실패했습니다. 다시 시도해 주세요.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10 md:py-16">
      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        <AuthBrand />

        <div className="mt-6 text-center">
          <p className="text-sm leading-6 text-gray-600">
            내 혜택 기준으로 더 정확한 할인을 확인해보세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              비밀번호
            </label>
            <div className="relative mt-2">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff className="size-5" aria-hidden="true" />
                ) : (
                  <Eye className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mx-auto flex h-12 w-full max-w-[280px] items-center justify-center rounded-3xl bg-sr-primary font-semibold text-white hover:bg-sr-primary-hover disabled:bg-gray-300 md:w-[70%]"
          >
            {isLoading ? "로그인 중..." : "이메일로 로그인"}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <p className="shrink-0 text-xs font-medium text-gray-400">또는</p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => void handleGoogle()}
            disabled={oauthLoading !== null}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-3xl border border-gray-200 bg-white font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
          >
            <Image
              src="/icons/icon_google.png"
              alt=""
              width={20}
              height={20}
              style={{ height: "20px", width: "20px" }}
              aria-hidden="true"
            />
            {oauthLoading === "google" ? "이동 중..." : "Google로 계속하기"}
          </button>
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          아직 계정이 없나요?{" "}
          <Link href={signupHref} className="font-semibold text-orange-600">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-xl px-4 py-16 text-center text-sm text-gray-500">
          불러오는 중…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
