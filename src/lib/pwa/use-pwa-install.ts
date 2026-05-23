"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getInstallGuideVariant,
  isStandaloneDisplayMode,
  type InstallGuideVariant,
} from "@/lib/pwa/detect-platform";

const PWA_INSTALLED_STORAGE_KEY = "sr-pwa-installed";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function readInstalledFlag() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markInstalled() {
  try {
    window.localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, "1");
  } catch {
    // ignore storage failures
  }

  window.dispatchEvent(new CustomEvent("sr-pwa-installed"));
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const standalone = isStandaloneDisplayMode();
    setIsStandalone(standalone);
    setIsInstalled(standalone || readInstalledFlag());
    setIsReady(true);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      markInstalled();
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    const onInstalledSync = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener("sr-pwa-installed", onInstalledSync);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener("sr-pwa-installed", onInstalledSync);
    };
  }, []);

  const showInstallButton = isReady && !isInstalled && !isStandalone;
  const canNativePrompt = Boolean(deferredPrompt);

  const promptNativeInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
      markInstalled();
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    return choice.outcome === "accepted";
  }, [deferredPrompt]);

  const resolveGuideVariant = useCallback((): InstallGuideVariant | null => {
    if (canNativePrompt) {
      return null;
    }

    return getInstallGuideVariant();
  }, [canNativePrompt]);

  return {
    isReady,
    showInstallButton,
    canNativePrompt,
    isInstalled,
    isStandalone,
    promptNativeInstall,
    resolveGuideVariant,
  };
}
