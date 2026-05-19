/**
 * DB freeze QA — schema columns + seed checks (service role).
 * Usage: node scripts/qa-schema-freeze.cjs
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i <= 0 || line.trim().startsWith("#")) continue;
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = val;
  }
  return env;
}

async function probeColumn(supabase, table, column) {
  const { data, error } = await supabase.from(table).select(column).limit(1);
  if (error) {
    return { ok: false, error: error.message, code: error.code };
  }
  return { ok: true, sample: data?.[0] ?? null };
}

const TEST_NAME_RE =
  /(테스트|샘플|QA|개발용|임시|더미|test|sample|dummy|example|예시|점검용)/i;
const TEST_CODE_RE = /(^|[_-])(test|sample|dummy|qa|dev|example)([_-]|$)/i;

function isLegacy043StyleCode(providerCode, productCode) {
  if (productCode === "shinhan_card_deep_dream" || productCode === "shinhan_card_mr_life") {
    return true;
  }
  const prefix = `${providerCode}_card_`;
  if (!productCode.startsWith(prefix)) return false;
  if (productCode.startsWith(`${providerCode}_cred_`)) return false;
  if (productCode.startsWith(`${providerCode}_deb_`)) return false;
  if (productCode.startsWith(`${providerCode}_cg_`)) return false;
  if (productCode === `${providerCode}_all`) return false;
  return true;
}

function isTestLikeCardProduct(row, providerCode) {
  if (providerCode === "hana_card") return false;
  if (TEST_NAME_RE.test(row.name ?? "")) return true;
  if (TEST_CODE_RE.test(row.code ?? "")) return true;
  return isLegacy043StyleCode(providerCode, row.code ?? "");
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("FAIL: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const report = {
    schemaColumns: {},
    benefitTypeValidation: {},
    testCardCleanup: {},
    allProducts: {},
    samsung059: {},
    errors: [],
  };

  // 3. Column probes
  const columns = [
    ["benefit_products", "benefit_type"],
    ["benefit_products", "is_all_product"],
    ["user_benefits", "benefit_type"],
    ["discounts", "installment_condition"],
  ];

  for (const [table, col] of columns) {
    const r = await probeColumn(supabase, table, col);
    report.schemaColumns[`${table}.${col}`] = r;
    if (!r.ok) report.errors.push(`Missing or inaccessible: ${table}.${col} — ${r.error}`);
  }

  const schemaReady = columns.every(
    ([table, col]) => report.schemaColumns[`${table}.${col}`]?.ok,
  );

  if (schemaReady) {
    const allowed = new Set(["credit", "debit", "prepaid", "all"]);

    const { data: bpTypes } = await supabase
      .from("benefit_products")
      .select("id,name,benefit_type");
    const badBp = (bpTypes ?? []).filter(
      (r) => r.benefit_type != null && !allowed.has(r.benefit_type),
    );

    const { data: ubTypes } = await supabase
      .from("user_benefits")
      .select("id,benefit_type");
    const badUb = (ubTypes ?? []).filter(
      (r) => r.benefit_type != null && !allowed.has(r.benefit_type),
    );

    report.benefitTypeValidation = {
      invalidBenefitProducts: badBp.length,
      invalidUserBenefits: badUb.length,
      sampleInvalidBenefitProducts: badBp.slice(0, 5),
      ok: badBp.length === 0 && badUb.length === 0,
    };
    if (badBp.length > 0) {
      report.errors.push(
        `Invalid benefit_products.benefit_type rows: ${badBp.length}`,
      );
    }
    if (badUb.length > 0) {
      report.errors.push(`Invalid user_benefits.benefit_type rows: ${badUb.length}`);
    }

    const { data: activeCardProducts, error: cardProdErr } = await supabase
      .from("benefit_products")
      .select("id,name,code,is_active,provider_id, providers!inner(code,name,provider_type)")
      .eq("is_active", true)
      .eq("providers.provider_type", "card_company");

    if (cardProdErr) {
      report.errors.push(`active card products load: ${cardProdErr.message}`);
    } else {
      const testActive = (activeCardProducts ?? []).filter((row) => {
        const p = row.providers;
        return isTestLikeCardProduct(row, p?.code ?? "");
      });
      report.testCardCleanup = {
        activeTestLikeNonHana: testActive.map((r) => ({
          provider: r.providers?.name,
          name: r.name,
          code: r.code,
        })),
        ok: testActive.length === 0,
      };
      if (testActive.length > 0) {
        report.errors.push(
          `Active test-like card products (non-hana): ${testActive.length}`,
        );
      }
    }
  }

  // 4a. Card company all products
  const { data: cardCategory } = await supabase
    .from("benefit_categories")
    .select("id")
    .eq("code", "card")
    .maybeSingle();

  const { data: cardProviders, error: provErr } = await supabase
    .from("providers")
    .select("id,name,code")
    .eq("provider_type", "card_company")
    .eq("is_active", true)
    .order("name");

  if (provErr) {
    report.errors.push(`providers load: ${provErr.message}`);
  }

  const { data: allProducts, error: allErr } = await supabase
    .from("benefit_products")
    .select("id,name,provider_id,benefit_type,is_all_product,is_active")
    .eq("is_all_product", true)
    .eq("benefit_type", "all");

  if (allErr) {
    report.errors.push(`all products load: ${allErr.message}`);
  }

  const byProvider = new Map();
  for (const row of allProducts ?? []) {
    const list = byProvider.get(row.provider_id) ?? [];
    list.push(row);
    byProvider.set(row.provider_id, list);
  }

  const providerCoverage = [];
  for (const p of cardProviders ?? []) {
    const rows = byProvider.get(p.id) ?? [];
    providerCoverage.push({
      provider: p.name,
      code: p.code,
      allProductCount: rows.length,
      names: rows.map((r) => r.name),
      ok: rows.length === 1,
    });
    if (rows.length === 0) {
      report.errors.push(`Missing all-product row for provider: ${p.name}`);
    } else if (rows.length > 1) {
      report.errors.push(
        `Duplicate all-product rows for provider ${p.name}: ${rows.length} rows`,
      );
    }
  }

  report.allProducts = {
    cardProviderCount: cardProviders?.length ?? 0,
    allProductRowCount: allProducts?.length ?? 0,
    providerCoverage,
    allOk: providerCoverage.every((x) => x.ok),
  };

  // 4c. Samsung 059 duplicate check — (provider_id, name, benefit_type)
  const { data: samsungProvider } = await supabase
    .from("providers")
    .select("id")
    .eq("code", "samsung_card")
    .maybeSingle();

  if (samsungProvider?.id) {
    const { data: samsungProducts, error: samErr } = await supabase
      .from("benefit_products")
      .select("id,name,benefit_type,code")
      .eq("provider_id", samsungProvider.id);

    if (samErr) {
      report.errors.push(`samsung products: ${samErr.message}`);
    } else {
      const keyCount = new Map();
      const codeCount = new Map();
      for (const row of samsungProducts ?? []) {
        const k = `${row.name}|${row.benefit_type ?? ""}`;
        keyCount.set(k, (keyCount.get(k) ?? 0) + 1);
        codeCount.set(row.code, (codeCount.get(row.code) ?? 0) + 1);
      }
      const dupKeys = [...keyCount.entries()].filter(([, n]) => n > 1);
      const dupCodes = [...codeCount.entries()].filter(([, n]) => n > 1);
      report.samsung059 = {
        totalRows: samsungProducts?.length ?? 0,
        duplicateNameBenefitType: dupKeys.map(([k, n]) => ({ key: k, count: n })),
        duplicateCodes: dupCodes.map(([c, n]) => ({ code: c, count: n })),
        ok: dupKeys.length === 0 && dupCodes.length === 0,
      };
      if (dupKeys.length) {
        report.errors.push(
          `Samsung duplicate (name,benefit_type): ${JSON.stringify(dupKeys)}`,
        );
      }
      if (dupCodes.length) {
        report.errors.push(`Samsung duplicate codes: ${JSON.stringify(dupCodes)}`);
      }
    }
  } else {
    report.samsung059 = { ok: false, note: "samsung_card provider not found" };
    report.errors.push("samsung_card provider not found");
  }

  // Migration hint: try selecting a row that would only exist after 059 (samsung_cg prefix)
  if (samsungProvider?.id) {
    const { count } = await supabase
      .from("benefit_products")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", samsungProvider.id)
      .like("code", "samsung_cg_%");
    report.samsung059.cardgorillaSeedRows = count ?? 0;
  }

  const pass = report.errors.length === 0;
  console.log(JSON.stringify({ pass, ...report }, null, 2));
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
