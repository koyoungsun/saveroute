import type { DiscountBenefitProductOption } from "@/lib/benefits/discount-product-options";

import { CardBenefitProductCombobox } from "./CardBenefitProductCombobox";
import { DiscountBenefitProductSelect } from "./DiscountBenefitProductSelect";
import { DiscountFormField } from "./DiscountFormField";
import { TelecomDiscountProductMultiSelect } from "./TelecomDiscountProductMultiSelect";

type BenefitCategoryOption = {
  id: number;
  name: string;
  code: string;
};

type ProviderOption = {
  id: number;
  name: string;
  benefit_category_id: number;
};

export function DiscountBenefitInfoGroup({
  categories,
  filteredProviders,
  filteredProducts,
  selectedCategoryId,
  selectedProviderId,
  selectedCategoryCode,
  cardCategoryId,
  selectedProviderName,
  selectedBenefitProductIds,
  defaultBenefitProductIds,
  defaultBenefitProductId,
  onCategoryChange,
  onProviderChange,
  onChangeSelectedIds,
  onProductUpsert,
  fieldErrors,
}: {
  categories: BenefitCategoryOption[];
  filteredProviders: ProviderOption[];
  filteredProducts: DiscountBenefitProductOption[];
  selectedCategoryId: string;
  selectedProviderId: string;
  selectedCategoryCode: string | null;
  cardCategoryId: number | null;
  selectedProviderName: string;
  selectedBenefitProductIds: number[];
  defaultBenefitProductIds?: number[];
  defaultBenefitProductId?: number | null;
  onCategoryChange: (categoryId: string) => void;
  onProviderChange: (providerId: string) => void;
  onChangeSelectedIds: (ids: number[]) => void;
  onProductUpsert: (product: DiscountBenefitProductOption) => void;
  fieldErrors?: {
    benefit_category_id?: string;
    provider_id?: string;
    benefit_product_id?: string;
  };
}) {
  const benefitProductHint =
    selectedCategoryCode === "card"
      ? "카드사 전체·특정 카드를 복수 선택할 수 있습니다. 검색 후 선택 목록에 추가하거나 신규 카드를 등록할 수 있습니다."
      : selectedCategoryCode !== "telecom"
        ? "카드/통신사/멤버십 상품별 할인인 경우에만 선택합니다."
        : undefined;

  return (
    <fieldset className="sr-discounts-benefit-group">
      <legend className="sr-discounts-group-title">혜택 정보</legend>

      <div className="sr-discounts-benefit-group__category-provider">
        <DiscountFormField
          label="혜택 카테고리"
          htmlFor="benefit_category_id"
          required
          error={fieldErrors?.benefit_category_id}
        >
          <select
            id="benefit_category_id"
            name="benefit_category_id"
            className="form-select"
            value={selectedCategoryId}
            onChange={(event) => onCategoryChange(event.target.value)}
            required
          >
            <option value="" disabled>
              카테고리 선택
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </DiscountFormField>

        <DiscountFormField
          label="제공사"
          htmlFor="provider_id"
          required
          error={fieldErrors?.provider_id}
        >
          <select
            id="provider_id"
            name="provider_id"
            className="form-select"
            value={selectedProviderId}
            onChange={(event) => onProviderChange(event.target.value)}
            required
          >
            <option value="" disabled>
              제공사 선택
            </option>
            {filteredProviders.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </select>
        </DiscountFormField>
      </div>

      <div className="sr-discounts-benefit-group__product">
        <DiscountFormField
          label="혜택상품"
          htmlFor="benefit_product_id"
          required
          stack
          hint={benefitProductHint}
          error={
            selectedCategoryCode !== "telecom" && selectedCategoryCode !== "card"
              ? fieldErrors?.benefit_product_id
              : undefined
          }
        >
          {selectedCategoryCode === "telecom" ? (
            <TelecomDiscountProductMultiSelect
              products={filteredProducts}
              defaultSelectedIds={defaultBenefitProductIds}
              disabled={!selectedProviderId}
              fieldError={fieldErrors?.benefit_product_id}
            />
          ) : selectedCategoryCode === "card" && cardCategoryId != null ? (
            <CardBenefitProductCombobox
              products={filteredProducts}
              providerId={selectedProviderId ? Number(selectedProviderId) : null}
              cardCategoryId={cardCategoryId}
              providerName={selectedProviderName}
              selectedIds={selectedBenefitProductIds}
              onChangeSelectedIds={onChangeSelectedIds}
              onProductUpsert={onProductUpsert}
              disabled={!selectedProviderId}
              emptyHint={
                selectedProviderId ? "브랜드 직접 할인 / 상품 없음" : undefined
              }
              fieldError={fieldErrors?.benefit_product_id}
            />
          ) : (
            <DiscountBenefitProductSelect
              categoryCode={selectedCategoryCode}
              products={filteredProducts}
              defaultValue={defaultBenefitProductId}
              disabled={!selectedProviderId}
              emptyHint={
                selectedProviderId ? "브랜드 직접 할인 / 상품 없음" : undefined
              }
            />
          )}
        </DiscountFormField>
      </div>
    </fieldset>
  );
}
