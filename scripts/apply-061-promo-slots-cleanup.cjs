/**
 * 061 migration fallback — promo_slot_histories + sample cleanup (service role).
 * Usage: npm run apply:061-promo-slots
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

function buildSnapshot(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    badge: row.badge,
    image_url: row.image_url,
    href: row.href,
    priority: row.priority,
    is_active: row.is_active,
    is_sponsored: row.is_sponsored,
    sponsor_name: row.sponsor_name,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    link_type: row.link_type,
    hashtags: row.hashtags,
    click_count: row.click_count,
    impression_count: row.impression_count,
  };
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

  const { error: historyProbeError } = await supabase
    .from("promo_slot_histories")
    .select("id")
    .limit(1);

  if (historyProbeError) {
    console.error(
      "FAIL: promo_slot_histories table missing. Apply supabase/migrations/061_promo_slot_histories.sql first.",
    );
    console.error(historyProbeError.message);
    process.exit(1);
  }

  const { data: allSlots, error: loadError } = await supabase
    .from("promo_slots")
    .select("*")
    .order("priority", { ascending: false })
    .order("id", { ascending: true });

  if (loadError) {
    console.error("FAIL: load promo_slots", loadError.message);
    process.exit(1);
  }

  const rows = allSlots ?? [];
  console.log(`promo_slots COUNT before cleanup: ${rows.length}`);
  for (const row of rows) {
    console.log(
      `  candidate id=${row.id} title=${JSON.stringify(row.title)} href=${row.href} is_active=${row.is_active} priority=${row.priority}`,
    );
  }

  let keep =
    rows.find(
      (row) =>
        row.title === "이번 주 인기 할인 모아보기" &&
        row.href === "/search?keyword=스타벅스",
    ) ?? rows[0];

  if (!keep) {
    console.log("No promo_slots rows — nothing to clean.");
    process.exit(0);
  }

  console.log(`Keeping promo_slot id=${keep.id}`);

  const toRemove = rows.filter((row) => row.id !== keep.id);
  if (toRemove.length > 0) {
    const historyRows = toRemove.map((row) => ({
      promo_slot_id: row.id,
      title: row.title,
      link_url: row.href,
      image_url: row.image_url,
      hashtags: row.hashtags,
      started_at: row.starts_at,
      ended_at: row.ends_at,
      final_click_count: row.click_count ?? 0,
      event_type: "deleted",
      reason: "061 script: 샘플 데이터 정리 (canonical 1건만 유지)",
      snapshot: buildSnapshot(row),
      created_by: null,
    }));

    const { error: historyError } = await supabase
      .from("promo_slot_histories")
      .insert(historyRows);

    if (historyError) {
      console.error("FAIL: insert promo_slot_histories", historyError.message);
      process.exit(1);
    }

    const { error: deleteError } = await supabase
      .from("promo_slots")
      .delete()
      .neq("id", keep.id);

    if (deleteError) {
      console.error("FAIL: delete promo_slots", deleteError.message);
      process.exit(1);
    }
  }

  const { error: activateError } = await supabase
    .from("promo_slots")
    .update({ is_active: true })
    .eq("id", keep.id);

  if (activateError) {
    console.error("FAIL: activate kept promo_slot", activateError.message);
    process.exit(1);
  }

  const { count: afterCount, error: countError } = await supabase
    .from("promo_slots")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("FAIL: count promo_slots", countError.message);
    process.exit(1);
  }

  const { count: activeCount, error: activeError } = await supabase
    .from("promo_slots")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (activeError) {
    console.error("FAIL: count active promo_slots", activeError.message);
    process.exit(1);
  }

  const { count: historyCount, error: historyCountError } = await supabase
    .from("promo_slot_histories")
    .select("*", { count: "exact", head: true });

  if (historyCountError) {
    console.error("FAIL: count promo_slot_histories", historyCountError.message);
    process.exit(1);
  }

  console.log(`promo_slots COUNT after cleanup: ${afterCount ?? 0}`);
  console.log(`promo_slots active COUNT: ${activeCount ?? 0}`);
  console.log(`promo_slot_histories COUNT: ${historyCount ?? 0}`);
  console.log("OK: promo slots cleanup complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
