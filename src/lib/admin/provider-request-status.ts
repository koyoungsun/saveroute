export const PROVIDER_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;

export type ProviderRequestStatus = (typeof PROVIDER_REQUEST_STATUSES)[number];

export function isProviderRequestStatus(value: string): value is ProviderRequestStatus {
  return PROVIDER_REQUEST_STATUSES.includes(value as ProviderRequestStatus);
}
