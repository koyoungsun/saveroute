/**
 * clear_test_operational_data.sql 와 동일 순서로 원격 DB 정리 (service role).
 * Usage: npm run cleanup:test-operational-data
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

const TARGET_TABLES = [
  "result_click_logs",
  "search_logs",
  "brand_request_daily_stats",
  "brand_daily_stats",
  "segment_search_stats",
  "daily_search_stats",
  "brand_requests",
  "discounts",
  "brands",
];

const PRESERVED_TABLES = [
  "benefit_categories",
  "providers",
  "benefit_products",
  "brand_categories",
  "profiles",
  "admin_accounts",
  "user_benefits",
];

async function countTable(supabase, table, filter) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

async function deleteAll(supabase, table) {
  const { error } = await supabase.from(table).delete().gte("id", 0);
  if (error) {
    const { error: err2 } = await supabase.from(table).delete().not("id", "is", null);
    if (err2) return { error: err2.message };
  }
  return { ok: true };
}

async function deleteStatsByDate(supabase, table) {
  const { error } = await supabase.from(table).delete().gte("date", "1900-01-01");
  if (error) return { error: error.message };
  return { ok: true };
}

async function snapshot(supabase, phase, tables) {
  const rows = [];
  for (const table of tables) {
    const r =
      table === "coupons_with_brand"
        ? await countTable(supabase, "coupons", (q) => q.not("brand_id", "is", null))
        : table === "benefit_products_all"
          ? await countTable(supabase, "benefit_products", (q) =>
              q.eq("is_all_product", true).eq("benefit_type", "all"),
            )
          : await countTable(supabase, table);
    rows.push({ phase, table, ...r });
  }
  return rows;
}

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("FAIL: missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const countTargets = [...TARGET_TABLES, "coupons_with_brand"];
  const before = await snapshot(supabase, "BEFORE", countTargets);
  console.log("=== BEFORE ===");
  console.table(before.map((r) => ({ table: r.table, count: r.count ?? r.error })));

  const steps = [
    ["DELETE", "result_click_logs", () => deleteAll(supabase, "result_click_logs")],
    ["DELETE", "search_logs", () => deleteAll(supabase, "search_logs")],
    [
      "DELETE",
      "brand_request_daily_stats",
      () => deleteStatsByDate(supabase, "brand_request_daily_stats"),
    ],
    ["DELETE", "brand_daily_stats", () => deleteStatsByDate(supabase, "brand_daily_stats")],
    ["DELETE", "segment_search_stats", () => deleteAll(supabase, "segment_search_stats")],
    ["DELETE", "daily_search_stats", () => deleteStatsByDate(supabase, "daily_search_stats")],
    ["DELETE", "brand_requests", () => deleteAll(supabase, "brand_requests")],
    ["DELETE", "discounts", () => deleteAll(supabase, "discounts")],
    [
      "UPDATE",
      "coupons.brand_id=NULL",
      () =>
        supabase
          .from("coupons")
          .update({ brand_id: null, updated_at: new Date().toISOString() })
          .not("brand_id", "is", null)
          .then(({ error }) => (error ? { error: error.message } : { ok: true })),
    ],
    ["DELETE", "brands", () => deleteAll(supabase, "brands")],
  ];

  for (const [op, label, fn] of steps) {
    const result = await fn();
    if (result.error) {
      console.error(`FAIL at ${op} ${label}:`, result.error);
      process.exit(1);
    }
    console.log(`OK: ${op} ${label}`);
  }

  const after = await snapshot(supabase, "AFTER", countTargets);
  console.log("=== AFTER (targets, expect 0) ===");
  console.table(after.map((r) => ({ table: r.table, count: r.count ?? r.error })));

  const preserved = await snapshot(supabase, "PRESERVED", [
    ...PRESERVED_TABLES,
    "benefit_products_all",
  ]);
  console.log("=== PRESERVED ===");
  console.table(preserved.map((r) => ({ table: r.table, count: r.count ?? r.error })));

  const bad = after.filter((r) => (r.count ?? 0) !== 0);
  if (bad.length) {
    console.error("Some target tables still have rows:", bad);
    process.exit(1);
  }

  console.log("Cleanup complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
