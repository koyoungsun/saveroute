"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function deactivateBenefitProductAction(formData: FormData) {
  const benefitProductId = Number(formData.get("benefit_product_id"));

  if (!Number.isInteger(benefitProductId) || benefitProductId <= 0) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("benefit_products")
    .update({ is_active: false })
    .eq("id", benefitProductId);

  if (error) {
    console.error("Failed to deactivate benefit product.", {
      code: error.code,
      message: error.message,
    });
    return;
  }

  revalidatePath("/admin/benefit-products");
}
