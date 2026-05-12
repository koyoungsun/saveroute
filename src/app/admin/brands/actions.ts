"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function deactivateBrandAction(formData: FormData) {
  const brandId = Number(formData.get("brand_id"));

  if (!Number.isInteger(brandId) || brandId <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brands")
    .update({ is_active: false })
    .eq("id", brandId);

  if (error) {
    console.error("Failed to deactivate brand.", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  revalidatePath("/admin/brands");
}
