#!/usr/bin/env node
/**
 * IBK기업은행카드 신용 목록(JSON) → supabase 마이그레이션 benefit_products INSERT (멱등)
 *
 * providers.code = ibk_corporate_bank 는 028 카드 majors에 미포함 → 본 파일에서 ON CONFLICT 보장 INSERT.
 *
 *   node scripts/generate-ibk-credit-products-migration.cjs
 *
 * 입력: scripts/data/ibk_credit_cards.input.json
 * 출력: supabase/migrations/056_seed_ibk_credit_card_products.sql
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const INPUT = path.join(ROOT, "scripts", "data", "ibk_credit_cards.input.json");
const OUT = path.join(ROOT, "supabase", "migrations", "056_seed_ibk_credit_card_products.sql");

const PROVIDER_CODE = "ibk_corporate_bank";

function hash12(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
}

function asciiSlugFragment(name) {
  const n = String(name).normalize("NFKC");
  let raw = "";
  for (const ch of n) {
    if (/[a-zA-Z0-9]/.test(ch)) raw += ch.toLowerCase();
    else if (/[\s·\-+/&,:.]/.test(ch) || ch === "#" || ch === "℃") raw += "_";
    else raw += "_";
  }
  return raw.replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function deriveCode(name, usedCodes) {
  const salt = `${PROVIDER_CODE}|credit|${name}`;
  const frag = asciiSlugFragment(name);
  let tail = frag.length >= 4 ? frag : `x${hash12(salt)}`;
  let code = `ibk_cred_${tail}`.slice(0, 100);
  if (usedCodes.has(code)) code = `ibk_cred_${hash12(`${name}|credit`)}`;
  let dup = 2;
  while (usedCodes.has(code)) {
    code = `ibk_cred_${hash12(`${name}:${dup}`)}`;
    dup += 1;
  }
  usedCodes.add(code);
  return code;
}

function sqlEsc(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function main() {
  const j = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  const namesRaw = Array.isArray(j.names) ? j.names : [];

  const seen = new Set();
  const names = [];
  for (const n of namesRaw) {
    const t = String(n).trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    names.push(t);
  }

  const usedCodes = new Set();

  const rowTuples = names.map((name) => {
    const code = deriveCode(name, usedCodes);
    return `  (${sqlEsc(name)}::TEXT, ${sqlEsc(code)}::TEXT, ${sqlEsc("credit_card")}::TEXT, ${sqlEsc("credit")}::TEXT, ${sqlEsc("credit")}::TEXT)`;
  });

  const sql = `-- IBK기업은행카드 신용 benefit_products 멱등 시드
-- 소스: scripts/data/ibk_credit_cards.input.json · 재생성: npm run seed:ibk-credit-products
-- provider 표시명: IBK기업은행카드 · code=${PROVIDER_CODE}
-- benefit_type·card_type: credit · product_type: credit_card
--
-- 논리 중복 방지 인덱스: benefit_products_provider_name_benefittype_uidx
-- code 는 slug+해시 패턴 ibk_cred_* (benefit_products.code UNIQUE)

INSERT INTO public.providers (benefit_category_id, name, code, provider_type)
SELECT
  c.id,
  ${sqlEsc("IBK기업은행카드")},
  ${sqlEsc(PROVIDER_CODE)},
  'card_company'
FROM public.benefit_categories AS c
WHERE c.code = 'card'
LIMIT 1
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_type = EXCLUDED.provider_type,
  is_active = TRUE,
  updated_at = NOW();

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = '${PROVIDER_CODE}' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
${rowTuples.join(",\n")}
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

  fs.writeFileSync(OUT, sql + "\n", "utf8");
  console.error(`Written ${OUT} (${names.length} 신용 카드명)`);
}

main();
