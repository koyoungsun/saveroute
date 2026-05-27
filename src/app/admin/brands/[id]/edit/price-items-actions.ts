"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { writeAdminAuditLog } from "@/lib/admin/write-admin-audit-log";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInt(formData: FormData, key: string) {
  const raw = readString(formData, key).replace(/,/g, "");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

export type BrandPriceItemFormState = {
  message?: string;
  success?: boolean;
};

export async function createBrandPriceItemAction(
  brandId: number,
  _prevState: BrandPriceItemFormState,
  formData: FormData,
): Promise<BrandPriceItemFormState> {
  if (process.env.NODE_ENV === "development") {
    console.debug("[createBrandPriceItemAction] called", { brandId });
  }

  if (!Number.isInteger(brandId) || brandId <= 0) {
    return { message: "올바른 브랜드를 선택해 주세요." };
  }

  const label = readString(formData, "label");
  const price = readInt(formData, "price");
  const sortOrder = readInt(formData, "sort_order") ?? 0;
  const isActive = formData.get("is_active") === "on";

  if (!label) {
    return { message: "라벨을 입력해 주세요." };
  }

  if (price == null || price < 0) {
    return { message: "올바른 가격(0 이상 정수)을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("brand_price_items")
    .insert({
      brand_id: brandId,
      label,
      price,
      sort_order: sortOrder,
      is_active: isActive,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[createBrandPriceItemAction] insert failed", {
        brandId,
        code: error.code,
        message: error.message,
      });
    }
    return { message: `가격 항목 추가에 실패했습니다: ${error.message}` };
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[createBrandPriceItemAction] insert ok", {
      brandId,
      itemId: data?.id,
      label,
      price,
      sortOrder,
      isActive,
    });
  }

  await writeAdminAuditLog({
    action: "create",
    targetTable: "brand_price_items",
    targetId: data?.id ?? null,
    summary: `브랜드 가격 항목 추가: ${label}`,
    afterData: { brand_id: brandId, label, price, sort_order: sortOrder, is_active: isActive },
  });

  revalidatePath(`/admin/brands/${brandId}/edit`);
  revalidatePath("/search");
  return { success: true };
}

export async function updateBrandPriceItemAction(
  brandId: number,
  itemId: string,
  _prevState: BrandPriceItemFormState,
  formData: FormData,
): Promise<BrandPriceItemFormState> {
  if (process.env.NODE_ENV === "development") {
    console.debug("[updateBrandPriceItemAction] called", { brandId, itemId });
  }

  if (!Number.isInteger(brandId) || brandId <= 0) {
    return { message: "올바른 브랜드를 선택해 주세요." };
  }

  const id = (itemId ?? "").trim();
  if (!id) {
    return { message: "올바른 항목을 선택해 주세요." };
  }

  const label = readString(formData, "label");
  const price = readInt(formData, "price");
  const sortOrder = readInt(formData, "sort_order") ?? 0;
  const isActive = formData.get("is_active") === "on";

  if (!label) {
    return { message: "라벨을 입력해 주세요." };
  }

  if (price == null || price < 0) {
    return { message: "올바른 가격(0 이상 정수)을 입력해 주세요." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brand_price_items")
    .update({
      label,
      price,
      sort_order: sortOrder,
      is_active: isActive,
    })
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[updateBrandPriceItemAction] update failed", {
        brandId,
        itemId: id,
        message: error.message,
      });
    }
    return { message: `가격 항목 수정에 실패했습니다: ${error.message}` };
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[updateBrandPriceItemAction] update ok", {
      brandId,
      itemId: id,
      label,
      price,
    });
  }

  await writeAdminAuditLog({
    action: "update",
    targetTable: "brand_price_items",
    targetId: id,
    summary: `브랜드 가격 항목 수정: ${label}`,
    afterData: { brand_id: brandId, label, price, sort_order: sortOrder, is_active: isActive },
  });

  revalidatePath(`/admin/brands/${brandId}/edit`);
  revalidatePath("/search");
  return { success: true };
}

export async function deleteBrandPriceItemAction(
  brandId: number,
  itemId: string,
  _formData: FormData,
): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    console.debug("[deleteBrandPriceItemAction] called", { brandId, itemId });
  }

  if (!Number.isInteger(brandId) || brandId <= 0) {
    return;
  }

  const id = (itemId ?? "").trim();
  if (!id) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("brand_price_items")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.debug("[deleteBrandPriceItemAction] delete failed", {
        brandId,
        itemId: id,
        message: error.message,
      });
    }
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[deleteBrandPriceItemAction] delete ok", { brandId, itemId: id });
  }

  await writeAdminAuditLog({
    action: "status_change",
    targetTable: "brand_price_items",
    targetId: id,
    summary: "브랜드 가격 항목 삭제",
    afterData: { brand_id: brandId },
  });

  revalidatePath(`/admin/brands/${brandId}/edit`);
  revalidatePath("/search");
}
