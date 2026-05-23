import Image from "next/image";
import Link from "next/link";

import { AUTH_HUB_SLOGAN } from "@/lib/user/brand-slogan";
import {
  SHOW_ACCOUNT_SLOGAN,
  SHOW_AUTH_SLOGAN,
  SHOW_CONTENT_SLOGAN,
} from "@/lib/user/home-layout-flags";
import {
  SEARCH_HUB_LOGO_DISPLAY_HEIGHT,
  SEARCH_HUB_LOGO_DISPLAY_WIDTH,
  SEARCH_HUB_LOGO_SRC,
} from "@/lib/user/search-hub-branding";
import { cn } from "@/lib/utils";

type BrandHubChromeProps = {
  variant?: "auth" | "account" | "content";
};

export function BrandHubChrome({ variant = "account" }: BrandHubChromeProps) {
  const showSlogan =
    variant === "auth"
      ? SHOW_AUTH_SLOGAN
      : variant === "content"
        ? SHOW_CONTENT_SLOGAN
        : SHOW_ACCOUNT_SLOGAN;

  return (
    <div
      className={cn(
        "sr-user-search-hub sr-user-brand-hub",
        variant === "auth" && "sr-user-search-hub--auth",
        (variant === "account" || variant === "content") && "sr-user-brand-hub--account",
      )}
    >
      <div className="sr-user-search-hub__logo-wrap">
        <Link href="/" className="sr-user-search-hub__logo-link" aria-label="SaveRoute 홈">
          <Image
            src={SEARCH_HUB_LOGO_SRC}
            alt="SaveRoute"
            width={SEARCH_HUB_LOGO_DISPLAY_WIDTH}
            height={SEARCH_HUB_LOGO_DISPLAY_HEIGHT}
            priority
            className="sr-user-search-hub__logo"
          />
        </Link>
        {showSlogan ? (
          <p className="sr-user-brand-hub__slogan">{AUTH_HUB_SLOGAN}</p>
        ) : null}
      </div>
    </div>
  );
}
