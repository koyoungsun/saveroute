import assert from "node:assert/strict";

import {
  getOpsPanelWindowLabel,
  OPS_PANEL_WINDOW_PRESETS,
  resolveOpsPanelWindowSince,
} from "@/lib/admin/ops-panel-config";

assert.equal(getOpsPanelWindowLabel("hours_3"), "최근 3시간");
assert.equal(getOpsPanelWindowLabel("minutes_10"), "최근 10분");
assert.equal(getOpsPanelWindowLabel("today"), "오늘");

const threeHoursAgo = resolveOpsPanelWindowSince("hours_3");
assert.ok(new Date(threeHoursAgo).getTime() <= Date.now());
assert.ok(new Date(threeHoursAgo).getTime() >= Date.now() - OPS_PANEL_WINDOW_PRESETS.hours_3 * 60 * 1000 - 1000);

const todayStart = resolveOpsPanelWindowSince("today");
const todayDate = new Date(todayStart);
assert.equal(todayDate.getHours(), 0);
assert.equal(todayDate.getMinutes(), 0);

console.log("admin-ops-panel-config QA: PASS");
