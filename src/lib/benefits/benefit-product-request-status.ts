export const BENEFIT_PRODUCT_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export type BenefitProductRequestStatus = (typeof BENEFIT_PRODUCT_REQUEST_STATUSES)[number];

export function isBenefitProductRequestStatus(
  value: string,
): value is BenefitProductRequestStatus {
  return BENEFIT_PRODUCT_REQUEST_STATUSES.includes(value as BenefitProductRequestStatus);
}

export const USER_BENEFIT_APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;

export type UserBenefitApprovalStatus = (typeof USER_BENEFIT_APPROVAL_STATUSES)[number];

export function isUserBenefitEligibleForMatching(row: {
  benefit_product_id: number | null;
  approval_status?: string | null;
}): boolean {
  const status = row.approval_status ?? null;
  if (status === "pending" || status === "rejected") {
    return false;
  }
  return row.benefit_product_id != null;
}
