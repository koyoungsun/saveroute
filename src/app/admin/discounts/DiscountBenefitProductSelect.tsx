"use client";

import { formatBenefitProductOptionLabel } from "@/lib/benefits/format-product-label";
import {
  buildDiscountProductSelectGroups,
  type DiscountBenefitProductOption,
} from "@/lib/benefits/discount-product-options";

type DiscountBenefitProductSelectProps = {
  id?: string;
  name?: string;
  categoryCode: string | null;
  products: DiscountBenefitProductOption[];
  defaultValue?: string | number | null;
  disabled?: boolean;
  emptyHint?: string;
};

export function DiscountBenefitProductSelect({
  id = "benefit_product_id",
  name = "benefit_product_id",
  categoryCode,
  products,
  defaultValue,
  disabled,
  emptyHint,
}: DiscountBenefitProductSelectProps) {
  const groups = buildDiscountProductSelectGroups(products, categoryCode);

  return (
    <select
      id={id}
      name={name}
      className="form-select"
      defaultValue={defaultValue == null ? "" : String(defaultValue)}
      disabled={disabled}
    >
      <option value="">
        {disabled
          ? "제공사 선택 후 선택 가능"
          : emptyHint ?? "브랜드 직접 할인 / 상품 없음"}
      </option>
      {groups.useOptGroups ? (
        <>
          <optgroup label="전체 (등급 무관)">
            {groups.allProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {formatBenefitProductOptionLabel(product)}
              </option>
            ))}
          </optgroup>
          <optgroup label="등급별">
            {groups.tierProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.grade
                  ? `${product.grade} — ${formatBenefitProductOptionLabel(product)}`
                  : formatBenefitProductOptionLabel(product)}
              </option>
            ))}
          </optgroup>
        </>
      ) : (
        groups.products.map((product) => (
          <option key={product.id} value={product.id}>
            {formatBenefitProductOptionLabel(product)}
          </option>
        ))
      )}
    </select>
  );
}
