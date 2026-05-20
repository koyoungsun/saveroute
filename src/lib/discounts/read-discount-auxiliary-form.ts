import {
  isApplyBasis,
  isStackablePolicy,
  isUsageChannel,
  readOptionalEnumField,
} from "@/lib/discounts/discount-detail-fields";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function readDiscountAuxiliaryFields(formData: FormData) {
  return {
    apply_basis: readOptionalEnumField(
      readString(formData, "apply_basis"),
      isApplyBasis,
    ),
    stackable_policy: readOptionalEnumField(
      readString(formData, "stackable_policy"),
      isStackablePolicy,
    ),
    usage_channel: readOptionalEnumField(
      readString(formData, "usage_channel"),
      isUsageChannel,
    ),
    condition_text: readString(formData, "condition_text") || null,
    notice_text: readString(formData, "notice_text") || null,
  };
}
