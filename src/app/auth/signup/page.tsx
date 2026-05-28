"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { AuthField } from "@/components/auth/AuthField";
import { AuthPageChrome } from "@/components/auth/AuthPageChrome";
import { AuthSelectField } from "@/components/auth/AuthSelectField";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { UserPage } from "@/components/layout/UserPage";
import {
  buildSignupUserMetadata,
  upsertSignupProfile,
  validateSignupProfileFields,
} from "@/lib/auth/signup-profile";
import {
  getOAuthCallbackUrl,
  stashOAuthReturnPath,
} from "@/lib/auth/oauth-return-path";
import {
  PROFILE_AGE_GROUP_OPTIONS,
  PROFILE_GENDER_OPTIONS,
} from "@/lib/profile/demographics";
import {
  SHOW_AUTH_OAUTH,
  SHOW_AUTH_SWITCH_LINK,
  SHOW_AUTH_TAGLINE,
} from "@/lib/user/home-layout-flags";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const loginHref = "/auth/login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [allowSearchStats, setAllowSearchStats] = useState(true);
  const [allowPersonalizedRecommendations, setAllowPersonalizedRecommendations] =
    useState(true);
  const [allowMarketingNotifications, setAllowMarketingNotifications] = useState(false);
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

    if (!email.trim()) {
      setError("* 이메일을 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      setError("* 비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("* 비밀번호가 일치하지 않습니다.");
      return;
    }

    const profileValidation = validateSignupProfileFields({
      nickname,
      gender,
      ageGroup,
    });

    if (!profileValidation.ok) {
      setError(profileValidation.message);
      return;
    }

    setError("");
    setIsLoading(true);

    const profileInput = {
      ...profileValidation.value,
      allowSearchStats,
      allowPersonalizedRecommendations,
      allowMarketingNotifications,
    };

    const supabase = createClient();
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: buildSignupUserMetadata(profileInput),
      },
    });

    if (signUpError) {
      setIsLoading(false);
      setError(signUpError.message);
      return;
    }

    if (signUpData.user?.id) {
      const { error: profileError } = await upsertSignupProfile(
        supabase,
        signUpData.user.id,
        profileInput,
      );

      if (profileError) {
        setIsLoading(false);
        setError(profileError.message);
        return;
      }
    }

    await supabase.auth.signOut();
    setIsLoading(false);
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <UserPage tone="comfortable" as="main" className="sr-user-auth-page">
      <AuthPageChrome />

      <div className="sr-user-auth-page__body">
        <section className="sr-user-auth-form">
          {SHOW_AUTH_TAGLINE ? (
            <p className="sr-user-auth-form__tagline sr-user-canvas-text-secondary text-center">
              통신사와 카드를 등록하면 받을 수 있는 할인을 먼저 보여드려요.
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
              id="nickname"
              label="닉네임"
              type="text"
              autoComplete="nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
            />

            <AuthSelectField
              id="gender"
              label="성별"
              value={gender}
              options={PROFILE_GENDER_OPTIONS}
              placeholder="성별 선택"
              onChange={(event) => setGender(event.target.value)}
            />

            <AuthSelectField
              id="age_group"
              label="연령대"
              value={ageGroup}
              options={PROFILE_AGE_GROUP_OPTIONS}
              placeholder="연령대 선택"
              onChange={(event) => setAgeGroup(event.target.value)}
            />

            <p className="sr-user-auth-form__hint">
              성별과 연령대는 개인 식별이 아닌 할인 통계와 추천 품질 개선에만 사용됩니다.
            </p>

            <AuthField
              id="password"
              label="비밀번호 (8자 이상)"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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

            <AuthField
              id="password-confirm"
              label="비밀번호 확인"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
            />

            <div className="sr-user-auth-consent">
              <label className="sr-user-auth-consent__label">
                <input
                  type="checkbox"
                  checked={allowSearchStats}
                  onChange={(event) => setAllowSearchStats(event.target.checked)}
                />
                검색 통계 저장에 동의
              </label>
              <label className="sr-user-auth-consent__label">
                <input
                  type="checkbox"
                  checked={allowPersonalizedRecommendations}
                  onChange={(event) =>
                    setAllowPersonalizedRecommendations(event.target.checked)
                  }
                />
                맞춤 할인 추천 사용
              </label>
              <label className="sr-user-auth-consent__label">
                <input
                  type="checkbox"
                  checked={allowMarketingNotifications}
                  onChange={(event) =>
                    setAllowMarketingNotifications(event.target.checked)
                  }
                />
                알림 · 마케팅 정보 수신 동의
              </label>
            </div>

            {error ? <p className="sr-user-auth-form__error">{error}</p> : null}

            <AuthSubmitButton disabled={isLoading} className="sr-user-auth-form__submit">
              {isLoading ? "가입 중..." : "이메일로 가입하기"}
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
              이미 계정이 있으신가요?{" "}
              <Link href={loginHref} className="sr-user-auth-form__link">
                로그인
              </Link>
            </p>
          ) : null}
        </section>
      </div>
    </UserPage>
  );
}

export default function SignupPage() {
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
      <SignupForm />
    </Suspense>
  );
}
