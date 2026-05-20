import type { SupabaseClient } from "@supabase/supabase-js";

import type { AdminAuditLogRow } from "@/lib/admin/audit-log-display";

export type AdminAuditLogQuery = {
  action?: string;
  targetTable?: string;
  adminUserId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
};

export type AdminAuditLogListItem = AdminAuditLogRow & {
  adminEmail: string | null;
};

function parseDateStart(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(`${value.trim()}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateEnd(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(`${value.trim()}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function loadAdminAuditLogs(
  supabase: SupabaseClient,
  query: AdminAuditLogQuery = {},
): Promise<AdminAuditLogListItem[]> {
  const limit = query.limit ?? 50;

  let request = supabase
    .from("admin_audit_logs")
    .select(
      "id,admin_user_id,action,target_table,target_id,before_data,after_data,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (query.action?.trim()) {
    request = request.eq("action", query.action.trim());
  }

  if (query.targetTable?.trim()) {
    request = request.eq("target_table", query.targetTable.trim());
  }

  if (query.adminUserId?.trim()) {
    request = request.eq("admin_user_id", query.adminUserId.trim());
  }

  const start = parseDateStart(query.startDate);
  if (start) {
    request = request.gte("created_at", start.toISOString());
  }

  const end = parseDateEnd(query.endDate);
  if (end) {
    request = request.lte("created_at", end.toISOString());
  }

  const { data, error } = await request;
  if (error) {
    throw new Error(`admin_audit_logs 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as AdminAuditLogRow[];
  const adminIds = [...new Set(rows.map((row) => row.admin_user_id))];

  const emailByUserId = new Map<string, string | null>();
  if (adminIds.length > 0) {
    const { data: admins } = await supabase
      .from("admin_accounts")
      .select("user_id,email")
      .in("user_id", adminIds);

    for (const admin of admins ?? []) {
      emailByUserId.set(String(admin.user_id), admin.email ?? null);
    }
  }

  return rows.map((row) => ({
    ...row,
    adminEmail: emailByUserId.get(row.admin_user_id) ?? null,
  }));
}

export async function loadAdminAuditLogFilterOptions(supabase: SupabaseClient) {
  const [{ data: actions }, { data: targets }, { data: admins }] = await Promise.all([
    supabase.from("admin_audit_logs").select("action").limit(200),
    supabase.from("admin_audit_logs").select("target_table").limit(200),
    supabase
      .from("admin_accounts")
      .select("user_id,email")
      .eq("is_active", true)
      .order("email", { ascending: true }),
  ]);

  const uniqueActions = [...new Set((actions ?? []).map((row) => String(row.action)))].sort();
  const uniqueTargets = [
    ...new Set((targets ?? []).map((row) => String(row.target_table))),
  ].sort();

  return {
    actions: uniqueActions,
    targetTables: uniqueTargets,
    admins: (admins ?? []).map((row) => ({
      userId: String(row.user_id),
      email: row.email ?? String(row.user_id),
    })),
  };
}
