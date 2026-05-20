/** Admin·등록 UI용 benefit_products 표시명 */
export function formatBenefitProductOptionLabel(product: {
  name: string;
  benefit_type?: string | null;
  is_all_product?: boolean;
  product_type?: string | null;
}): string {
  if (product.is_all_product || product.benefit_type === "all") {
    if (product.product_type === "telecom_membership") {
      return `${product.name} [통신사 전체 · 등급 무관]`;
    }
    return `${product.name} [카드사 전체]`;
  }

  const bt = product.benefit_type;
  if (bt === "credit") return `${product.name} (신용)`;
  if (bt === "debit") return `${product.name} (체크)`;
  if (bt === "prepaid") return `${product.name} (선불)`;
  return product.name;
}

export function formatUserBenefitTypeLabel(
  benefitType: string | null | undefined,
): string | null {
  if (benefitType === "credit") return "신용";
  if (benefitType === "debit") return "체크";
  if (benefitType === "prepaid") return "선불";
  if (benefitType === "all") return "전체";
  return null;
}
