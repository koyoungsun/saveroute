/**
 * search_logs 오늘 집계 기준 검증 (Admin dashboard와 동일 조건)
 * 실행: node scripts/check-search-logs-today.cjs
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

  const window = (() => {
    const localDateLabel = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    const start = new Date(`${localDateLabel}T00:00:00+09:00`);
    const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return {
      localDateLabel,
      from: start.toISOString(),
      to: endExclusive.toISOString(),
    };
  })();

  console.log("=== Admin dashboard today window (KST midnight) ===");
  console.log(`gte created_at: ${window.from}`);
  console.log(`lt  created_at: ${window.to}`);

  const { count: countStarToday, error: countErr } = await sb
    .from("search_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", window.from)
    .lt("created_at", window.to);

  if (countErr) {
    console.error("count error:", countErr.message);
    process.exitCode = 1;
    return;
  }

  const { data: rows, error: rowsErr } = await sb
    .from("search_logs")
    .select("id,user_id,normalized_keyword,keyword,created_at")
    .gte("created_at", window.from)
    .lt("created_at", window.to);

  if (rowsErr) {
    console.error("rows error:", rowsErr.message);
    process.exitCode = 1;
    return;
  }

  const distinctUserIds = new Set(
    (rows ?? []).filter((row) => row.user_id).map((row) => row.user_id),
  );
  const distinctKeywords = new Set((rows ?? []).map((row) => row.normalized_keyword));

  const keywordCounts = new Map();
  for (const row of rows ?? []) {
    increment(keywordCounts, row.normalized_keyword);
  }
  const topDupes = [...keywordCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const { count: allTimeCount, error: allErr } = await sb
    .from("search_logs")
    .select("*", { count: "exact", head: true });

  if (allErr) {
    console.error("all-time count error:", allErr.message);
    process.exitCode = 1;
    return;
  }

  console.log("\n=== Metrics ===");
  console.log(`count(*) today (dashboard todaySearches): ${countStarToday}`);
  console.log(`fetched rows today: ${rows?.length ?? 0}`);
  console.log(`distinct user_id (non-null): ${distinctUserIds.size}`);
  console.log(`distinct normalized_keyword: ${distinctKeywords.size}`);
  console.log(`search_logs all-time count(*): ${allTimeCount}`);
  console.log(`anonymous rows today (user_id null): ${(rows ?? []).filter((r) => !r.user_id).length}`);

  if (topDupes.length > 0) {
    console.log("\n=== Top repeated keywords today (refresh duplicates) ===");
    for (const [keyword, count] of topDupes) {
      console.log(`  ${keyword}: ${count} rows`);
    }
  }
}

function increment(map, key, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
