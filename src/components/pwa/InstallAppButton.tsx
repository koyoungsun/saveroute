"use client";

import { Smartphone } from "lucide-react";
import type { CSSProperties } from "react";
import { useState } from "react";

import menuStyles from "@/components/layout/UserHomeFloatingMenu.module.css";
import { InstallAppGuideModal } from "@/components/pwa/InstallAppGuideModal";
import type { InstallGuideVariant } from "@/lib/pwa/detect-platform";
import { usePwaInstall } from "@/lib/pwa/use-pwa-install";
import { cn } from "@/lib/utils";

type InstallAppButtonProps = {
  variant?: "utility" | "menu";
  className?: string;
  style?: CSSProperties;
  onAction?: () => void;
};

export function InstallAppButton({
  variant = "utility",
  className,
  style,
  onAction,
}: InstallAppButtonProps) {
  const {
    showInstallButton,
    canNativePrompt,
    promptNativeInstall,
    resolveGuideVariant,
    isInstalled,
    isStandalone,
  } = usePwaInstall();

  const [guideOpen, setGuideOpen] = useState(false);
  const [guideVariant, setGuideVariant] = useState<InstallGuideVariant>("generic");

  if (!showInstallButton) {
    if (isInstalled || isStandalone) {
      if (variant === "utility") {
        return (
          <p className="sr-user-install-app-status" role="status">
            앱으로 사용중
          </p>
        );
      }

      return null;
    }

    return null;
  }

  async function handleClick() {
    onAction?.();

    if (canNativePrompt) {
      await promptNativeInstall();
      return;
    }

    const nextVariant = resolveGuideVariant();
    if (!nextVariant) {
      return;
    }

    setGuideVariant(nextVariant);
    setGuideOpen(true);
  }

  const isMenu = variant === "menu";

  return (
    <>
      <button
        type="button"
        style={style}
        className={cn(
          isMenu
            ? cn(menuStyles.menuItem, menuStyles.menuItemAccount)
            : "sr-user-install-app-btn",
          className,
        )}
        aria-label="앱으로 추가하기"
        aria-expanded={guideOpen}
        onClick={() => void handleClick()}
      >
        <Smartphone
          aria-hidden="true"
          className={isMenu ? menuStyles.menuItemIcon : "sr-user-install-app-btn__icon"}
          strokeWidth={isMenu ? 1.75 : 2}
        />
        <span className={isMenu ? menuStyles.menuItemLabel : undefined}>
          앱으로 추가하기
        </span>
      </button>

      <InstallAppGuideModal
        open={guideOpen}
        variant={guideVariant}
        onClose={() => setGuideOpen(false)}
      />
    </>
  );
}
