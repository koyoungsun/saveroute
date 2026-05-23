import Link from "next/link";

type SearchGuestLoginPromptProps = {
  loginRedirect: string;
};

export function SearchGuestLoginPrompt({ loginRedirect }: SearchGuestLoginPromptProps) {
  const loginHref = `/auth/login?redirect=${encodeURIComponent(loginRedirect)}`;

  return (
    <section className="sr-user-card sr-user-search-guest-login-prompt" aria-label="로그인 안내">
      <p className="sr-user-search-guest-login-prompt__message sr-user-t-body sr-user-text-secondary">
        내 혜택 기준 BEST 할인은 로그인 후 확인할 수 있어요
      </p>
      <Link
        href={loginHref}
        className="sr-user-btn-primary sr-user-btn-primary--compact sr-user-btn-primary--block mt-3"
      >
        로그인하기
      </Link>
    </section>
  );
}
