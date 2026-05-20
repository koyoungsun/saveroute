import { isDiscountOptionGroupEnabled } from "@/lib/admin/discount-form-option-groups";
import { readDiscountAuxiliaryFields } from "@/lib/discounts/read-discount-auxiliary-form";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export type DiscountExistingOptionValues = {
  valid_from: string | null;
  valid_until: string | null;
  has_no_expiry: boolean;
  condition_text: string | null;
  apply_basis: string | null;
  stackable_policy: string | null;
  usage_channel: string | null;
  installment_condition: string | null;
  notice_text: string | null;
  source_url: string | null;
  admin_memo: string | null;
  status: string;
};

export function readDiscountPeriodFields(
  formData: FormData,
  mode: "create" | "edit",
  existing?: DiscountExistingOptionValues,
) {
  const enabled = isDiscountOptionGroupEnabled(formData, "period");
  const validFrom = readString(formData, mode === "create" ? "start_date" : "valid_from");
  const validUntil = readString(formData, mode === "create" ? "end_date" : "valid_until");

  if (mode === "create") {
    if (!enabled) {
      return {
        valid_from: null as string | null,
        valid_until: null as string | null,
        has_no_expiry: true,
      };
    }

    return {
      valid_from: validFrom || null,
      valid_until: validUntil || null,
      has_no_expiry: !validUntil,
    };
  }

  if (!existing) {
    throw new Error("Existing discount values are required for edit mode.");
  }

  if (!enabled) {
    return {
      valid_from: existing.valid_from,
      valid_until: existing.valid_until,
      has_no_expiry: existing.has_no_expiry,
    };
  }

  return {
    valid_from: validFrom || null,
    valid_until: validUntil || null,
    has_no_expiry: !validUntil,
  };
}

export function readDiscountConditionFields(formData: FormData) {
  const auxiliaryFields = readDiscountAuxiliaryFields(formData);
  const installmentCondition = readString(formData, "installment_condition");

  return {
    condition_text: auxiliaryFields.condition_text,
    apply_basis: auxiliaryFields.apply_basis,
    stackable_policy: auxiliaryFields.stackable_policy,
    usage_channel: auxiliaryFields.usage_channel,
    installment_condition: installmentCondition || null,
  };
}

export function readDiscountNoticeFields(
  formData: FormData,
  mode: "create" | "edit",
  existing?: DiscountExistingOptionValues,
) {
  const enabled = isDiscountOptionGroupEnabled(formData, "notice");
  const noticeText = readString(formData, "notice_text");

  if (mode === "create") {
    return {
      notice_text: enabled ? noticeText || null : null,
    };
  }

  if (!existing) {
    throw new Error("Existing discount values are required for edit mode.");
  }

  if (!enabled) {
    return {
      notice_text: existing.notice_text,
    };
  }

  return {
    notice_text: noticeText || null,
  };
}

export function readDiscountDataManagementFields(
  formData: FormData,
  mode: "create" | "edit",
  existing?: DiscountExistingOptionValues,
) {
  const enabled = isDiscountOptionGroupEnabled(formData, "data");
  const sourceUrlValue = readString(formData, "source_url");
  const adminMemo = readString(formData, "admin_memo");

  if (mode === "create") {
    if (!enabled) {
      return {
        source_url: null as string | null,
        admin_memo: null as string | null,
        source_url_raw: "",
      };
    }

    return {
      source_url: sourceUrlValue || null,
      admin_memo: adminMemo || null,
      source_url_raw: sourceUrlValue,
    };
  }

  if (!existing) {
    throw new Error("Existing discount values are required for edit mode.");
  }

  if (!enabled) {
    return {
      source_url: existing.source_url,
      admin_memo: existing.admin_memo,
      source_url_raw: existing.source_url ?? "",
    };
  }

  return {
    source_url: sourceUrlValue || null,
    admin_memo: adminMemo || null,
    source_url_raw: sourceUrlValue,
  };
}

export function readDiscountVisibilityFields(
  formData: FormData,
  mode: "create" | "edit",
  existing?: DiscountExistingOptionValues,
) {
  const enabled = isDiscountOptionGroupEnabled(formData, "visibility");

  if (mode === "create") {
    if (!enabled) {
      return { status: "active" as const };
    }

    return {
      status: formData.get("is_active") === "on" ? ("active" as const) : ("hidden" as const),
    };
  }

  if (!existing) {
    throw new Error("Existing discount values are required for edit mode.");
  }

  if (!enabled) {
    return { status: existing.status };
  }

  const statusValue = readString(formData, "status");
  return { status: statusValue || existing.status };
}
