/**
 * 060 migration 동일 로직 — Supabase REST(service role)로 테스트 카드 비활성화.
 * CLI db push 불가 시 fallback. Usage: node scripts/apply-060-test-card-cleanup.cjs
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

function isTestCandidate(row, providerCode) {
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
    console.error("FAIL: missing .env.local Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error: loadErr } = await supabase
    .from("benefit_products")
    .select("id,name,code,is_active, providers!inner(code,name,provider_type)")
    .eq("is_active", true)
    .eq("providers.provider_type", "card_company");

  if (loadErr) {
    console.error("FAIL: load products", loadErr.message);
    process.exit(1);
  }

  const targets = (rows ?? []).filter((r) =>
    isTestCandidate(r, r.providers?.code ?? ""),
  );

  if (targets.length === 0) {
    console.log(JSON.stringify({ ok: true, deactivatedProducts: 0, note: "no targets" }, null, 2));
    return;
  }

  const ids = targets.map((t) => t.id);
  const { error: bpErr } = await supabase
    .from("benefit_products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in("id", ids);

  if (bpErr) {
    console.error("FAIL: deactivate benefit_products", bpErr.message);
    process.exit(1);
  }

  const { data: ubRows, error: ubLoadErr } = await supabase
    .from("user_benefits")
    .select("id,benefit_product_id")
    .eq("is_active", true)
    .in("benefit_product_id", ids);

  if (ubLoadErr) {
    console.error("FAIL: load user_benefits", ubLoadErr.message);
    process.exit(1);
  }

  let deactivatedUserBenefits = 0;
  if (ubRows?.length) {
    const ubIds = ubRows.map((r) => r.id);
    const { error: ubErr } = await supabase
      .from("user_benefits")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("id", ubIds);
    if (ubErr) {
      console.error("FAIL: deactivate user_benefits", ubErr.message);
      process.exit(1);
    }
    deactivatedUserBenefits = ubIds.length;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        deactivatedProducts: targets.length,
        deactivatedUserBenefits,
        products: targets.map((t) => ({
          provider: t.providers?.name,
          name: t.name,
          code: t.code,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
