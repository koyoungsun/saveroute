/**
 * 브랜드 매칭 티어 회귀 테스트.
 * 실행: npx tsx src/lib/search/match-brand.pool.test.ts
 */
import assert from "node:assert/strict";

import type { BrandCandidateRow } from "./helpers";
import { resolveBrandMatchFromPool } from "./match-brand";

const base = {
  official_url: null as string | null,
  is_active: true,
  category_id: null as number | null,
};

const pool: BrandCandidateRow[] = [
  {
    id: 1,
    name: "스타벅스",
    slug: "qa-starbucks",
    aliases: ["starbucks", "스타벅스코리아", "STARBUCKS"],
    ...base,
  },
  {
    id: 2,
    name: "CGV",
    slug: "qa-cgv",
    aliases: ["씨지브이", "cgv"],
    ...base,
  },
  {
    id: 3,
    name: "메가커피",
    slug: "qa-megacoffee",
    aliases: ["메가 커피", "megacoffee"],
    ...base,
  },
  {
    id: 4,
    name: "파리바게뜨",
    slug: "qa-parisbaguette",
    aliases: ["파리바게트", "paris baguette", "파바"],
    ...base,
  },
  {
    id: 5,
    name: "배스킨라빈스",
    slug: "qa-baskinrobbins",
    aliases: ["베라", "baskin", "BR"],
    ...base,
  },
];

function expectSingle(keyword: string, expectedName: string, forbiddenNames: string[] = []) {
  const r = resolveBrandMatchFromPool(pool, keyword);
  assert.ok(r, `expected match for "${keyword}"`);
  assert.equal(r!.brand.name, expectedName);
  for (const bad of forbiddenNames) {
    assert.notEqual(r!.brand.name, bad);
  }
}

expectSingle("cgv", "CGV", ["메가커피"]);
expectSingle("CGV", "CGV");
expectSingle("씨지브이", "CGV");

expectSingle("스타벅스", "스타벅스");
expectSingle("starbucks", "스타벅스");

expectSingle("메가", "메가커피", ["CGV", "파리바게뜨"]);

expectSingle("파바", "파리바게뜨");

console.log("match-brand pool tests: OK");
