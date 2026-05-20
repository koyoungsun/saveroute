"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

export type BrandFormState = {
  message?: string;
  fieldErrors?: Partial<
    Record<"name" | "slug" | "category_id" | "website_url", string>
  >;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrl(value: string) {
  if (!value) {
    return null;
  }

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(normalized).toString();
  } catch {
    return null;
  }
}

export async function createBrandAction(
  _prevState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const name = readString(formData, "name");
  const slug = readString(formData, "slug");
  const categoryIdValue = readString(formData, "category_id");
  const description = readString(formData, "description");
  const websiteUrlValue = readString(formData, "website_url");
  const isActive = formData.get("is_active") === "on";

  const fieldErrors: BrandFormState["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "브랜드명을 입력해 주세요.";
  }

  if (!slug) {
    fieldErrors.slug = "slug를 입력해 주세요.";
  }

  let categoryId: number | null = null;
  if (categoryIdValue) {
    const parsedCategoryId = Number(categoryIdValue);
    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      fieldErrors.category_id = "올바른 카테고리를 선택해 주세요.";
    } else {
      categoryId = parsedCategoryId;
    }
  }

  const websiteUrl = normalizeUrl(websiteUrlValue);
  if (websiteUrlValue && !websiteUrl) {
    fieldErrors.website_url = "올바른 웹사이트 URL을 입력해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = createSupabaseAdminClient();
  const { data: createdBrand, error } = await supabase.from("brands").insert({
    name,
    slug,
    category_id: categoryId,
    admin_memo: description || null,
    official_url: websiteUrl,
    is_active: isActive,
  }).select("id").single();

  if (error || !createdBrand) {
    if (error.code === "23505") {
      return {
        fieldErrors: {
          slug: "이미 사용 중인 slug입니다.",
        },
      };
    }

    return {
      message: `브랜드 등록에 실패했습니다: ${error.message}`,
    };
  }

  await writeAdminAuditLog({
    action: "create",
    targetTable: "brands",
    targetId: createdBrand.id,
    summary: `브랜드 생성: ${name}`,
    afterData: { name, slug, is_active: isActive },
  });

  revalidatePath("/admin/brands");
  redirect("/admin/brands");
}
