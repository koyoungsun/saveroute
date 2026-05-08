"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function hideDiscountAction(formData: FormData) {
  const discountId = Number(formData.get("discount_id"));

  if (!Number.isInteger(discountId) || discountId <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("discounts")
    .update({ status: "hidden" })
    .eq("id", discountId);

  if (error) {
    console.error("Failed to hide discount.", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  revalidatePath("/admin/discounts");
}
