/**
 * Verify promo_slot_histories + RPC after 061 migration.
 * Usage: npm run qa:promo-slot-history
 */
const {
  createServiceClient,
  promoSlotHistoriesTableReady,
} = require("./lib/promo-slots-061.cjs");

async function main() {
  const supabase = createServiceClient();
  const tableReady = await promoSlotHistoriesTableReady(supabase);

  if (!tableReady) {
    console.error("FAIL: promo_slot_histories missing — apply 061 migration SQL first.");
    process.exit(1);
  }

  const { data: slot, error: slotError } = await supabase
    .from("promo_slots")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (slotError || !slot) {
    console.error("FAIL: no promo_slots row to test", slotError?.message);
    process.exit(1);
  }

  const { error: rpcError } = await supabase.rpc("increment_promo_slot_click_count", {
    slot_id: slot.id,
  });

  if (rpcError) {
    console.error("FAIL: increment_promo_slot_click_count RPC", rpcError.message);
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
      final_click_count: (slot.click_count ?? 0) + 1,
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
  console.log("RPC increment_promo_slot_click_count: OK");

  const { count: activeCount, error: activeError } = await supabase
    .from("promo_slots")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (activeError) {
    console.error("FAIL: count active promo_slots", activeError.message);
    process.exit(1);
  }

  console.log(`promo_slots active COUNT: ${activeCount ?? 0}`);
  console.log("OK: promo_slot_histories + RPC path works");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
