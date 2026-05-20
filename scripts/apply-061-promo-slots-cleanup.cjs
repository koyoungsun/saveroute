/**
 * 061 migration fallback — promo_slot_histories + sample cleanup (service role).
 * Usage: npm run apply:061-promo-slots
 */
const {
  createServiceClient,
  promoSlotHistoriesTableReady,
  buildSnapshot,
} = require("./lib/promo-slots-061.cjs");

async function main() {
  const supabase = createServiceClient();
  const tableReady = await promoSlotHistoriesTableReady(supabase);

  if (!tableReady) {
    console.error("FAIL: promo_slot_histories table missing in PostgREST schema cache.");
    console.error("1) Supabase SQL Editor에서 supabase/migrations/061_promo_slot_histories.sql 실행");
    console.error("2) Dashboard → Settings → API → Reload schema (또는 NOTIFY pgrst 포함 migration 재실행)");
    console.error("3) npm run apply:061-promo-slots 재실행");
    process.exit(1);
  }

  const { data: allSlots, error: loadError } = await supabase
    .from("promo_slots")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true });

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

  const keep =
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
