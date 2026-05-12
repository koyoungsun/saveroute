import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import { describeSupabaseQueryFailure } from "@/lib/admin/format-db-error";

export const ADMIN_ROLES = new Set(["admin", "operator", "master"]);

export type AdminUser = {
  userId: string;
  email: string | null;
  role: string;
};

export type AdminGate =
  | { type: "ok"; adminUser: AdminUser }
  | { type: "login" }
  | { type: "denied" }
  | { type: "schema"; detail: string };

export async function resolveAdminGate(): Promise<AdminGate> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError?.message?.includes("Auth session missing") || !user) {
    return { type: "login" };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_accounts")
    .select("user_id,email,role,is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return {
      type: "schema",
      detail: describeSupabaseQueryFailure("admin_accounts 권한 조회", error),
    };
  }

  if (!data || typeof data.role !== "string" || !ADMIN_ROLES.has(data.role)) {
    return { type: "denied" };
  }

  return {
    type: "ok",
    adminUser: {
      userId: String(data.user_id),
      email: data.email ?? user.email ?? null,
      role: data.role,
    },
  };
}
