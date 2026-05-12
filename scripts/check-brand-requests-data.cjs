/**
 * Admin 페이지와 동일 조건으로 brand_requests 조회 검증 (서비스 롤).
 * 실행: node scripts/check-brand-requests-data.cjs
 */
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  const env = {};
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

async function main() {
  const env = loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exitCode = 1;
    return;
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { count: total, error: e1 } = await sb
    .from("brand_requests")
    .select("*", { count: "exact", head: true });
  if (e1) {
    console.error("count error:", e1.message);
    process.exitCode = 1;
    return;
  }

  const { count: pending, error: e2 } = await sb
    .from("brand_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (e2) {
    console.error("pending count error:", e2.message);
    process.exitCode = 1;
    return;
  }

  const { data: rows, error: e3 } = await sb
    .from("brand_requests")
    .select("id,keyword,request_count,status,created_at,updated_at")
    .order("request_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(10);

  if (e3) {
    console.error("select error:", e3.message);
    process.exitCode = 1;
    return;
  }

  console.log("brand_requests total rows:", total ?? 0);
  console.log("pending:", pending ?? 0);
  console.log("top 10 (request_count DESC, updated_at DESC):");
  console.log(JSON.stringify(rows, null, 2));

  if (!rows?.length) {
    console.log("\n(No rows — POST /api/brand-requests with a keyword to create one, then refresh Admin.)");
  }
}

main();
