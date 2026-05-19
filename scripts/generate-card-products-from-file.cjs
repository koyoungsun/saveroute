#!/usr/bin/env node
/**
 * 카드사별 카드명 JSON → benefit_products 마스터 UPSERT SQL + 리포트
 *
 * 사용 예:
 *   node scripts/generate-card-products-from-file.cjs --in scripts/data/card_products_by_provider.input.json
 *   node scripts/generate-card-products-from-file.cjs --example
 *
 * 기본 출력:
 *   supabase/migrations/043_seed_card_products_from_file.sql
 *   scripts/data/unmatched-providers.json
 *   scripts/data/duplicate-cards-report.json
 *
 * 카드사 해석 순서:
 *   1) 항목에 providerCode 가 있으면 providers.code 매칭(대소문자 무관)
 *   2) providerName 과 DB 시드 이름 정확 일치(NFKC trim, 공백 압축)
 *   3) providerName 과 providers.code 문자열 동일 여부(kb_card 등 사용자가 코드를 넣은 경우)
 * 추가 별명은 선택 파일 --aliases scripts/data/card_provider_aliases.json 형식:
 *   { "KB국민": "KB국민카드", "국민카드": "KB국민카드" }  (값은 본 카탈로그의 정식 이름)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/** 041_seed_card_provider_master_phase1.sql 카드 카테고리 provider (displayName 기준 표기) */
const EMBEDDED_CARD_PROVIDERS = [
  ["신한카드", "shinhan_card"],
  ["삼성카드", "samsung_card"],
  ["KB국민카드", "kb_card"],
  ["현대카드", "hyundai_card"],
  ["하나카드", "hana_card"],
  ["롯데카드", "lotte_card"],
  ["우리카드", "woori_card"],
  ["NH농협카드", "nh_card"],
  ["BC카드", "bc_card"],
  ["IBK기업은행", "ibk_corporate_bank"],
  ["SC제일은행", "sc_je_bank"],
  ["씨티은행", "citi_bank_korea"],
  ["부산은행", "bnk_busan"],
  ["경남은행", "bnk_gyeongnam"],
  ["대구은행", "dgb_bank"],
  ["광주은행", "kj_bank"],
  ["전북은행", "jb_bank"],
  ["제주은행", "jeju_bank"],
  ["새마을금고", "mg_saemaul"],
  ["신협", "shinhyup"],
  ["우체국", "korea_post_bank"],
  ["수협은행", "suhyup_bank"],
  ["카카오뱅크", "kakaobank"],
  ["토스뱅크", "toss_bank"],
  ["케이뱅크", "kbank"],
  ["네이버페이", "naver_pay"],
  ["카카오페이", "kakao_pay"],
  ["PAYCO", "payco"],
];

function hash12(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);
}

function canonLabel(s) {
  return String(s || "")
    .normalize("NFKC")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canonCode(s) {
  return canonLabel(String(s || "").toLowerCase()).replace(/\s+/g, "_");
}

function asciiSlugFragment(name) {
  const n = canonLabel(name);
  let raw = "";
  for (const ch of n) {
    if (/[a-zA-Z0-9]/.test(ch)) raw += ch.toLowerCase();
    else if (/[\s·\-+/]/.test(ch) || ch === "#") raw += "_";
    else raw += "_";
  }
  return raw.replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function sqlLit(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

/** @returns {{ catalog: Map<string,{ name: string, code: string}> }} nameKey -> meta */
function buildCatalog(embedRows, overlayRows, aliasesObj) {
  /** @type {Map<string,{ name:string, code:string}>} */
  const byNameNorm = new Map();
  /** @type {Map<string,{ name:string, code:string}>} */
  const byCodeNorm = new Map();

  const addPair = (name, code) => {
    const meta = { name: String(name), code: String(code) };
    byNameNorm.set(canonLabel(name), meta);
    byCodeNorm.set(canonCode(code), meta);
  };

  for (const [nm, cd] of embedRows) addPair(nm, cd);
  for (const row of overlayRows || []) {
    if (row && row.name && row.code) addPair(row.name, row.code);
  }

  if (aliasesObj && typeof aliasesObj === "object") {
    for (const aliasKey of Object.keys(aliasesObj)) {
      const targetDisplay = canonLabel(String(aliasesObj[aliasKey]));
      const meta = byNameNorm.get(targetDisplay);
      if (meta) {
        const ak = canonLabel(aliasKey);
        if (!byNameNorm.has(ak)) byNameNorm.set(ak, meta);
      }
    }
  }

  return { byNameNorm, byCodeNorm };
}

/** @typedef {{ rawInput: object, normalizedName:string, mappedFromAlias?:boolean }} ResolvedBlock */
function resolveProvider(block, catalog) {
  const rawPn = block && block.providerName != null ? block.providerName : "";
  const rawPc = block && block.providerCode != null ? block.providerCode : "";

  const codeCand = canonCode(rawPc || "");
  if (codeCand.length > 0) {
    const m = catalog.byCodeNorm.get(codeCand);
    if (m)
      return {
        matched: /** @type {const} */ (m),
        usedKey: rawPc.trim(),
      };
    return { matched: null, usedKey: rawPc.trim() };
  }

  const nameNorm = canonLabel(rawPn);

  /** 별명/코드 문자열 우선 순위: 코드 형태처럼 보이면 code 맵 재시도 */
  const tryCodeLike = canonCode(rawPn);
  if (tryCodeLike.includes("_")) {
    const asCode = catalog.byCodeNorm.get(tryCodeLike);
    if (asCode) return { matched: asCode, usedKey: rawPn };
  }

  const nm = catalog.byNameNorm.get(nameNorm);
  if (nm) return { matched: nm, usedKey: rawPn };

  return { matched: null, usedKey: rawPn };
}

/**
 * 카드 목록: provider 고유 카드 표시명 (정규화 기준 중복만 제거, 보고 포함)
 */
function squeezeCardsPerProvider(providerLabel, resolvedCode, cards, dupReportAccumulator) {
  const list = Array.isArray(cards) ? cards : [];
  /** canon -> { count, originals: Set, displayName:string } */
  /** @type {Map<string,{ count:number, originals:string[], displayName:string }>} */
  const map = new Map();

  const dupsEntry = {
    providerNameInput: providerLabel,
    resolvedProviderCode: resolvedCode,
    duplicates: /** @type {object[]} */ ([]),
  };

  for (const raw of list) {
    const t = canonLabel(raw);
    if (!t || t.length < 1) continue;
    let cur = map.get(t);
    if (!cur) {
      cur = { count: 0, originals: [], displayName: String(raw).trim() };
      map.set(t, cur);
    }
    cur.count += 1;
    if (!cur.originals.includes(String(raw))) cur.originals.push(String(raw));
  }

  for (const [cn, agg] of map) {
    if (agg.count > 1 || agg.originals.length > 1) {
      dupsEntry.duplicates.push({
        canonicalName: cn,
        mergeCountDiscard: agg.count - 1,
        variationsSample: agg.originals.slice(0, 15),
      });
    }
  }

  if (dupsEntry.duplicates.length > 0) dupReportAccumulator.push(dupsEntry);

  return [...map.values()].map((v) => v.displayName || v.originals[0]).sort((a, b) => a.localeCompare(b, "ko"));
}

function deriveProductCode(providerCode, cardDisplayName, usedCodes) {
  const frag = asciiSlugFragment(cardDisplayName);
  const tail = frag.length >= 4 ? frag : `x${hash12(`${providerCode}|${cardDisplayName}`)}`;
  let code = `${providerCode}_${tail}`.replace(/__/g, "_").slice(0, 92);
  if (usedCodes.has(code)) code = `${providerCode}_${hash12(cardDisplayName)}`.slice(0, 92);
  let n = 2;
  while (usedCodes.has(code)) {
    code = `${providerCode}_${hash12(`${providerCode}:${cardDisplayName}:${n}`)}`.slice(0, 92);
    n++;
  }
  usedCodes.add(code);
  return code;
}

function parseArgs(argv) {
  /** @type {Record<string,string|boolean>} */
  const opts = {};
  const rest = [];
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--example") opts.example = true;
    else if (a.startsWith("--") && argv[i + 1] && !argv[i + 1].startsWith("--")) {
      opts[a.slice(2)] = argv[i + 1];
      i++;
    } else if (a.startsWith("--")) opts[a.slice(2)] = true;
    else rest.push(a);
  }
  return { opts, rest };
}

(function main() {
  const { opts } = parseArgs(process.argv);

  const scriptDir = path.resolve(__dirname);
  const saveroot = path.dirname(scriptDir);
  const defIn = path.join(scriptDir, "data", "card_products_by_provider.input.json");
  const defExample = path.join(scriptDir, "data", "card_products_by_provider.input.example.json");

  let inputPath = opts.in ? path.resolve(String(opts.in)) : defIn;
  if (opts.example) inputPath = defExample;

  if (!fs.existsSync(inputPath)) {
    console.error(`입력을 찾을 수 없음: ${inputPath}\n--example 로 예시 또는 --in 경로 확인`);
    process.exit(1);
  }

  /** @typedef {{ json: any[], aliases?: object, providers?: Array<{name:string,code:string}> }} InputShape */
  const rawText = fs.readFileSync(inputPath, "utf8");
  /** @type {InputShape | any[] } */
  const parsedRoot = JSON.parse(rawText);

  let blocks =
    parsedRoot instanceof Array ? parsedRoot : Array.isArray(parsedRoot.providers) ? parsedRoot.providers : null;

  if (!blocks || !blocks.length) {
    console.error("입력 형식 오류: 루트 배열 또는 { providers:[{providerName, cards}] }");
    process.exit(1);
  }

  const overlayProviders =
    !Array.isArray(parsedRoot) && Array.isArray(parsedRoot.providers_overlay)
      ? parsedRoot.providers_overlay
      : !Array.isArray(parsedRoot) && Array.isArray(parsedRoot.extra_providers)
        ? parsedRoot.extra_providers
        : [];
  let aliasesDict = {};
  if (!Array.isArray(parsedRoot) && parsedRoot.aliases && typeof parsedRoot.aliases === "object")
    aliasesDict = parsedRoot.aliases;

  const aliasesPathArg = opts.aliases ? path.resolve(String(opts.aliases)) : null;
  if (aliasesPathArg && fs.existsSync(aliasesPathArg)) {
    const aj = JSON.parse(fs.readFileSync(aliasesPathArg, "utf8"));
    aliasesDict = Object.assign({}, aliasesDict, aj || {});
  }

  const overlayPathArg = opts.catalog ? path.resolve(String(opts.catalog)) : null;
  let overlayFromFile = [];
  if (overlayPathArg && fs.existsSync(overlayPathArg))
    overlayFromFile = JSON.parse(fs.readFileSync(overlayPathArg, "utf8"));

  const catalogMaps = buildCatalog(EMBEDDED_CARD_PROVIDERS, [...overlayProviders, ...overlayFromFile], aliasesDict);

  const unmatched = [];
  const duplicateAccumulator = [];

  /** @type {{ cardName:string, code:string, providerCode:string }}[] */
  const products = [];

  /** @type {Set<string>} */
  const codesUsed = new Set();

  const genAt = new Date().toISOString();

  for (const blk of blocks) {
    const providerLabelRaw = canonLabel(blk && blk.providerName != null ? blk.providerName : "");

    const { matched, usedKey } = resolveProvider(blk || {}, catalogMaps);

    if (!matched || !matched.code) {
      unmatched.push({
        providerNameInput: providerLabelRaw || usedKey || "(비어있음)",
        reason: "no_matching_provider_by_name_or_code",
        suggestion: `041 시드 이름·code 또는 입력 aliases 를 추가하거나 providerCode 필드를 채워 주세요.`,
      });
      continue;
    }

    const cardsFlat = squeezeCardsPerProvider(
      providerLabelRaw,
      matched.code,
      blk && blk.cards,
      duplicateAccumulator,
    );

    for (const cname of cardsFlat) {
      const code = deriveProductCode(matched.code, cname, codesUsed);
      products.push({
        providerCode: matched.code,
        cardName: cname,
        code,
      });
    }
  }

  products.sort((a, b) => {
    const pc = a.providerCode.localeCompare(b.providerCode);
    if (pc !== 0) return pc;
    return a.cardName.localeCompare(b.cardName, "ko");
  });

  const outSql = opts.out ? path.resolve(String(opts.out)) : path.join(saveroot, "supabase", "migrations", "043_seed_card_products_from_file.sql");

  const outUnmatched = opts.unmatched
    ? path.resolve(String(opts.unmatched))
    : path.join(scriptDir, "data", "unmatched-providers.json");

  const outDups = opts.duplicates
    ? path.resolve(String(opts.duplicates))
    : path.join(scriptDir, "data", "duplicate-cards-report.json");

  const sqlParts = [];

  sqlParts.push(`-- benefit_products 카드명 마스터 (외부 카드 목록 파일 기반 생성)
-- 재생성: npm run seed:card-products-from-file 또는 node scripts/generate-card-products-from-file.cjs [--in 경로]
-- 생성 시점: ${genAt}
-- 소스 파일: ${inputPath.replace(/\\/g, "/")}
-- 할인·혜택 상세 미포함. 미구분 카드 타입일 때 benefit_type/card_type unknown, product_type 임시 credit_card 스키마 정합성.
`);

  if (unmatched.length) {
    sqlParts.push(`-- 경고: 미매칭 카드사 ${unmatched.length}건 → scripts 데이터 unmatched-providers.json 참고`);
  }

  sqlParts.push("");

  if (!products.length) {
    sqlParts.push(`-- INSERT 대상 카드 행이 0건입니다. 입력 카드 목록 또는 카드사명 매칭을 확인 후 다시 실행하세요.`);
    sqlParts.push(`SELECT 1;`);
    sqlParts.push("");
  } else {
    sqlParts.push(`INSERT INTO public.benefit_products (
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
)`);
    sqlParts.push(`SELECT`);
    sqlParts.push(`  (SELECT id FROM public.benefit_categories WHERE code = 'card' LIMIT 1),`);
    sqlParts.push(`  (SELECT id FROM public.providers WHERE code = v.provider_code LIMIT 1),`);
    sqlParts.push(`  v.name,`);
    sqlParts.push(`  v.code,`);
    sqlParts.push(`  v.product_type::TEXT,`);
    sqlParts.push(`  NULL::TEXT,`);
    sqlParts.push(`  v.card_type::TEXT,`);
    sqlParts.push(`  v.benefit_type::TEXT,`);
    sqlParts.push(`  FALSE,`);
    sqlParts.push(`  FALSE,`);
    sqlParts.push(`  TRUE`);
    sqlParts.push(`FROM (VALUES`);
    sqlParts.push(
      products
        .map(
          (p) =>
            `  (${sqlLit(p.cardName)}::TEXT, ${sqlLit(p.code)}::TEXT, ${sqlLit(p.providerCode)}::TEXT, 'credit_card'::TEXT, 'unknown'::TEXT, 'unknown'::TEXT)`,
        )
        .join(",\n"),
    );
    sqlParts.push(`) AS v(name, code, provider_code, product_type, card_type, benefit_type)`);
    sqlParts.push(`ON CONFLICT (code) DO UPDATE SET`);
    sqlParts.push(`  name = EXCLUDED.name,`);
    sqlParts.push(`  benefit_category_id = EXCLUDED.benefit_category_id,`);
    sqlParts.push(`  provider_id = EXCLUDED.provider_id,`);
    sqlParts.push(`  product_type = EXCLUDED.product_type,`);
    sqlParts.push(`  grade = EXCLUDED.grade,`);
    sqlParts.push(`  card_type = EXCLUDED.card_type,`);
    sqlParts.push(`  benefit_type = EXCLUDED.benefit_type,`);
    sqlParts.push(`  is_mvno = EXCLUDED.is_mvno,`);
    sqlParts.push(`  mvno_notice_required = EXCLUDED.mvno_notice_required,`);
    sqlParts.push(`  is_active = TRUE,`);
    sqlParts.push(`  updated_at = NOW();`);
    sqlParts.push("");
  }

  fs.writeFileSync(outSql, sqlParts.join("\n"), "utf8");

  const unmatchedBlob = {
    generatedAt: genAt,
    inputPath,
    count: unmatched.length,
    unmatched,
  };

  const dupBlob = {
    generatedAt: genAt,
    inputPath,
    note: `동일 카드 표시명(NFKC·trim·공백압축 기준 같음) 중복은 하나만 남기고 병합, 아래 목록만 보존 카운트.`,
    duplicateCardNamesByProvider: duplicateAccumulator.filter((x) => x.duplicates.length > 0),
  };

  fs.writeFileSync(outUnmatched, JSON.stringify(unmatchedBlob, null, 2), "utf8");
  fs.writeFileSync(outDups, JSON.stringify(dupBlob, null, 2), "utf8");

  console.error(`SQL written: ${outSql}`);
  console.error(`unmatched written: ${outUnmatched}`);
  console.error(`duplicates written: ${outDups}`);
  console.error(
    `[summary] 카드 행 ${products.length}건 · 미매칭 카드사 블록 ${unmatched.length}건 · 카드 표시중복 블록 ${dupBlob.duplicateCardNamesByProvider.length}건`,
  );
})();
