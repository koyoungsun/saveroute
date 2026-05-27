"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

export type BrandEditFormState = {
  message?: string;
  fieldErrors?: Partial<
    Record<"name" | "slug" | "category_id" | "aliases" | "official_url", string>
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

function parseAliases(value: string) {
  if (!value) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((alias) => alias.trim())
        .filter(Boolean),
    ),
  );
}

export async function updateBrandAction(
  brandId: number,
  _prevState: BrandEditFormState,
  formData: FormData,
): Promise<BrandEditFormState> {
  if (!Number.isInteger(brandId) || brandId <= 0) {
    return { message: "올바른 브랜드를 선택해 주세요." };
  }

  const name = readString(formData, "name");
  const slug = readString(formData, "slug");
  const categoryIdValue = readString(formData, "category_id");
  const aliasesValue = readString(formData, "aliases");
  const adminMemo = readString(formData, "admin_memo");
  const officialUrlValue = readString(formData, "official_url");
  const isActive = formData.get("is_active") === "on";
  const hasPriceBoard = formData.get("has_price_board") === "on";

  const fieldErrors: BrandEditFormState["fieldErrors"] = {};

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

  const officialUrl = normalizeUrl(officialUrlValue);
  if (officialUrlValue && !officialUrl) {
    fieldErrors.official_url = "올바른 URL을 입력해 주세요.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brands")
    .update({
      name,
      slug,
      category_id: categoryId,
      aliases: parseAliases(aliasesValue),
      admin_memo: adminMemo || null,
      official_url: officialUrl,
      is_active: isActive,
      has_price_board: hasPriceBoard,
    })
    .eq("id", brandId);

  if (error) {
    if (error.code === "23505") {
      return {
        fieldErrors: {
          slug: "이미 사용 중인 slug입니다.",
        },
      };
    }

    return {
      message: `브랜드 수정에 실패했습니다: ${error.message}`,
    };
  }

  await writeAdminAuditLog({
    action: "update",
    targetTable: "brands",
    targetId: brandId,
    summary: `브랜드 수정: ${name}`,
    afterData: {
      name,
      slug,
      is_active: isActive,
      has_price_board: hasPriceBoard,
    },
  });

  revalidatePath("/admin/brands");
  revalidatePath(`/admin/brands/${brandId}/edit`);

  if (process.env.NODE_ENV === "development") {
    console.debug(
      `[updateBrandAction] brand_id=${brandId} has_price_board=${hasPriceBoard} (price items are saved separately via price-items-actions)`,
    );
  }

  redirect(`/admin/brands/${brandId}/edit`);
}
