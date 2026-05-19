#!/usr/bin/env node
/**
 * 하나카드 추출 JSON → benefit_products UPSERT SQL (042 패턴)
 *
 * 사용법:
 *   node scripts/generate-hana-card-products-sql.cjs [--out supabase/migrations/042_seed_hana_card_products.sql] [입력.json]
 *
 * 입력 JSON 변형(자동 감지):
 *   - 전체 스키마 { providerCode, benefitCategoryCode, items:[{name, kind?}] }
 *   - 이름만 배열 ["카드 A", ...]
 *   - { names: [...] }
 *   - 브라우저 번들 { names } from __hanaLastCardExtract.names
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function usage() {
  console.error(`
Usage:
  node scripts/generate-hana-card-products-sql.cjs [--out path] [<input.json>]

미지정 시 입력: scripts/data/hana_card_products.input.json 없으면 .example.json

Options:
  --out FILE   결과를 파일로 저장 (미지정 시 stdout)
`);
  process.exit(1);
}

function hash12(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
}

/** 한글 포함 등으로 ASCII 슬러그가 짧으면 해시 코드 사용 */
function asciiSlugFragment(name) {
  const n = String(name).normalize("NFKC");
  let raw = "";
  for (const ch of n) {
    if (/[a-zA-Z0-9]/.test(ch)) raw += ch.toLowerCase();
    else if (/[\s·\-+/]/.test(ch) || ch === "#") raw += "_";
    else raw += "_";
  }
  return raw.replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function deriveCode(name, usedCodes) {
  const frag = asciiSlugFragment(name);
  let tail = frag.length >= 4 ? frag : `x${hash12(name)}`;
  let code = `hana_${tail}`.slice(0, 80);
  if (usedCodes.has(code)) code = `hana_${hash12(name)}`;
  let dup = 2;
  while (usedCodes.has(code)) {
    code = `hana_${hash12(`${name}:${dup}`)}`;
    dup += 1;
  }
  usedCodes.add(code);
  return code;
}

function normalizeDoc(raw) {
  if (Array.isArray(raw)) {
    return {
      providerCode: "hana_card",
      benefitCategoryCode: "card",
      defaultProductTypeWhenKindUnknown: "credit_card",
      items: raw.map((n) => ({ name: String(n), kind: "unknown" })),
    };
  }
  if (raw && Array.isArray(raw.names)) {
    return {
      providerCode: raw.providerCode || "hana_card",
      benefitCategoryCode: raw.benefitCategoryCode || "card",
      defaultProductTypeWhenKindUnknown: raw.defaultProductTypeWhenKindUnknown || "credit_card",
      items: raw.names.map((n) => ({ name: String(n), kind: "unknown" })),
    };
  }
  if (raw && Array.isArray(raw.items)) {
    return {
      providerCode: raw.providerCode || "hana_card",
      benefitCategoryCode: raw.benefitCategoryCode || "card",
      defaultProductTypeWhenKindUnknown: raw.defaultProductTypeWhenKindUnknown || "credit_card",
      items: raw.items,
    };
  }
  throw new Error("지원 형식: JSON 배열 이름 목록 또는 { items:[{name,kind}] } 또는 { names:[] }");
}

/** kind 우선순위 높음 = 더 구체적 (unknown < prepaid < debit < credit) */
const KIND_RANK = { unknown: 0, prepaid: 1, debit: 2, credit: 3 };

function mergeKinds(a, b) {
  const ka = KIND_RANK[a] !== undefined ? a : "unknown";
  const kb = KIND_RANK[b] !== undefined ? b : "unknown";
  return KIND_RANK[kb] > KIND_RANK[ka] ? kb : ka;
}

/** 같은 provider 안에서 카드 표시명 단일 레코드를 기대하면서 (provider,name,benefit_type) 유니크와 충돌 방지 */
function dedupeItemsByName(items) {
  const map = new Map();
  for (const row of items) {
    const name = String(row.name || "").trim();
    if (!name) continue;
    const kind = row.kind || "unknown";
    const prev = map.get(name);
    if (!prev) map.set(name, { name, kind });
    else map.set(name, { name, kind: mergeKinds(prev.kind, kind) });
  }
  return [...map.values()];
}

function resolveProductAndCardType(kind, defaultWhenUnknown) {
  switch (kind) {
    case "credit":
      return { product_type: "credit_card", card_type: "credit", benefit_type: "credit" };
    case "debit":
      return { product_type: "debit_card", card_type: "debit", benefit_type: "debit" };
    case "prepaid":
      return { product_type: "prepaid_card", card_type: "prepaid", benefit_type: "prepaid" };
    case "unknown":
    default:
      const pt = defaultWhenUnknown === "debit_card" ? "debit_card" : "credit_card";
      return { product_type: pt, card_type: "unknown", benefit_type: "unknown" };
  }
}

function sqlEscapeLiteral(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function buildSql(doc) {
  const nd = normalizeDoc(doc);
  const providerCode = nd.providerCode || "hana_card";
  const catCode = nd.benefitCategoryCode || "card";
  const defUnknown = nd.defaultProductTypeWhenKindUnknown || "credit_card";
  const items = dedupeItemsByName(nd.items);

  const tuples = [];
  const usedCodes = new Set();

  for (const row of items) {
    const name = String(row.name || "").trim();
    if (!name) continue;
    const kind = row.kind || "unknown";
    const code = deriveCode(name, usedCodes);
    const { product_type, card_type, benefit_type } = resolveProductAndCardType(kind, defUnknown);
    tuples.push({ name, code, product_type, card_type, benefit_type });
  }

  const header = `-- 하나카드 카드명 1차 마스터 시드입니다.
-- 할인 상세 데이터가 아닙니다.
-- 카드 구분을 알 수 없는 경우 product_type은 스키마 제약 때문에 credit_card로 임시 저장합니다.
-- 실제 구분 값은 card_type = 'unknown', benefit_type = 'unknown' 으로 표시합니다.
-- 추후 신용/체크 구분 정리 시 product_type/card_type/benefit_type을 함께 보정해야 합니다.
--
-- [하나카드 시드 검증용 쿼리]
-- select
--   name,
--   code,
--   product_type,
--   card_type,
--   benefit_type,
--   is_active
-- from benefit_products
-- where provider_id = (
--   select id from providers where code = 'hana_card'
-- )
-- order by name;
--
-- 기술 메모 · 재생성: npm run seed:hana-products (scripts/generate-hana-card-products-sql.cjs)
-- provider ${sqlEscapeLiteral(providerCode)}, category ${sqlEscapeLiteral(catCode)}, kind 미지정 시 기본 product_type 후보는 입력 defaultProductTypeWhenKindUnknown(보통 credit_card).
-- code 규칙: ASCII 슬러그면 hana_<슬러그>, 아니면 hana_x<해시>; 동명 추출 줄은 구체적인 kind 우선으로 병합(UNIQUE 인덱스 정합).\n`;

  const lines = tuples.map((t) => {
    const n = sqlEscapeLiteral(t.name);
    const c = sqlEscapeLiteral(t.code);
    const pt = sqlEscapeLiteral(t.product_type);
    const ct = sqlEscapeLiteral(t.card_type);
    const bt = sqlEscapeLiteral(t.benefit_type);
    return `  (${n}::TEXT, ${c}::TEXT, ${pt}::TEXT, ${ct}::TEXT, ${bt}::TEXT)`;
  });

  const body =
    `${header}
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
  (SELECT id FROM public.benefit_categories WHERE code = ${sqlEscapeLiteral(catCode)} LIMIT 1),
  (SELECT id FROM public.providers WHERE code = ${sqlEscapeLiteral(providerCode)} LIMIT 1),
  v.name,
  v.code,
  v.product_type,
  NULL::TEXT,
  v.card_type,
  v.benefit_type,
  FALSE,
  FALSE,
  TRUE
FROM (VALUES
${lines.join(",\n")}
) AS v(name, code, product_type, card_type, benefit_type)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  grade = EXCLUDED.grade,
  card_type = EXCLUDED.card_type,
  benefit_type = EXCLUDED.benefit_type,
  is_mvno = EXCLUDED.is_mvno,
  mvno_notice_required = EXCLUDED.mvno_notice_required,
  is_active = TRUE,
  updated_at = NOW();
`;

  return body;
}

function parseArgs(argv) {
  let outPath;
  const rest = [];
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out") {
      outPath = argv[i + 1];
      i += 1;
    } else {
      rest.push(argv[i]);
    }
  }
  return { outPath, inputPath: rest[0] || null };
}

(function main() {
  const { outPath, inputPath: inputPathArg } = parseArgs(process.argv);

  const scriptDir = __dirname;
  const defaultInput = path.join(scriptDir, "data", "hana_card_products.input.json");
  const exampleInput = path.join(scriptDir, "data", "hana_card_products.input.example.json");

  let inputPath;
  if (inputPathArg) {
    inputPath = path.resolve(inputPathArg);
    if (!fs.existsSync(inputPath)) {
      console.error(`입력 파일을 찾을 수 없음: ${inputPath}`);
      process.exit(1);
    }
  } else {
    inputPath = defaultInput;
    if (!fs.existsSync(inputPath)) {
      if (fs.existsSync(exampleInput)) {
        console.error(`안내: 전체 목록 입력이 없어 예시 파일 사용함 — 필요 시 ${defaultInput} 생성`);
        inputPath = exampleInput;
      } else {
        usage();
      }
    }
  }

  const rawText = fs.readFileSync(inputPath, "utf8");
  const doc = JSON.parse(rawText);
  const sql = buildSql(doc);

  if (outPath) {
    fs.writeFileSync(path.resolve(outPath), sql, "utf8");
    console.error(`Written: ${path.resolve(outPath)}`);
  } else {
    process.stdout.write(sql);
  }
})();
