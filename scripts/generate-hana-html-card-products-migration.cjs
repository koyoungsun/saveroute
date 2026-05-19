#!/usr/bin/env node
/**
 * hana_cards_html_extract_133.manifest.json → 045_seed_hana_html_card_products.sql
 *
 *   node scripts/generate-hana-html-card-products-migration.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "scripts", "data", "hana_cards_html_extract_133.manifest.json");
const OUT = path.join(ROOT, "supabase", "migrations", "045_seed_hana_html_card_products.sql");

function sqlEsc(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function main() {
  const j = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const rows = [];

  for (const name of j.debit_cards || []) {
    rows.push({ name, product_type: "debit_card", card_type: "debit", benefit_type: "debit" });
  }
  for (const name of j.prepaid_cards || []) {
    rows.push({ name, product_type: "prepaid_card", card_type: "prepaid", benefit_type: "prepaid" });
  }
  for (const name of j.credit_cards || []) {
    rows.push({ name, product_type: "credit_card", card_type: "credit", benefit_type: "credit" });
  }

  const valueTuples = rows.map(
    (r) =>
      `  (${sqlEsc(r.name)}::TEXT, ${sqlEsc(r.product_type)}::TEXT, ${sqlEsc(r.card_type)}::TEXT, ${sqlEsc(r.benefit_type)}::TEXT)`,
  );

  const sql = `-- 하나카드 HTML(card-name) 추출 마스터 동기화 (benefit_products)
-- 소스: scripts/data/hana_cards_html_extract_133.manifest.json
-- 주의: 사용자 제출 집계와 매니페스트 행 수가 다를 수 있음 — manifest 검수 후 재생성.
--
-- 중복 키: (provider_id, name, COALESCE(benefit_type, '')) 유니크 인덱스 benefit_products_provider_name_benefittype_uidx
--   (046 마이그레이션 또는 기존 DB에 동일 이름 인덱스가 있음)
-- 표현식·COALESCE 포함 유니크는 ON CONFLICT (열 목록)로 지정이 어려우므로
--   「기존 행 UPDATE → 없으면 INSERT」패턴 사용.
--
-- benefit_type 매핑: credit / debit / prepaid (소문자, CHECK·앱 규약과 일치)
-- Prerequisites: providers.code=hana_card, benefit_categories.code=card, 044 적용 후 실행
-- 중복 방지/idempotent 근거 인덱스: (provider_id, name, COALESCE(benefit_type,''))
--   benefit_category_id 는 이 인덱스에 포함되지 않음 → 과거 카테고리 오설정 행과 충돌 시
--   category 조건까지 요구하면 UPDATE/NOT EXISTS 가 행을 못 보고 INSERT 가 유니크를 깸.
-- 따라서 매칭·존재 판별은 provider_id + name + COALESCE(benefit_type) 만 사용하고,
-- UPDATE 시 benefit_category_id 는 카드 카테고리로 정규화한다.

WITH hid AS (
  SELECT id AS provider_id FROM public.providers WHERE code = 'hana_card' LIMIT 1
),
cid AS (
  SELECT id AS benefit_category_id FROM public.benefit_categories WHERE code = 'card' LIMIT 1
),
incoming AS (
  SELECT *
  FROM (VALUES
${valueTuples.join(",\n")}
  ) AS t(name, product_type, card_type, benefit_type)
),
incoming_deduped AS (
  SELECT DISTINCT ON (name, COALESCE(benefit_type, ''))
    name,
    product_type,
    card_type,
    benefit_type
  FROM incoming
  ORDER BY name, COALESCE(benefit_type, ''), product_type
),
ins AS (
  SELECT
    d.*,
    'hana_html_' || substring(md5(concat_ws(chr(1), 'hana_card', d.name, d.product_type))::TEXT, 1, 26) AS new_code
  FROM incoming_deduped d
),
upd AS (
  UPDATE public.benefit_products bp
  SET
    benefit_category_id = c.benefit_category_id,
    product_type = ins.product_type,
    card_type = ins.card_type,
    benefit_type = ins.benefit_type,
    name = ins.name,
    is_active = TRUE,
    updated_at = NOW()
  FROM ins, hid h, cid c
  WHERE bp.provider_id = h.provider_id
    AND bp.name = ins.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(ins.benefit_type, '')
  RETURNING bp.id
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
  ins.name,
  ins.new_code,
  ins.product_type,
  NULL::TEXT,
  ins.card_type,
  ins.benefit_type,
  FALSE,
  FALSE,
  TRUE
FROM ins
CROSS JOIN hid h
CROSS JOIN cid c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.benefit_products bp
  WHERE bp.provider_id = h.provider_id
    AND bp.name = ins.name
    AND COALESCE(bp.benefit_type, '') = COALESCE(ins.benefit_type, '')
);
`;

  fs.writeFileSync(OUT, sql + "\n", "utf8");
  console.error(`Written ${OUT} (${rows.length} incoming rows)`);
}

main();
