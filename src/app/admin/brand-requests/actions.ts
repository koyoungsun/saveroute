"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_STATUSES = ["pending", "reviewing", "completed", "rejected"] as const;

export async function updateBrandRequestStatusAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const statusRaw = String(formData.get("status") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  if (!ALLOWED_STATUSES.includes(statusRaw as (typeof ALLOWED_STATUSES)[number])) {
    return;
  }

  const status = statusRaw as (typeof ALLOWED_STATUSES)[number];
  const now = new Date().toISOString();

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brand_requests")
    .update({ status, updated_at: now })
    .eq("id", id);

  if (error) {
    console.error("brand_requests update failed", error.message);
    return;
  }

  revalidatePath("/admin/brand-requests");
}
