"use client";

import { useEffect } from "react";

import { APP_BUILD_ID } from "@/lib/build-info";

export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const scriptUrl = `/sw.js?v=${encodeURIComponent(APP_BUILD_ID)}`;

    void navigator.serviceWorker
      .register(scriptUrl, { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch(() => {
          // Ignore transient update failures (offline, etc.).
        });

        const reloadOnActivate = () => {
          const waiting = registration.waiting;
          if (!waiting) {
            return;
          }

          waiting.addEventListener("statechange", () => {
            if (waiting.state === "activated") {
              window.location.reload();
            }
          });

          waiting.postMessage({ type: "SKIP_WAITING" });
        };

        if (registration.waiting) {
          reloadOnActivate();
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) {
            return;
          }

          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              reloadOnActivate();
            }
          });
        });
      })
      .catch(() => {
        // Install prompt may still work on some browsers; fail silently.
      });
  }, []);

  return null;
}
