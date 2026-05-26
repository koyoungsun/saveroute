import Image from "next/image";
import Link from "next/link";

import { AUTH_HUB_SLOGAN } from "@/lib/user/brand-slogan";
import {
  MENU_LOGO_DISPLAY_HEIGHT,
  MENU_LOGO_DISPLAY_WIDTH,
  SEARCH_HUB_LOGO_SRC,
} from "@/lib/user/search-hub-branding";
import { cn } from "@/lib/utils";

type MenuBrandHeaderProps = {
  className?: string;
  logoLinkClassName?: string;
  logoClassName?: string;
  sloganClassName?: string;
  sloganAccentClassName?: string;
  onLogoClick?: () => void;
};

export function MenuBrandHeader({
  className,
  logoLinkClassName,
  logoClassName,
  sloganClassName,
  sloganAccentClassName,
  onLogoClick,
}: MenuBrandHeaderProps) {
  return (
    <header className={className}>
      <Link
        href="/"
        className={logoLinkClassName}
        aria-label="SaveRoute 홈"
        onClick={onLogoClick}
      >
        <Image
          src={SEARCH_HUB_LOGO_SRC}
          alt="SaveRoute"
          width={MENU_LOGO_DISPLAY_WIDTH}
          height={MENU_LOGO_DISPLAY_HEIGHT}
          priority
          className={cn(logoClassName)}
        />
      </Link>
      <p className={sloganClassName}>
        나의 <span className={sloganAccentClassName}>최적 할인 루트</span>
      </p>
    </header>
  );
}
