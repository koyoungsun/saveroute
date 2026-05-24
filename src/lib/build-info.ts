/** Client-safe build stamp for cache-busting and on-screen verification. */
export const APP_BUILD_ID =
  process.env.NEXT_PUBLIC_APP_BUILD_ID?.trim() || "dev";

export const SHOW_BUILD_STAMP =
  process.env.NEXT_PUBLIC_HIDE_BUILD_STAMP !== "1" &&
  process.env.NODE_ENV === "production";
