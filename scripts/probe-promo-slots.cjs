/**
 * Post-061 verification helper.
 * Usage: node scripts/probe-promo-slots.cjs
 */
const {
  createServiceClient,
  promoSlotHistoriesTableReady,
} = require("./lib/promo-slots-061.cjs");

async function main() {
  const supabase = createServiceClient();
  const tableReady = await promoSlotHistoriesTableReady(supabase);

  const { data: slots, error: slotsError } = await supabase
    .from("promo_slots")
    .select("id,title,is_active,priority")
    .order("priority", { ascending: false });

  console.log("promo_slot_histories ready:", tableReady);
  console.log("promo_slots:", slotsError ? slotsError.message : JSON.stringify(slots, null, 2));

  if (tableReady) {
    const { count, error } = await supabase
      .from("promo_slot_histories")
      .select("*", { count: "exact", head: true });
    console.log("promo_slot_histories count:", error ? error.message : count ?? 0);

    const { data: recent, error: recentError } = await supabase
      .from("promo_slot_histories")
      .select("id,event_type,title,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    console.log(
      "recent histories:",
      recentError ? recentError.message : JSON.stringify(recent, null, 2),
    );
  }
}

main().catch(console.error);
