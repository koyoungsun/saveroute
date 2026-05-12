import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { BrandForm } from "./BrandForm";

type BrandCategoryOption = {
  id: number;
  name: string;
};

type PageProps = {
  searchParams: Promise<{ keyword?: string }>;
};

export default async function NewBrandPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const initialBrandName = (sp.keyword ?? "").trim();
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brand_categories")
    .select("id,name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load brand categories.", {
      code: error.code,
    });
  }

  const categories = (error ? [] : data ?? []) as BrandCategoryOption[];

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">New Brand</h1>
          <p className="text-muted mb-0">
            브랜드 기본 정보를 입력해 Supabase brands 테이블에 등록합니다.
          </p>
        </div>
        <Link href="/admin/brands" className="btn btn-outline-secondary">
          목록으로
        </Link>
      </div>

      {error ? (
        <div className="alert alert-warning" role="alert">
          브랜드 카테고리를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      ) : null}

      <BrandForm categories={categories} initialBrandName={initialBrandName || undefined} />
    </>
  );
}
