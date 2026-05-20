import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { createProviderAction } from "../actions";
import { ProviderForm } from "../ProviderForm";

type BenefitCategoryOption = {
  id: number;
  name: string;
  code: string;
};

export default async function NewProviderPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("benefit_categories")
    .select("id,name,code")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load benefit categories: ${error.message}`);
  }

  const categories = (data ?? []) as BenefitCategoryOption[];
  const membershipCategoryId =
    categories.find((category) => category.code === "membership")?.id ?? null;

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">New Provider</h1>
          <p className="text-muted mb-0">
            혜택 카테고리에 연결할 제공사 정보를 입력합니다.
          </p>
        </div>
        <Link href="/admin/providers" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      <ProviderForm
        action={createProviderAction}
        categories={categories}
        membershipCategoryId={membershipCategoryId}
        mode="create"
      />
    </>
  );
}
