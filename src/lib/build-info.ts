/** Client-safe build stamp for cache-busting and on-screen verification. */
export const APP_BUILD_ID =
  process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim() || "dev";

export const BUILD_DEBUG_INFO = {
  buildId: APP_BUILD_ID,
  commitSha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() || "",
  commitShaShort:
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim().slice(0, 7) ||
    APP_BUILD_ID,
  deploymentId: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID?.trim() || "",
  vercelUrl: process.env.NEXT_PUBLIC_VERCEL_URL?.trim() || "",
  vercelEnv: process.env.NEXT_PUBLIC_VERCEL_ENV?.trim() || "",
};

export const SHOW_BUILD_STAMP =
  process.env.NEXT_PUBLIC_HIDE_BUILD_STAMP !== "1" &&
  process.env.NODE_ENV === "production";

export const SHOW_BUILD_DEBUG_DETAILS = SHOW_BUILD_STAMP;

export function getBuildStampDiagnostics() {
  const nodeEnv = process.env.NODE_ENV ?? "unknown";
  const hideBuildStampEnv = process.env.NEXT_PUBLIC_HIDE_BUILD_STAMP ?? "(unset)";
  const hiddenReasons: string[] = [];

  if (nodeEnv !== "production") {
    hiddenReasons.push(
      `NODE_ENV=${nodeEnv} — dev 서버(예: 192.168.x.x)에서는 stamp가 표시되지 않습니다.`,
    );
  }

  if (process.env.NEXT_PUBLIC_HIDE_BUILD_STAMP === "1") {
    hiddenReasons.push("NEXT_PUBLIC_HIDE_BUILD_STAMP=1 로 stamp가 비활성화되어 있습니다.");
  }

  if (hiddenReasons.length === 0 && !SHOW_BUILD_STAMP) {
    hiddenReasons.push("알 수 없는 이유로 stamp가 비활성화되어 있습니다.");
  }

  return {
    nodeEnv,
    hideBuildStampEnv,
    showBuildStamp: SHOW_BUILD_STAMP,
    hiddenReasons,
  };
}
