import {
  getBrandDiscountCountBadgeVariant,
  type BrandDiscountCountBadgeVariant,
} from "@/lib/admin/brand-discount-counts";

const VARIANT_CLASS: Record<BrandDiscountCountBadgeVariant, string> = {
  zero: "badge text-bg-secondary",
  few: "badge text-bg-warning",
  many: "badge text-bg-primary",
};

export function BrandDiscountCountBadge({ count }: { count: number }) {
  const variant = getBrandDiscountCountBadgeVariant(count);

  return <span className={VARIANT_CLASS[variant]}>{count}건</span>;
}
