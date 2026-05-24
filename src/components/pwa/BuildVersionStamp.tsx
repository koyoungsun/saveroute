"use client";

import { APP_BUILD_ID, SHOW_BUILD_STAMP } from "@/lib/build-info";

export function BuildVersionStamp() {
  if (!SHOW_BUILD_STAMP) {
    return null;
  }

  return (
    <div
      className="sr-build-version-stamp pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex justify-center pb-[max(0.25rem,env(safe-area-inset-bottom))]"
      data-build-version={APP_BUILD_ID}
      aria-hidden
    >
      <span className="rounded-t-md bg-black/55 px-2 py-0.5 font-mono text-[10px] leading-none tracking-tight text-white/70">
        build {APP_BUILD_ID}
      </span>
    </div>
  );
}
