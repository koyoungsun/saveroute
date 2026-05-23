export type InstallGuideVariant = "ios" | "generic";

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari legacy
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function isIosSafari() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  const isIos = isIosDevice();
  const isOtherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

  return isIos && !isOtherBrowser;
}

export function isAndroidChrome() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent;
  return /Android/.test(ua) && /Chrome/.test(ua) && !/EdgA|OPR|SamsungBrowser/.test(ua);
}

export function getInstallGuideVariant(): InstallGuideVariant {
  if (isIosSafari()) {
    return "ios";
  }

  return "generic";
}
