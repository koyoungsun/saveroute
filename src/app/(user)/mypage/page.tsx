import { redirect } from "next/navigation";

import MyPageClient from "./MyPageClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MyPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    redirect("/auth/login?redirect=%2Fmypage");
  }

  return <MyPageClient />;
}
