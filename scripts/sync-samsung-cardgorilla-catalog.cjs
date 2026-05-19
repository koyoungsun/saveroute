#!/usr/bin/env node
/**
 * 카드고릴라 마스터(samsung_cardgorilla_source.input.json)와 리포 내 시드(051 등) 매칭:
 * INSERT 전용 SQL + alias / deprecated 마크다운.
 *
 *   node scripts/sync-samsung-cardgorilla-catalog.cjs
 *
 * 산출: saveroute/samsung_cards_upsert.sql (프로젝트 루트), samsung_cards_* .md
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "scripts", "data", "samsung_cardgorilla_source.input.json");
const MIGRATION_051 = path.join(
  ROOT,
  "supabase",
  "migrations",
  "051_seed_samsung_credit_card_products.sql",
);
const OUT_SQL = path.join(ROOT, "samsung_cards_upsert.sql");
const OUT_MIGRATION = path.join(
  ROOT,
  "supabase",
  "migrations",
  "059_seed_samsung_cardgorilla_products.sql",
);
const OUT_ALIAS = path.join(ROOT, "samsung_cards_alias_review.md");
const OUT_DEPRECATED = path.join(ROOT, "samsung_cards_deprecated_candidates.md");
function hash12(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
}

function asciiSlugFragment(name) {
  const n = String(name).normalize("NFKC");
  let raw = "";
  for (const ch of n) {
    if (/[a-zA-Z0-9]/.test(ch)) raw += ch.toLowerCase();
    else if (/[\s·\-+/&,:+]/.test(ch) || ch === "#" || ch === "℃" || ch === ".") raw += "_";
    else raw += "_";
  }
  return raw.replace(/_+/g, "_").replace(/^_|_$/g, "");
}

/** @param {Set<string>} usedCodes */
function allocateCode(name, bt, prefixSlug, usedCodes) {
  const frag = asciiSlugFragment(name);
  let tail = frag.length >= 4 ? frag : `x${hash12(`${name}|${bt}`)}`;
  let code = `${prefixSlug}_${tail}`.slice(0, 100);
  if (usedCodes.has(code)) code = `${prefixSlug}_${hash12(`${name}|${bt}`)}`;
  let dup = 2;
  while (usedCodes.has(code)) {
    code = `${prefixSlug}_${hash12(`${name}:${dup}:${bt}`)}`;
    dup += 1;
  }
  usedCodes.add(code);
  return code;
}

/** 표기 차이 무시용 비교키 (alias 후보만; 기존 행 rename 하지 않음) */
function canonKey(name) {
  let t = String(name)
    .normalize("NFKC")
    .replace(/[\u2122®™]/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  while (true) {
    const next = t
      .replace(/^삼성카드\s+/u, "")
      .replace(/^삼성\s+/u, "")
      .trim();
    if (next === t) break;
    t = next;
  }

  t = t.replace(/\s*\(\s*/g, "(").replace(/\s*\)/g, ")");
  t = t.replace(/\s+카드$/u, "").replace(/카드$/u, "").trim();
  return t;
}

function sqlEsc(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function parse051Rows() {
  const txt = fs.readFileSync(MIGRATION_051, "utf8");
  const rows = [];
  const re =
    /\('((?:[^']|'')+)'\s*::\s*TEXT,\s*'([^']+)'\s*::\s*TEXT,\s*'([^']+)'\s*::\s*TEXT,\s*'([^']+)'\s*::\s*TEXT,\s*'([^']+)'\s*::\s*TEXT\)/g;
  let m;
  while ((m = re.exec(txt)) !== null) {
    const name = m[1].replace(/''/g, "'");
    rows.push({
      name,
      code: m[2],
      product_type: m[3],
      card_type: m[4],
      benefit_type: m[5],
    });
  }
  return rows;
}

/** @typedef {{ name: string; code: string; product_type: string; card_type: string; benefit_type: string; source_note?: string }} SeedRow */

function findAliasMatches(/** @type SeedRow[] */ existing, name, bt) {
  const k = canonKey(name);
  return existing.filter((r) => r.benefit_type === bt && canonKey(r.name) === k);
}

/** 신규 기준 줄이 기존 행 이름을 덮었는지(정확·alias 포함) */
function catalogCoversLegacyName(
  canonCredits,
  canonDebits,
  /** @type SeedRow */
  legacy,
) {
  const list = legacy.benefit_type === "debit" ? canonDebits : canonCredits;
  const kLegacy = canonKey(legacy.name);
  return list.some(
    (c) => canonKey(c) === kLegacy || c === legacy.name,
  );
}


function main() {
  const raw = JSON.parse(fs.readFileSync(SOURCE, "utf8"));

  const canonCredits = [...new Set(raw.credit.map((s) => String(s).trim()).filter(Boolean))];
  const canonDebits = [...new Set(raw.debit.map((s) => String(s).trim()).filter(Boolean))];

  /** @type {SeedRow[]} */
  const rows051 = parse051Rows();
  const legacy017Samsung = /** @type {SeedRow[]} */ ([
    {
      name: "삼성 iD ON",
      code: "samsung_id_on",
      product_type: "credit_card",
      card_type: "credit",
      benefit_type: "credit",
      source_note: "017_seed_data 레거시",
    },
  ]);

  /** 리포 근거: 051 신용 시드 행 (+ 017 삼성 iD ON 레거시) */
  const existing = [...rows051, ...legacy017Samsung];

  let exactMatchCount = 0;
  /** @type {{ newName:string; bt:string; existing:string; existingCode:string }[]} */
  const aliasRows = [];
  /** @type {{ name:string; bt:string; code:string; product_type:string; card_type:string }[]} */
  const toInsert = [];
  const dedupInsert = new Set();
  const usedCodes = new Set(existing.map((r) => r.code));

  /** @param {string[]} canon @param {'credit'|'debit'} bt */
  function processCanon(canon, bt) {
    const prefixSlug = bt === "debit" ? "samsung_cg_deb" : "samsung_cg_cred";
    const productType = bt === "debit" ? "debit_card" : "credit_card";

    for (const name of canon) {
      if (existing.some((r) => r.name === name && r.benefit_type === bt)) {
        exactMatchCount++;
        continue;
      }

      const aliasHits = findAliasMatches(existing, name, bt);
      if (aliasHits.length > 0) {
        for (const a of aliasHits) {
          aliasRows.push({
            newName: name,
            bt,
            existing: a.name,
            existingCode: a.code,
          });
        }
        continue;
      }

      const u = `${bt}|${name}`;
      if (dedupInsert.has(u)) continue;
      dedupInsert.add(u);

      const code = allocateCode(name, bt, prefixSlug, usedCodes);
      toInsert.push({
        name,
        bt,
        code,
        product_type: productType,
        card_type: bt,
      });
    }
  }

  processCanon(canonCredits, "credit");
  processCanon(canonDebits, "debit");

  const deprecated = existing.filter(
    (e) => !catalogCoversLegacyName(canonCredits, canonDebits, e),
  );

  const insertCreditCount = toInsert.filter((x) => x.bt === "credit").length;
  const insertDebitCount = toInsert.filter((x) => x.bt === "debit").length;

  let insertSqlTuples = "";
  if (toInsert.length > 0) {
    insertSqlTuples =
      "\n" +
      toInsert
        .map(
          (row) =>
            `  (${sqlEsc(row.name)}::TEXT, ${sqlEsc(row.code)}::TEXT, ${sqlEsc(row.product_type)}::TEXT, ${sqlEsc(row.card_type)}::TEXT, ${sqlEsc(row.bt)}::TEXT)`,
        )
        .join(",\n") +
      "\n";
  }

  const statsHeader = `-- 카드고릴라 기준 삼성카드 benefit_products 신규 INSERT 멱등 (생성물)
-- 생성: npm run sync:samsung-cardgorilla — ${new Date().toISOString().slice(0, 10)}
--
-- 리포 내 비교 근거: supabase/migrations/051_seed_samsung_credit_card_products.sql + 017_seed_data 레거시(삼성 iD ON).
-- 운영 DB와 다를 수 있음 — DB 단일 진실 원천이면 스크립트 baseline 파서를 교체해야 함.
--
-- 참고: display_order · slug 칼럼 없음. is_active = TRUE. 이름 정규화 UPDATE 는 수행하지 않음.
-- 논리 중복 방지 키: (provider_id, name, COALESCE(benefit_type,''))
--
-- 통계 요약
-- 카드고릴라 크레딧 행 수: ${canonCredits.length}
-- 카드고릴라 체크(debit) 행 수: ${canonDebits.length}
-- exact 문자열 일치(카드고릴라 이름 == 리포 시드): ${exactMatchCount}
-- 신규 insert 대상 행 수: ${toInsert.length} (credit ${insertCreditCount}, debit ${insertDebitCount})
-- alias 표기 차이 매칭(신규 insert 생략) pair 수: ${aliasRows.length}
-- deprecated 검토 후보 리포 내 시드 미포함: ${deprecated.length}
--
`;

  let sqlFull;
  if (toInsert.length === 0) {
    sqlFull = `${statsHeader}
-- 신규 insert 대상이 없습니다.\n`;
  } else {
    sqlFull = `${statsHeader}
WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'samsung_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
${insertSqlTuples.trim()}
  ) AS t(name, code, product_type, card_type, benefit_type)
)
INSERT INTO public.benefit_products (
  benefit_category_id,
  provider_id,
  name,
  code,
  product_type,
  grade,
  card_type,
  benefit_type,
  is_mvno,
  mvno_notice_required,
  is_active
)
SELECT
  c.benefit_category_id,
  h.provider_id,
  i.name,
  i.code,
  i.product_type,
  NULL::TEXT,
  i.card_type,
  i.benefit_type,
  FALSE,
  FALSE,
  TRUE
FROM incoming i
CROSS JOIN hid h
CROSS JOIN cid c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.benefit_products bp
  WHERE bp.provider_id = h.provider_id
    AND bp.name = i.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(i.benefit_type, '')
);
`;
  }

  fs.writeFileSync(OUT_SQL, sqlFull + "\n", "utf8");
  fs.writeFileSync(OUT_MIGRATION, sqlFull + "\n", "utf8");

  fs.writeFileSync(
    OUT_ALIAS,
    `# 삼성카드 카드고릴라 vs 리포 시드 — alias 검토 목록\n\n` +
      `**근거 데이터:** 마이그레이션 \`051\` 신용 시드 행(+ \`017\` 레거시 \`삼성 iD ON\`). 실 DB와 차이 가능.\n\n` +
      `생성 유틸에서 **canon 키(표기 무시 근사)** 로 동일 간주한 매칭입니다. DB에 새 행을 추가하지 않고, 이름 정규화·별칭 매핑 UI 등을 검토할 때 활용합니다.\n\n` +
      `| benefit_type | 카드고릴라 이름 | 리포 내 기존 name | 코드 |\n|---|---|---|---|\n` +
      `${aliasRows
        .sort((a, b) => `${a.bt} ${a.newName}`.localeCompare(`${b.bt} ${b.newName}`, "ko"))
        .map((r) => `| ${r.bt} | ${r.newName} | ${r.existing} | \`${r.existingCode}\` |`)
        .join("\n")}` +
      (aliasRows.length === 0 ? "\n*(해당 없음)*\n" : "\n") +
      `\n생성 통계 전체는 \`samsung_cards_upsert.sql\` 헤더 주석 참고.\n`,
    "utf8",
  );

  fs.writeFileSync(
    OUT_DEPRECATED,
    `# 삼성카드 — 카드고릴라 신규 기준에 없는 리포 시드 행 (삭제 안 함)\n\n` +
      `**근거:** \`051\` + \`017\`(삼성 iD ON) 파싱. 운영 DB 전체가 아님.\n\n` +
      `리포 시드 이름이 카드고릴라 기준 문자열 또는 **canon 근사 키** 어느 것과도 맞지 않을 때 목록입니다. 단종 여부 등 운영 확인용이며 삭제 SQL 은 포함하지 않습니다.\n\n` +
      `| benefit_type | name | code |\n|---|---|---|\n` +
      `${deprecated
        .sort((a, b) => a.name.localeCompare(b.name, "ko"))
        .map((r) => `| ${r.benefit_type} | ${r.name} | \`${r.code}\` |`)
        .join("\n")}` +
      (deprecated.length === 0 ? "\n*(해당 없음)*\n" : "\n") +
      `\n051 시드 대비 새 기준 카드 종류가 줄어든 경우 같은 형태가 생깁니다.\n`,
    "utf8",
  );

  console.log(
    JSON.stringify(
      {
        newInsertTotal: toInsert.length,
        newInsertCredit: insertCreditCount,
        newInsertDebit: insertDebitCount,
        exactMatchCount,
        aliasReviewPairs: aliasRows.length,
        deprecatedCandidates: deprecated.length,
        outputSql: path.relative(ROOT, OUT_SQL),
        outputMigration: path.relative(ROOT, OUT_MIGRATION),
        outputAliasMd: path.relative(ROOT, OUT_ALIAS),
        outputDeprecatedMd: path.relative(ROOT, OUT_DEPRECATED),
      },
      null,
      2,
    ),
  );
}

main();

