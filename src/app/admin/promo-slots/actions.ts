"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function togglePromoSlotActiveAction(formData: FormData) {
  const slotId = Number(formData.get("promo_slot_id"));
  const nextActive = formData.get("next_active") === "true";

  if (!Number.isInteger(slotId) || slotId <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
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

  revalidatePath("/admin/promo-slots");
  revalidatePath("/");
}
