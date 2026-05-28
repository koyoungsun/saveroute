"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { AuthField } from "@/components/auth/AuthField";
import { AuthPageChrome } from "@/components/auth/AuthPageChrome";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { UserPage } from "@/components/layout/UserPage";
import {
  getOAuthCallbackUrl,
  stashOAuthReturnPath,
} from "@/lib/auth/oauth-return-path";
import {
  SHOW_AUTH_OAUTH,
  SHOW_AUTH_SWITCH_LINK,
  SHOW_AUTH_TAGLINE,
} from "@/lib/user/home-layout-flags";
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
    <UserPage tone="comfortable" as="main" className="sr-user-auth-page">
      <AuthPageChrome />

      <div className="sr-user-auth-page__body">
        <section className="sr-user-auth-form">
          <p className="sr-user-auth-form__tagline sr-user-canvas-text-secondary text-center">
            가입 후 내 할인 혜택을 저장하고 맞춤 할인 결과를 확인해보세요.
          </p>

          {SHOW_AUTH_TAGLINE ? (
            <p className="sr-user-auth-form__tagline sr-user-canvas-text-secondary text-center">
              내 혜택 기준으로 더 정확한 할인을 확인해보세요.
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="sr-user-auth-form__fields">
            <AuthField
              id="email"
              label="이메일"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <AuthField
              id="password"
              label="비밀번호"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              endAdornment={
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  className="sr-user-auth-field__toggle"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                  ) : (
                    <Eye className="size-5" aria-hidden="true" />
                  )}
                </button>
              }
            />

            {error ? <p className="sr-user-auth-form__error">{error}</p> : null}

            <AuthSubmitButton disabled={isLoading} className="sr-user-auth-form__submit">
              {isLoading ? "로그인 중..." : "이메일로 로그인"}
            </AuthSubmitButton>
          </form>

          {SHOW_AUTH_OAUTH ? (
            <>
              <div className="sr-user-auth-form__divider" aria-hidden="true">
                <span className="sr-user-auth-form__divider-line" />
                <span className="sr-user-auth-form__divider-label">또는</span>
                <span className="sr-user-auth-form__divider-line" />
              </div>

              <button
                type="button"
                onClick={() => void handleGoogle()}
                disabled={oauthLoading !== null}
                className="sr-user-auth-oauth-btn"
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
            </>
          ) : null}

          {SHOW_AUTH_SWITCH_LINK ? (
            <p className="sr-user-auth-form__switch sr-user-canvas-text-secondary">
              아직 계정이 없나요?{" "}
              <Link href={signupHref} className="sr-user-auth-form__link">
                회원가입
              </Link>
            </p>
          ) : null}
        </section>
      </div>
    </UserPage>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <UserPage tone="comfortable" as="main" className="sr-user-auth-page">
          <p className="sr-user-auth-form__status sr-user-canvas-text-secondary text-center">
            불러오는 중…
          </p>
        </UserPage>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
