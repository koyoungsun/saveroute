/** benefit_categories.code 는 유지하고 화면 표시명만 보정합니다. */
export function formatBenefitCategoryDisplayName(
  code: string | null | undefined,
  name?: string | null,
): string {
  if (code === "membership") {
    return "멤버십/포인트";
  }

  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "-";
}
