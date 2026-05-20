import assert from "node:assert/strict";
import test from "node:test";

import {
  formatSearchLogActorKey,
  isWithinSearchLogDedupWindow,
  resolveSearchLogActorKey,
} from "./record-search-log.ts";
import {
  markClientSearchLogDedup,
  shouldSkipClientSearchLogDedup,
} from "./search-log-client-dedup.ts";
import { SEARCH_LOG_DEDUP_MS } from "./search-log-constants.ts";

test("dedup window blocks same keyword within 30 seconds", () => {
  const now = new Date("2026-05-21T10:00:30.000Z");
  const recent = "2026-05-21T10:00:10.000Z";

  assert.equal(isWithinSearchLogDedupWindow(recent, now, SEARCH_LOG_DEDUP_MS), true);
  assert.equal(
    isWithinSearchLogDedupWindow("2026-05-21T09:59:29.000Z", now, SEARCH_LOG_DEDUP_MS),
    false,
  );
});

test("actor_key prefers logged-in user over session", () => {
  assert.equal(
    formatSearchLogActorKey({ userId: "user-1", sessionId: "session-1" }),
    "user:user-1",
  );
  assert.equal(
    formatSearchLogActorKey({ userId: null, sessionId: "session-1" }),
    "session:session-1",
  );
  assert.equal(formatSearchLogActorKey({ userId: null, sessionId: null }), null);
});

test("resolveSearchLogActorKey matches actor_key policy", () => {
  assert.deepEqual(
    resolveSearchLogActorKey({
      userId: "user-1",
      sessionId: "session-1",
    }),
    { kind: "user", userId: "user-1" },
  );
  assert.deepEqual(
    resolveSearchLogActorKey({
      userId: null,
      sessionId: "session-1",
    }),
    { kind: "session", sessionId: "session-1" },
  );
});

test("client dedup skips same keyword within 30 seconds", () => {
  const recent = new Map<string, number>();
  markClientSearchLogDedup(recent, "아웃백", 1_000_000);
  assert.equal(shouldSkipClientSearchLogDedup("아웃백", 1_000_000 + 10_000, recent), true);
  assert.equal(shouldSkipClientSearchLogDedup("아웃백", 1_000_000 + 31_000, recent), false);
  assert.equal(shouldSkipClientSearchLogDedup("스타벅스", 1_000_000 + 10_000, recent), false);
});

test("policy: only explicit search action should call /api/search/log (documented scenarios)", () => {
  const scenarios = {
    searchButtonClick: "log",
    enterSearch: "log",
    autocompleteSelect: "log",
    recentSearchChipClick: "log",
    popularBrandChipClick: "log",
    searchPageSsr: "no-log",
    f5Refresh: "no-log",
    directUrlAccess: "no-log",
    dashboardPolling: "no-log",
    recentSearchListRender: "no-log",
    adminNavigation: "no-log",
    performSearchInternal: "no-log",
  } as const;

  assert.equal(scenarios.searchButtonClick, "log");
  assert.equal(scenarios.f5Refresh, "no-log");
  assert.equal(scenarios.dashboardPolling, "no-log");
  assert.equal(scenarios.performSearchInternal, "no-log");
});

test("different keyword after dedup window should allow new log", () => {
  const now = new Date("2026-05-21T10:01:00.000Z");
  const olderSameKeyword = "2026-05-21T10:00:00.000Z";
  assert.equal(isWithinSearchLogDedupWindow(olderSameKeyword, now, SEARCH_LOG_DEDUP_MS), false);
});
