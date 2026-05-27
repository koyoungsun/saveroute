import Image from "next/image";
import Link from "next/link";

import {
  ADMIN_SIDEBAR_LOGO_DISPLAY_HEIGHT,
  ADMIN_SIDEBAR_LOGO_DISPLAY_WIDTH,
  SEARCH_HUB_LOGO_SRC,
} from "@/lib/user/search-hub-branding";
import { cn } from "@/lib/utils";

type AdminSidebarBrandProps = {
  collapsed?: boolean;
};

export function AdminSidebarBrand({ collapsed = false }: AdminSidebarBrandProps) {
  return (
    <div
      className={cn(
        "sr-sidebar-brand",
        collapsed && "sr-sidebar-brand--collapsed",
      )}
    >
      <div className="sr-sidebar-brand-top">
        <Link
          href="/admin/dashboard"
          className="sr-sidebar-brand-link"
          aria-label="SaveRoute Admin Dashboard"
        >
          <Image
            src={SEARCH_HUB_LOGO_SRC}
            alt="SaveRoute"
            width={ADMIN_SIDEBAR_LOGO_DISPLAY_WIDTH}
            height={ADMIN_SIDEBAR_LOGO_DISPLAY_HEIGHT}
            priority
            className="sr-sidebar-brand-logo"
          />
        </Link>
      </div>

      {!collapsed ? (
        <p className="sr-sidebar-brand-caption">운영 관리자 콘솔</p>
      ) : null}

      <div className="sr-sidebar-brand-divider" aria-hidden="true" />
    </div>
  );
}
