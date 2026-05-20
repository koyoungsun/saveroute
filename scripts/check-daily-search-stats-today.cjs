/**
 * daily_search_stats 오늘(KST) row 확인
 * 실행: node scripts/check-daily-search-stats-today.cjs
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
  const kstDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  console.log("=== daily_search_stats (KST today) ===");
  console.log(`date column filter: ${kstDate}`);

  const { data, error } = await sb.from("daily_search_stats").select("*").eq("date", kstDate);

  if (error) {
    console.error("query error:", error.message);
    process.exitCode = 1;
    return;
  }

  console.log(`row count: ${data?.length ?? 0}`);
  if (data?.length) {
    for (const row of data) {
      console.log(JSON.stringify(row, null, 2));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
