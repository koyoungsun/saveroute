import Image from "next/image";
import Link from "next/link";

import { SearchBar } from "@/components/search/SearchBar";
import { SHOW_MAIN_COPY, SHOW_MAIN_LOGO_TAGLINE } from "@/lib/user/home-layout-flags";
import { MAIN_LOGO_TAGLINE } from "@/lib/user/brand-slogan";
import {
  SEARCH_HUB_LOGO_DISPLAY_HEIGHT,
  SEARCH_HUB_LOGO_DISPLAY_WIDTH,
  SEARCH_HUB_LOGO_SRC,
} from "@/lib/user/search-hub-branding";
import { cn } from "@/lib/utils";

type SearchHubChromeProps = {
  variant?: "home" | "results";
  defaultValue?: string;
  hideSuggestions?: boolean;
  hideSubmitButton?: boolean;
};

export function SearchHubChrome({
  variant = "results",
  defaultValue = "",
  hideSuggestions = false,
  hideSubmitButton = false,
}: SearchHubChromeProps) {
  return (
    <div
      className={cn(
        "sr-user-search-hub",
        variant === "home" && "sr-user-search-hub--home",
        variant === "results" && "sr-user-search-hub--results",
      )}
    >
      <div className="sr-user-search-hub__logo-wrap">
        <Link href="/" className="sr-user-search-hub__logo-link" aria-label="SaveRoute 홈">
          <Image
            src={SEARCH_HUB_LOGO_SRC}
            alt="SaveRoute"
            width={SEARCH_HUB_LOGO_DISPLAY_WIDTH}
            height={SEARCH_HUB_LOGO_DISPLAY_HEIGHT}
            priority={variant === "home"}
            className="sr-user-search-hub__logo"
          />
        </Link>
        {variant === "home" && SHOW_MAIN_LOGO_TAGLINE ? (
          <p className="sr-user-search-hub__logo-tagline">{MAIN_LOGO_TAGLINE}</p>
        ) : null}
      </div>

      {/* Legacy copy: 추후 메인 카피 영역으로 재노출 예정 */}
      {variant === "home" && SHOW_MAIN_COPY ? (
        <p className="sr-user-home-intro__slogan sr-user-search-hub__copy mt-4 text-center">
          나를 위한{" "}
          <span className="sr-user-home-intro__slogan-accent sr-user-accent-text">
            최적의 할인 루트
          </span>
        </p>
      ) : null}

      <div
        className={cn(
          "sr-user-search-hub__form",
          variant === "home" && "sr-user-content-width",
        )}
      >
        <SearchBar
          defaultValue={defaultValue}
          hideSuggestions={hideSuggestions}
          hideSubmitButton={hideSubmitButton}
        />
      </div>
    </div>
  );
}
