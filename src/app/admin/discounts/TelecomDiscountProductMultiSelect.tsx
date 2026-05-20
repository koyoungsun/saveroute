"use client";

import { useMemo, useState } from "react";

import { formatBenefitProductOptionLabel } from "@/lib/benefits/format-product-label";
import {
  buildDiscountProductSelectGroups,
  isProviderWideBenefitProduct,
  type DiscountBenefitProductOption,
} from "@/lib/benefits/discount-product-options";

type TelecomDiscountProductMultiSelectProps = {
  products: DiscountBenefitProductOption[];
  defaultSelectedIds?: number[];
  disabled?: boolean;
  fieldError?: string;
};

export function TelecomDiscountProductMultiSelect({
  products,
  defaultSelectedIds = [],
  disabled,
  fieldError,
}: TelecomDiscountProductMultiSelectProps) {
  const groups = useMemo(
    () => buildDiscountProductSelectGroups(products, "telecom"),
    [products],
  );

  const initialAllId =
    defaultSelectedIds.find((id) =>
      groups.allProducts.some((product) => product.id === id),
    ) ?? null;
  const initialTierIds = defaultSelectedIds.filter((id) =>
    groups.tierProducts.some((product) => product.id === id),
  );

  const [selectedAllId, setSelectedAllId] = useState<number | null>(initialAllId);
  const [selectedTierIds, setSelectedTierIds] = useState<number[]>(initialTierIds);

  const selectedIds =
    selectedAllId != null ? [selectedAllId] : selectedTierIds;

  const toggleAll = (productId: number, checked: boolean) => {
    if (!checked) {
      setSelectedAllId(null);
      return;
    }

    setSelectedAllId(productId);
    setSelectedTierIds([]);
  };

  const toggleTier = (productId: number, checked: boolean) => {
    setSelectedAllId(null);
    setSelectedTierIds((current) => {
      if (checked) {
        return current.includes(productId) ? current : [...current, productId];
      }
      return current.filter((id) => id !== productId);
    });
  };

  return (
    <div>
      <fieldset disabled={disabled} className="border rounded-3 p-3 mb-0 sr-admin-discounts-telecom-fieldset">
        <legend className="sr-discounts-group-title sr-discounts-group-title--sub mb-2">
          혜택상품 (복수 선택)
        </legend>

        <div className="mb-3">
          <div className="small text-muted fw-semibold mb-2">전체 (등급 무관)</div>
          {groups.allProducts.length === 0 ? (
            <div className="small text-muted">등록된 전체 상품이 없습니다.</div>
          ) : (
            groups.allProducts.map((product) => (
              <div key={product.id} className="form-check">
                <input
                  id={`telecom-all-${product.id}`}
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedAllId === product.id}
                  onChange={(event) => toggleAll(product.id, event.target.checked)}
                />
                <label
                  htmlFor={`telecom-all-${product.id}`}
                  className="form-check-label"
                >
                  {formatBenefitProductOptionLabel(product)}
                </label>
              </div>
            ))
          )}
        </div>

        <div>
          <div className="small text-muted fw-semibold mb-2">등급별</div>
          {groups.tierProducts.length === 0 ? (
            <div className="small text-muted">등록된 등급별 상품이 없습니다.</div>
          ) : (
            groups.tierProducts.map((product) => (
              <div key={product.id} className="form-check">
                <input
                  id={`telecom-tier-${product.id}`}
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedTierIds.includes(product.id)}
                  disabled={selectedAllId != null}
                  onChange={(event) => toggleTier(product.id, event.target.checked)}
                />
                <label
                  htmlFor={`telecom-tier-${product.id}`}
                  className="form-check-label"
                >
                  {product.grade
                    ? `${product.grade} — ${formatBenefitProductOptionLabel(product)}`
                    : formatBenefitProductOptionLabel(product)}
                </label>
              </div>
            ))
          )}
        </div>
      </fieldset>

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="benefit_product_ids" value={id} />
      ))}

      {fieldError ? (
        <div className="sr-discounts-field__error form-text mb-0">{fieldError}</div>
      ) : (
        <div className="sr-discounts-field__hint form-text mb-0">
          전체를 선택하면 모든 등급 회원에게, 등급별 복수 선택 시 해당 등급 회원에게만
          매칭됩니다. 전체와 등급별은 동시에 선택할 수 없습니다.
        </div>
      )}
    </div>
  );
}

export function isTelecomMultiProductSelection(
  categoryCode: string | null,
  selectedIds: number[],
  products: DiscountBenefitProductOption[],
): boolean {
  if (categoryCode !== "telecom" || selectedIds.length === 0) {
    return false;
  }

  if (selectedIds.length > 1) {
    return true;
  }

  const onlyId = selectedIds[0]!;
  const product = products.find((row) => row.id === onlyId);
  return product ? !isProviderWideBenefitProduct(product) : false;
}
