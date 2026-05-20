/**
 * KST 오늘 search_logs 버그 데이터 백업 후 삭제
 * 실행: node scripts/purge-today-search-logs.cjs
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

function getKstTodayWindow() {
  const localDateLabel = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const start = new Date(`${localDateLabel}T00:00:00+09:00`);
  const endExclusive = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { localDateLabel, from: start.toISOString(), to: endExclusive.toISOString() };
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
  const window = getKstTodayWindow();

  console.log("=== Purge KST today search_logs ===");
  console.log(`KST date: ${window.localDateLabel}`);
  console.log(`window: [${window.from}, ${window.to})`);

  const { count: beforeCount, error: beforeErr } = await sb
    .from("search_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", window.from)
    .lt("created_at", window.to);

  if (beforeErr) {
    console.error("before count error:", beforeErr.message);
    process.exitCode = 1;
    return;
  }

  console.log(`before count: ${beforeCount ?? 0}`);

  if (!beforeCount) {
    console.log("Nothing to delete.");
    return;
  }

  const { data: rowsToDelete, error: fetchErr } = await sb
    .from("search_logs")
    .select("id")
    .gte("created_at", window.from)
    .lt("created_at", window.to);

  if (fetchErr) {
    console.error("fetch ids error:", fetchErr.message);
    process.exitCode = 1;
    return;
  }

  const ids = (rowsToDelete ?? []).map((row) => row.id);
  console.log(`deleting ${ids.length} rows...`);

  const chunkSize = 200;
  let deleted = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error: deleteErr } = await sb.from("search_logs").delete().in("id", chunk);
    if (deleteErr) {
      console.error("delete error:", deleteErr.message);
      process.exitCode = 1;
      return;
    }
    deleted += chunk.length;
  }

  const { count: afterCount, error: afterErr } = await sb
    .from("search_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", window.from)
    .lt("created_at", window.to);

  if (afterErr) {
    console.error("after count error:", afterErr.message);
    process.exitCode = 1;
    return;
  }

  console.log(`deleted: ${deleted}`);
  console.log(`after count: ${afterCount ?? 0}`);

  const { data: dailyRow, error: dailyErr } = await sb
    .from("daily_search_stats")
    .select("*")
    .eq("date", window.localDateLabel);

  if (dailyErr) {
    console.error("daily_search_stats check error:", dailyErr.message);
    process.exitCode = 1;
    return;
  }

  if (dailyRow?.length) {
    console.log("daily_search_stats today row exists — deleting...");
    const { error: dailyDeleteErr } = await sb
      .from("daily_search_stats")
      .delete()
      .eq("date", window.localDateLabel);
    if (dailyDeleteErr) {
      console.error("daily_search_stats delete error:", dailyDeleteErr.message);
      process.exitCode = 1;
      return;
    }
    console.log("daily_search_stats today row deleted.");
  } else {
    console.log("daily_search_stats today row: none (skip)");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
