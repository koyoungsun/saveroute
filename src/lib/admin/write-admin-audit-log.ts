"use server";

import { resolveAdminGate } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminAuditAction = "create" | "update" | "deactivate" | "status_change";

export type WriteAdminAuditLogInput = {
  action: AdminAuditAction;
  targetTable: string;
  targetId: string | number;
  summary: string;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
};

export async function writeAdminAuditLog(input: WriteAdminAuditLogInput): Promise<void> {
  const gate = await resolveAdminGate();
  if (gate.type !== "ok") {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_user_id: gate.adminUser.userId,
    action: input.action,
    target_table: input.targetTable,
    target_id: String(input.targetId),
    before_data: input.beforeData ?? null,
    after_data: {
      ...(input.afterData ?? {}),
      summary: input.summary,
    },
  });

  if (error) {
    console.error("admin_audit_logs insert failed", {
      code: error.code,
      message: error.message,
    });
  }
}
