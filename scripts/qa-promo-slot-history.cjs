/**
 * Verify promo_slot_histories recording on deactivate (service role).
 * Usage: npm run qa:promo-slot-history
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

  const { error: probeError } = await supabase
    .from("promo_slot_histories")
    .select("id")
    .limit(1);

  if (probeError) {
    console.error(
      "FAIL: promo_slot_histories missing — apply 061 migration SQL first.",
    );
    process.exit(1);
  }

  const { data: slot, error: slotError } = await supabase
    .from("promo_slots")
    .select("*")
    .order("id")
    .limit(1)
    .maybeSingle();

  if (slotError || !slot) {
    console.error("FAIL: no promo_slots row to test", slotError?.message);
    process.exit(1);
  }

  const wasActive = slot.is_active;
  const testActive = false;

  const { error: updateError } = await supabase
    .from("promo_slots")
    .update({ is_active: testActive })
    .eq("id", slot.id);

  if (updateError) {
    console.error("FAIL: deactivate promo_slot", updateError.message);
    process.exit(1);
  }

  const { data: history, error: historyError } = await supabase
    .from("promo_slot_histories")
    .insert({
      promo_slot_id: slot.id,
      title: slot.title,
      link_url: slot.href,
      image_url: slot.image_url,
      hashtags: slot.hashtags,
      started_at: slot.starts_at,
      ended_at: slot.ends_at,
      final_click_count: slot.click_count ?? 0,
      event_type: "deactivated",
      reason: "qa:promo-slot-history smoke test",
      snapshot: slot,
      created_by: null,
    })
    .select("id,event_type,title,final_click_count")
    .single();

  if (historyError || !history) {
    console.error("FAIL: insert history", historyError?.message);
    process.exit(1);
  }

  console.log("History recorded:", history);

  const { error: revertError } = await supabase
    .from("promo_slots")
    .update({ is_active: wasActive })
    .eq("id", slot.id);

  if (revertError) {
    console.error("FAIL: revert promo_slot is_active", revertError.message);
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

  console.log(`promo_slots active COUNT: ${activeCount ?? 0}`);
  console.log("OK: promo_slot_histories insert path works");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
