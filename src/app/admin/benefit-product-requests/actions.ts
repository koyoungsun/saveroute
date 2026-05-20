"use server";

import { revalidatePath } from "next/cache";

import {
  approveBenefitProductRequest,
  rejectBenefitProductRequest,
} from "@/lib/admin/benefit-product-requests";
import { resolveAdminGate } from "@/lib/admin/auth";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function approveBenefitProductRequestAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return;
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { productId, created } = await approveBenefitProductRequest(
      supabase,
      id,
      gate.adminUser.userId,
    );

    const { data: requestRow } = await supabase
      .from("benefit_product_requests")
      .select("requested_name")
      .eq("id", id)
      .maybeSingle();

    await writeAdminAuditLog({
      action: "create",
      targetTable: "benefit_products",
      targetId: productId,
      summary: `카드 요청 승인: ${requestRow?.requested_name ?? id}${created ? "" : " (기존 상품 연결)"}`,
      afterData: { request_id: id, product_id: productId, created },
    });
  } catch (error) {
    console.error("benefit_product_requests approve failed", error);
    return;
  }

  revalidatePath("/admin/benefit-product-requests");
  revalidatePath("/admin/benefit-products");
  revalidatePath("/my-benefits");
  revalidatePath("/onboarding");
}

export async function rejectBenefitProductRequestAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const adminMemo = String(formData.get("admin_memo") ?? "").trim();

  if (!Number.isInteger(id) || id <= 0) {
    return;
  }

  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return;
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { data: existing } = await supabase
      .from("benefit_product_requests")
      .select("requested_name,status")
      .eq("id", id)
      .maybeSingle();

    await rejectBenefitProductRequest(supabase, id, adminMemo, gate.adminUser.userId);

    await writeAdminAuditLog({
      action: "status_change",
      targetTable: "benefit_product_requests",
      targetId: id,
      summary: `카드 요청 반려: ${existing?.requested_name ?? id}`,
      beforeData: { status: existing?.status ?? "pending" },
      afterData: { status: "rejected", admin_memo: adminMemo || null },
    });
  } catch (error) {
    console.error("benefit_product_requests reject failed", error);
    return;
  }

  revalidatePath("/admin/benefit-product-requests");
  revalidatePath("/my-benefits");
  revalidatePath("/onboarding");
}
