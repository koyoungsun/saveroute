"use client";

import { useEffect, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type UserPageProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** fixed bottom bar(CTA)용 하단 여백 */
  withBottomDock?: boolean;
  /** vertical padding preset */
  tone?: "default" | "compact" | "comfortable";
};

export function UserPage({
  children,
  as: Component = "div",
  className,
  withBottomDock = false,
  tone = "default",
}: UserPageProps) {
  useEffect(() => {
    if (!withBottomDock) {
      return;
    }

    document.documentElement.style.setProperty("--sr-user-zoom-fab-bottom", "5.75rem");

    return () => {
      document.documentElement.style.removeProperty("--sr-user-zoom-fab-bottom");
    };
  }, [withBottomDock]);

  return (
    <Component
      className={cn(
        "sr-user-page",
        tone === "compact" && "sr-user-page--compact",
        tone === "comfortable" && "sr-user-page--comfortable",
        withBottomDock && "sr-user-page--with-bottom-dock",
        className,
      )}
    >
      {children}
    </Component>
  );
}
