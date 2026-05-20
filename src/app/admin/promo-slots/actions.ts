"use server";

import { revalidatePath } from "next/cache";

import { resolveAdminGate } from "@/lib/admin/auth";
import {
  PROMO_SLOT_SNAPSHOT_SELECT,
  recordPromoSlotHistory,
  type PromoSlotSnapshot,
} from "@/lib/admin/promo-slot-history";
import { parsePromoSlotId } from "@/lib/promoSlotId";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

export async function togglePromoSlotActiveAction(formData: FormData) {
  const slotId = parsePromoSlotId(formData.get("promo_slot_id")?.toString() ?? null);
  const nextActive = formData.get("next_active") === "true";

  if (!slotId) {
    return;
  }

  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { data: slot, error: fetchError } = await supabase
    .from("promo_slots")
    .select(PROMO_SLOT_SNAPSHOT_SELECT)
    .eq("id", slotId)
    .maybeSingle();

  if (fetchError || !slot) {
    console.error("Failed to load promo slot before toggle.", fetchError);
    return;
  }

  const snapshot = slot as PromoSlotSnapshot;
  if (snapshot.is_active === nextActive) {
    return;
  }

  const { error } = await supabase
    .from("promo_slots")
    .update({ is_active: nextActive })
    .eq("id", slotId);

  if (error) {
    console.error("Failed to toggle promo slot.", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  try {
    await recordPromoSlotHistory(supabase, {
      slot: snapshot,
      eventType: nextActive ? "activated" : "deactivated",
      reason: nextActive ? "관리자 활성 처리" : "관리자 비활성 처리",
      createdBy: gate.adminUser.userId,
    });
  } catch (historyError) {
    console.error(historyError);
  }

  await writeAdminAuditLog({
    action: nextActive ? "update" : "deactivate",
    targetTable: "promo_slots",
    targetId: slotId,
    summary: nextActive ? "프로모션 슬롯 활성화" : "프로모션 슬롯 비활성화",
    beforeData: { is_active: snapshot.is_active },
    afterData: { is_active: nextActive, title: snapshot.title },
  });

  revalidatePath("/admin/promo-slots");
  revalidatePath("/admin/promo-slots/history");
  revalidatePath("/");
}
