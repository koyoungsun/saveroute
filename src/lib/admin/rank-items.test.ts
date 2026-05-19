/**
 * Admin ranking — tied-score competition ranks (unit-level).
 */
import assert from "node:assert/strict";

import { formatRank, getRankedItems } from "./rank-items";

type ScoreRow = {
  name: string;
  count: number;
};

const mockItems: ScoreRow[] = [
  { name: "스타벅스", count: 100 },
  { name: "CGV", count: 100 },
  { name: "메가커피", count: 80 },
  { name: "배민", count: 70 },
  { name: "쿠팡", count: 70 },
  { name: "올리브영", count: 60 },
];

const ranked = getRankedItems(mockItems, "count");

assert.deepEqual(
  ranked.map((row) => [row.name, row.rank, row.count]),
  [
    ["스타벅스", 1, 100],
    ["CGV", 1, 100],
    ["메가커피", 3, 80],
    ["배민", 4, 70],
    ["쿠팡", 4, 70],
    ["올리브영", 6, 60],
  ],
);

assert.equal(formatRank(1), "1위");
assert.equal(formatRank(4), "4위");

const unsorted: ScoreRow[] = [
  { name: "쿠팡", count: 70 },
  { name: "스타벅스", count: 100 },
  { name: "배민", count: 70 },
];

assert.deepEqual(
  getRankedItems(unsorted, "count").map((row) => [row.name, row.rank]),
  [
    ["스타벅스", 1],
    ["쿠팡", 2],
    ["배민", 2],
  ],
);

console.log("rank-items.test.ts — all assertions passed");
