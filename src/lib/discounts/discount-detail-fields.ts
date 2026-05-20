export type ApplyBasis = "order" | "person" | "table" | "menu";
export type StackablePolicy = "stackable" | "not_stackable" | "partial";
export type UsageChannel = "offline" | "online" | "app" | "phone" | "all";

export const APPLY_BASIS_OPTIONS = [
  { value: "order", label: "결제 건당" },
  { value: "person", label: "1인당" },
  { value: "table", label: "테이블당" },
  { value: "menu", label: "메뉴당" },
] as const satisfies ReadonlyArray<{ value: ApplyBasis; label: string }>;

export const STACKABLE_POLICY_OPTIONS = [
  { value: "stackable", label: "중복 가능" },
  { value: "not_stackable", label: "중복 불가" },
  { value: "partial", label: "일부 가능" },
] as const satisfies ReadonlyArray<{ value: StackablePolicy; label: string }>;

export const USAGE_CHANNEL_OPTIONS = [
  { value: "offline", label: "현장" },
  { value: "online", label: "온라인" },
  { value: "app", label: "앱" },
  { value: "phone", label: "전화예약" },
  { value: "all", label: "전체" },
] as const satisfies ReadonlyArray<{ value: UsageChannel; label: string }>;

const APPLY_BASIS_LABELS = Object.fromEntries(
  APPLY_BASIS_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ApplyBasis, string>;

const STACKABLE_POLICY_LABELS = Object.fromEntries(
  STACKABLE_POLICY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<StackablePolicy, string>;

const USAGE_CHANNEL_LABELS = Object.fromEntries(
  USAGE_CHANNEL_OPTIONS.map((option) => [option.value, option.label]),
) as Record<UsageChannel, string>;

export function formatApplyBasisLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return APPLY_BASIS_LABELS[value as ApplyBasis] ?? null;
}

export function formatStackablePolicyLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  return STACKABLE_POLICY_LABELS[value as StackablePolicy] ?? null;
}

export function formatUsageChannelLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return USAGE_CHANNEL_LABELS[value as UsageChannel] ?? null;
}

export function isApplyBasis(value: string): value is ApplyBasis {
  return APPLY_BASIS_OPTIONS.some((option) => option.value === value);
}

export function isStackablePolicy(value: string): value is StackablePolicy {
  return STACKABLE_POLICY_OPTIONS.some((option) => option.value === value);
}

export function isUsageChannel(value: string): value is UsageChannel {
  return USAGE_CHANNEL_OPTIONS.some((option) => option.value === value);
}

export function readOptionalEnumField<T extends string>(
  value: string,
  isValid: (candidate: string) => candidate is T,
): T | null {
  if (!value) {
    return null;
  }
  return isValid(value) ? value : null;
}

export function buildDiscountMetaSummary(input: {
  apply_basis?: string | null;
  stackable_policy?: string | null;
  usage_channel?: string | null;
}): string[] {
  const parts = [
    formatApplyBasisLabel(input.apply_basis),
    formatStackablePolicyLabel(input.stackable_policy),
    formatUsageChannelLabel(input.usage_channel),
  ].filter((part): part is string => Boolean(part));

  return parts;
}

export function truncateText(value: string | null | undefined, maxLength = 48): string {
  if (!value) {
    return "-";
  }
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength)}…`;
}
