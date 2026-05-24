"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { BUILD_DEBUG_INFO, SHOW_BUILD_DEBUG_DETAILS } from "@/lib/build-info";

export function BuildVersionStamp() {
  const [clientHost, setClientHost] = useState("");
  const [clientPath, setClientPath] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setClientHost(window.location.host);
    setClientPath(window.location.pathname);
  }, []);

  if (!SHOW_BUILD_DEBUG_DETAILS || !isMounted) {
    return null;
  }

  const deploymentShort = BUILD_DEBUG_INFO.deploymentId
    ? BUILD_DEBUG_INFO.deploymentId.replace(/^dpl_/, "").slice(0, 8)
    : "n/a";

  const expectedHost = BUILD_DEBUG_INFO.vercelUrl || "n/a";
  const hostMatchesDeployment =
    !BUILD_DEBUG_INFO.vercelUrl ||
    clientHost === BUILD_DEBUG_INFO.vercelUrl ||
    clientHost.endsWith(".vercel.app");

  const stamp = (
    <div
      className="sr-build-version-stamp"
      data-build-version={BUILD_DEBUG_INFO.buildId}
      data-commit-sha={BUILD_DEBUG_INFO.commitSha || BUILD_DEBUG_INFO.commitShaShort}
      data-deployment-id={BUILD_DEBUG_INFO.deploymentId}
      data-vercel-url={BUILD_DEBUG_INFO.vercelUrl}
      data-vercel-env={BUILD_DEBUG_INFO.vercelEnv}
      data-client-host={clientHost}
      data-host-matches-deployment={hostMatchesDeployment ? "1" : "0"}
      aria-hidden
    >
      <div className="sr-build-version-stamp__inner">
        <div>
          env={BUILD_DEBUG_INFO.vercelEnv || "unknown"} · sha={BUILD_DEBUG_INFO.commitShaShort} ·
          build={BUILD_DEBUG_INFO.buildId}
        </div>
        <div>
          dpl={deploymentShort} · deploy={expectedHost}
        </div>
        <div
          className={
            hostMatchesDeployment
              ? "sr-build-version-stamp__host-ok"
              : "sr-build-version-stamp__host-warn"
          }
        >
          host={clientHost || "…"} · path={clientPath || "/"}
        </div>
      </div>
    </div>
  );

  return createPortal(
    <div className="sr-user-app sr-build-version-stamp-portal-host">{stamp}</div>,
    document.body,
  );
}
