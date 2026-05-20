export type DiscountBenefitProductLinkRow = {
  discount_id: number;
  benefit_product_id: number;
};

export type BenefitProductMatchMeta = {
  id: number;
  benefit_type: string | null;
  is_all_product: boolean;
};

function isAllProductMetaLocal(
  product: BenefitProductMatchMeta | undefined,
): boolean {
  if (!product) return false;
  return product.is_all_product === true || product.benefit_type === "all";
}

export function readBenefitProductIdsFromFormData(formData: FormData): number[] {
  const multiValues = formData
    .getAll("benefit_product_ids")
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (multiValues.length > 0) {
    return [...new Set(multiValues)];
  }

  const singleValue = formData.get("benefit_product_id");
  if (typeof singleValue !== "string" || !singleValue.trim()) {
    return [];
  }

  const parsed = Number(singleValue.trim());
  return Number.isInteger(parsed) && parsed > 0 ? [parsed] : [];
}

export function normalizeTelecomBenefitProductIds(
  productIds: number[],
  productById: Map<number, BenefitProductMatchMeta>,
): number[] {
  const uniqueIds = [...new Set(productIds)];
  if (uniqueIds.length === 0) {
    return [];
  }

  const allProductIds = uniqueIds.filter((id) =>
    isAllProductMetaLocal(productById.get(id)),
  );

  if (allProductIds.length > 0) {
    return [allProductIds[0]!];
  }

  return uniqueIds;
}

export function resolvePrimaryBenefitProductId(productIds: number[]): number | null {
  return productIds.length > 0 ? productIds[0]! : null;
}

export function groupBenefitProductIdsByDiscount(
  rows: DiscountBenefitProductLinkRow[],
): Map<number, number[]> {
  const grouped = new Map<number, number[]>();

  for (const row of rows) {
    const existing = grouped.get(row.discount_id) ?? [];
    existing.push(row.benefit_product_id);
    grouped.set(row.discount_id, existing);
  }

  return grouped;
}

export function resolveDiscountBenefitProductIds(
  discount: {
    benefit_product_id: number | null;
    benefit_product_ids?: number[] | null;
  },
  junctionIds?: number[] | null,
): number[] | null {
  const linkedIds =
    junctionIds && junctionIds.length > 0
      ? junctionIds
      : discount.benefit_product_ids && discount.benefit_product_ids.length > 0
        ? discount.benefit_product_ids
        : null;

  if (linkedIds && linkedIds.length > 0) {
    return linkedIds;
  }

  if (discount.benefit_product_id != null) {
    return [discount.benefit_product_id];
  }

  return null;
}

export function collectUniqueBenefitProductIds(
  discounts: Array<{
    benefit_product_id: number | null;
    benefit_product_ids?: number[] | null;
  }>,
): number[] {
  const ids = new Set<number>();

  for (const discount of discounts) {
    const linked = resolveDiscountBenefitProductIds(discount);
    if (linked) {
      for (const id of linked) {
        ids.add(id);
      }
    }
  }

  return [...ids];
}

export function attachBenefitProductIdsToDiscounts<
  T extends { id: number; benefit_product_id: number | null },
>(
  discounts: T[],
  linkedProductIdsByDiscount: Map<number, number[]>,
): Array<T & { benefit_product_ids: number[] | null }> {
  return discounts.map((discount) => {
    const junctionIds = linkedProductIdsByDiscount.get(discount.id) ?? [];
    return {
      ...discount,
      benefit_product_ids:
        junctionIds.length > 0
          ? junctionIds
          : discount.benefit_product_id != null
            ? [discount.benefit_product_id]
            : null,
    };
  });
}
