"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

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

  await writeAdminAuditLog({
    action: "deactivate",
    targetTable: "benefit_products",
    targetId: benefitProductId,
    summary: "혜택상품 비활성",
    afterData: { is_active: false },
  });

  revalidatePath("/admin/benefit-products");
}
