"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  resolveCategoryCode,
  type DiscountBenefitProductOption,
} from "@/lib/benefits/discount-product-options";

import { DiscountValueFields } from "@/components/admin/DiscountValueFields";
import { MoneyInput } from "@/components/admin/MoneyInput";

import { DiscountBenefitInfoGroup } from "../DiscountBenefitInfoGroup";
import { DiscountConditionDetailFields } from "../DiscountConditionDetailFields";
import { DiscountFormField } from "../DiscountFormField";
import { DiscountFormOptionGroup } from "../DiscountFormOptionGroup";
import { DiscountFormRow } from "../DiscountFormRow";
import { DiscountNoticeFields } from "../DiscountNoticeFields";
import { DiscountVisibilityFields } from "../DiscountVisibilityFields";
import { createDiscountAction, type DiscountFormState } from "./actions";

type BrandOption = {
  id: number;
  name: string;
  slug: string;
};

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

type BenefitProductOption = DiscountBenefitProductOption;

const initialState: DiscountFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary sr-discounts-submit-btn" disabled={pending}>
      {pending ? "등록 중..." : "할인 등록"}
    </button>
  );
}

export function DiscountForm({
  brands,
  categories,
  providers,
  products,
}: {
  brands: BrandOption[];
  categories: BenefitCategoryOption[];
  providers: ProviderOption[];
  products: BenefitProductOption[];
}) {
  const [state, formAction] = useActionState(createDiscountAction, initialState);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [productOptions, setProductOptions] = useState(products);
  const [selectedBenefitProductIds, setSelectedBenefitProductIds] = useState<number[]>([]);
  const [discountType, setDiscountType] = useState("percent");

  const filteredProviders = useMemo(
    () =>
      selectedCategoryId
        ? providers.filter(
            (provider) =>
              provider.benefit_category_id === Number(selectedCategoryId),
          )
        : providers,
    [providers, selectedCategoryId],
  );

  const selectedCategoryCode = resolveCategoryCode(selectedCategoryId, categories);
  const cardCategoryId =
    categories.find((category) => category.code === "card")?.id ?? null;

  const filteredProducts = useMemo(
    () =>
      productOptions.filter((product) => {
        if (selectedProviderId) {
          return product.provider_id === Number(selectedProviderId);
        }

        if (selectedCategoryId) {
          return product.benefit_category_id === Number(selectedCategoryId);
        }

        return true;
      }),
    [productOptions, selectedCategoryId, selectedProviderId],
  );

  const selectedProviderName =
    filteredProviders.find((provider) => provider.id === Number(selectedProviderId))
      ?.name ?? "";

  const handleProductUpsert = (product: BenefitProductOption) => {
    setProductOptions((current) => {
      if (current.some((row) => row.id === product.id)) {
        return current.map((row) => (row.id === product.id ? product : row));
      }
      return [...current, product];
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedProviderId("");
    setSelectedBenefitProductIds([]);
  };

  const handleProviderChange = (providerId: string) => {
    setSelectedProviderId(providerId);
    setSelectedBenefitProductIds([]);
  };

  return (
    <form action={formAction} className="card sr-block sr-admin-discounts-form">
      <div className="card-body">
        {state.message ? (
          <div className="alert alert-danger" role="alert">
            {state.message}
          </div>
        ) : null}

        <div className="sr-discounts-form-fields">
          <DiscountFormRow>
            <div className="sr-discounts-brand-title-row">
              <DiscountFormField
                label="브랜드"
                htmlFor="brand_id"
                required
                error={state.fieldErrors?.brand_id}
              >
                <select
                  id="brand_id"
                  name="brand_id"
                  className="form-select"
                  defaultValue=""
                  required
                >
                  <option value="" disabled>
                    브랜드 선택
                  </option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} ({brand.slug})
                    </option>
                  ))}
                </select>
              </DiscountFormField>

              <DiscountFormField
                label="할인 제목"
                htmlFor="title"
                required
                error={state.fieldErrors?.title}
              >
                <input
                  id="title"
                  name="title"
                  className="form-control"
                  placeholder="예: VIP 20% 할인"
                  required
                />
              </DiscountFormField>
            </div>
          </DiscountFormRow>

          <DiscountFormRow>
            <DiscountBenefitInfoGroup
              categories={categories}
              filteredProviders={filteredProviders}
              filteredProducts={filteredProducts}
              selectedCategoryId={selectedCategoryId}
              selectedProviderId={selectedProviderId}
              selectedCategoryCode={selectedCategoryCode}
              cardCategoryId={cardCategoryId}
              selectedProviderName={selectedProviderName}
              selectedBenefitProductIds={selectedBenefitProductIds}
              onCategoryChange={handleCategoryChange}
              onProviderChange={handleProviderChange}
              onChangeSelectedIds={setSelectedBenefitProductIds}
              onProductUpsert={handleProductUpsert}
              fieldErrors={state.fieldErrors}
            />
          </DiscountFormRow>

          <DiscountFormRow>
            <div className="sr-discounts-form-section">
              <p className="sr-discounts-group-title mb-2">할인 정보</p>
              <div className="sr-discounts-form-fields sr-discounts-discount-info-fields">
                <DiscountFormField
                    label="할인 유형"
                  htmlFor="discount_type"
                  required
                  className="sr-discounts-field--discount-type"
                  error={state.fieldErrors?.discount_type}
                  >
                    <select
                      id="discount_type"
                      name="discount_type"
                      className="form-select"
                      value={discountType}
                      onChange={(event) => setDiscountType(event.target.value)}
                      required
                    >
                      <option value="percent">percent</option>
                      <option value="won">won</option>
                      <option value="special_price">special_price</option>
                      <option value="free">free</option>
                      <option value="unknown">unknown</option>
                    </select>
                  </DiscountFormField>

                  <DiscountFormField
                    label="할인값"
                  htmlFor="discount_value"
                  required
                  className="sr-discounts-field--discount-value"
                  error={
                      state.fieldErrors?.discount_value &&
                      !state.fieldErrors?.discount_value_max
                        ? state.fieldErrors.discount_value
                        : undefined
                    }
                  >
                    <DiscountValueFields
                      unit={discountType}
                      required={discountType !== "free"}
                      valueError={state.fieldErrors?.discount_value}
                      valueMaxError={state.fieldErrors?.discount_value_max}
                    />
                  </DiscountFormField>

                <div className="sr-discounts-compact-row">
                  <DiscountFormField
                    label="최대 할인 한도 금액"
                    htmlFor="max_discount_amount"
                    hint="할인율/할인값 범위와 별개 · 실제 적용되는 할인 상한 금액"
                  >
                    <MoneyInput
                      id="max_discount_amount"
                      name="max_discount_amount"
                      placeholder="예: 10,000"
                    />
                  </DiscountFormField>

                  <DiscountFormField label="최소 결제 금액" htmlFor="min_payment_amount">
                    <MoneyInput
                      id="min_payment_amount"
                      name="min_payment_amount"
                      placeholder="예: 30,000"
                    />
                  </DiscountFormField>
                </div>
              </div>
            </div>
          </DiscountFormRow>

          <DiscountFormRow>
            <DiscountConditionDetailFields />
          </DiscountFormRow>

          <DiscountFormRow>
            <DiscountVisibilityFields mode="create" />
          </DiscountFormRow>

          <DiscountFormRow className="sr-discounts-form-row--last">
            <p className="sr-discounts-group-title mb-2">추가 옵션</p>

            <div className="sr-discounts-form-fields">
              <DiscountFormOptionGroup group="notice" label="주의사항 입력">
                <DiscountNoticeFields />
              </DiscountFormOptionGroup>

              <DiscountFormOptionGroup group="period" label="기간 설정">
                <div className="col-12 sr-discounts-period-row">
                  <DiscountFormField label="시작일" htmlFor="start_date">
                    <input
                      id="start_date"
                      name="start_date"
                      className="form-control"
                      type="date"
                    />
                  </DiscountFormField>

                  <DiscountFormField
                    label="종료일"
                    htmlFor="end_date"
                    error={state.fieldErrors?.end_date}
                  >
                    <input
                      id="end_date"
                      name="end_date"
                      className="form-control"
                      type="date"
                    />
                  </DiscountFormField>
                </div>
              </DiscountFormOptionGroup>

              <DiscountFormOptionGroup group="data" label="데이터 관리">
                <div className="col-12">
                  <DiscountFormField
                    label="공식 URL"
                    htmlFor="source_url"
                    error={state.fieldErrors?.source_url}
                  >
                    <input
                      id="source_url"
                      name="source_url"
                      className="form-control"
                      placeholder="https://example.com"
                      type="url"
                    />
                  </DiscountFormField>
                </div>

                <div className="col-12">
                  <DiscountFormField label="관리자 메모" htmlFor="admin_memo" stack>
                    <textarea
                      id="admin_memo"
                      name="admin_memo"
                      className="form-control"
                      rows={3}
                      placeholder="내부 확인용 메모 (사용자에게 노출되지 않음)"
                    />
                  </DiscountFormField>
                </div>
              </DiscountFormOptionGroup>
            </div>
          </DiscountFormRow>
        </div>
      </div>

      <div className="card-footer sr-discounts-form-footer">
        <a href="/admin/discounts" className="btn btn-outline-secondary sr-discounts-cancel-btn">
          취소
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}
