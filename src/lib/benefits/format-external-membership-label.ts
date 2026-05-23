const REDUNDANT_PRODUCT_SUFFIXES = [
  "전 매장",
  "전체",
  "공통",
  "기본",
  "일반",
  "default",
  "all",
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Compare labels ignoring whitespace/case differences. */
export function normalizeBenefitLabelKey(text: string): string {
  return text.trim().replace(/\s+/g, "").toLowerCase();
}

function stripRedundantProductSuffix(name: string): {
  base: string;
  stripped: boolean;
} {
  const trimmed = name.trim();

  for (const suffix of REDUNDANT_PRODUCT_SUFFIXES) {
    const endPattern = new RegExp(`\\s*${escapeRegExp(suffix)}\\s*$`, "i");
    if (!endPattern.test(trimmed)) {
      continue;
    }

    const base = trimmed.replace(endPattern, "").trim();
    return { base, stripped: true };
  }

  return { base: trimmed, stripped: false };
}

function isRedundantProductLabel(providerName: string, productName: string): boolean {
  const { base: productBase } = stripRedundantProductSuffix(productName);

  return (
    normalizeBenefitLabelKey(productBase) === normalizeBenefitLabelKey(providerName) ||
    normalizeBenefitLabelKey(productName) === normalizeBenefitLabelKey(providerName)
  );
}

/** Display label for external membership/point select options and chips. */
export function formatExternalMembershipOptionLabel(input: {
  providerName?: string | null;
  name: string;
}): string {
  const providerName = input.providerName?.trim() ?? "";
  const rawProductName = input.name.trim();

  if (!rawProductName) {
    return providerName;
  }

  if (!providerName) {
    const { base, stripped } = stripRedundantProductSuffix(rawProductName);
    return stripped && base ? base : rawProductName;
  }

  if (isRedundantProductLabel(providerName, rawProductName)) {
    return providerName;
  }

  const { base: productBase, stripped } = stripRedundantProductSuffix(rawProductName);
  const displayProductName =
    stripped && productBase ? productBase : rawProductName;

  return `${providerName} · ${displayProductName}`;
}

export function isRedundantExternalMembershipSuffix(name: string): boolean {
  return stripRedundantProductSuffix(name).stripped;
}
