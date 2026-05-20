"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { saveRecentSearch } from "@/components/search/recentSearchesStorage";
import { normalizeKeyword } from "@/lib/search/helpers";
import {
  markClientSearchLogDedup,
  shouldSkipClientSearchLogDedup,
} from "@/lib/search/search-log-client-dedup";
import {
  SEARCH_LOG_DEDUP_MS,
  SEARCH_LOG_EXPLICIT_HEADER,
  SEARCH_LOG_EXPLICIT_HEADER_VALUE,
} from "@/lib/search/search-log-constants";

function createRequestFingerprint() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const clientRecentByKeyword = new Map<string, number>();
let inFlightNormalizedKeyword: string | null = null;

async function postExplicitSearchLog(keyword: string): Promise<void> {
  await fetch("/api/search/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      [SEARCH_LOG_EXPLICIT_HEADER]: SEARCH_LOG_EXPLICIT_HEADER_VALUE,
    },
    credentials: "same-origin",
    body: JSON.stringify({
      keyword,
      requestFingerprint: createRequestFingerprint(),
    }),
  });
}

/** Explicit search action only. SSR /search reload must not call this. */
export async function submitExplicitSearch(
  router: AppRouterInstance,
  keyword: string,
): Promise<void> {
  const nextKeyword = keyword.trim();
  if (!nextKeyword) {
    return;
  }

  const normalized = normalizeKeyword(nextKeyword);
  const now = Date.now();
  const destination = `/search?keyword=${encodeURIComponent(nextKeyword)}`;

  if (
    inFlightNormalizedKeyword === normalized ||
    shouldSkipClientSearchLogDedup(normalized, now, clientRecentByKeyword, SEARCH_LOG_DEDUP_MS)
  ) {
    router.push(destination);
    return;
  }

  inFlightNormalizedKeyword = normalized;
  saveRecentSearch(nextKeyword);

  try {
    await postExplicitSearchLog(nextKeyword);
    markClientSearchLogDedup(clientRecentByKeyword, normalized, now);
  } catch {
    // Logging must not block navigation.
  } finally {
    inFlightNormalizedKeyword = null;
  }

  router.push(destination);
}
