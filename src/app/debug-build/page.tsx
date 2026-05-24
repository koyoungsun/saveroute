import type { Metadata } from "next";

import { BUILD_DEBUG_INFO, getBuildStampDiagnostics } from "@/lib/build-info";

import { DebugBuildClient } from "./DebugBuildClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "SaveRoute Build Debug",
  robots: { index: false, follow: false },
};

export default function DebugBuildPage() {
  const stampDiagnostics = getBuildStampDiagnostics();

  return (
    <DebugBuildClient
      buildId={BUILD_DEBUG_INFO.buildId}
      commitSha={BUILD_DEBUG_INFO.commitSha || "(unset)"}
      deploymentId={BUILD_DEBUG_INFO.deploymentId || "(unset)"}
      vercelUrl={BUILD_DEBUG_INFO.vercelUrl || "(unset)"}
      vercelEnv={BUILD_DEBUG_INFO.vercelEnv || "(unset)"}
      nodeEnv={stampDiagnostics.nodeEnv}
      hideBuildStampEnv={stampDiagnostics.hideBuildStampEnv}
      showBuildStamp={stampDiagnostics.showBuildStamp}
      stampHiddenReasons={stampDiagnostics.hiddenReasons}
      serverTimeIso={new Date().toISOString()}
    />
  );
}
