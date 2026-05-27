"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  resolveCategoryCode,
  type DiscountBenefitProductOption,
} from "@/lib/benefits/discount-product-options";

import { DiscountValueFields } from "@/components/admin/DiscountValueFields";
import { MoneyInput } from "@/components/admin/MoneyInput";

import { AdminDiscountUnitSelect } from "../../AdminDiscountUnitSelect";

import { DiscountBenefitInfoGroup } from "../../DiscountBenefitInfoGroup";
import { DiscountConditionDetailFields } from "../../DiscountConditionDetailFields";
import { DiscountFormField } from "../../DiscountFormField";
import { DiscountFormOptionGroup } from "../../DiscountFormOptionGroup";
import { DiscountFormRow } from "../../DiscountFormRow";
import { DiscountNoticeFields } from "../../DiscountNoticeFields";
import { DiscountVisibilityFields } from "../../DiscountVisibilityFields";
import { getDiscountFormDefaultOpenGroups } from "@/lib/admin/discount-form-option-groups";
import { updateDiscountAction, type DiscountEditFormState } from "./actions";

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

export type DiscountEditValues = {
  id: number;
  brand_id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  benefit_product_ids?: number[];
  title: string;
  condition_text: string | null;
  apply_basis: string | null;
  stackable_policy: string | null;
  usage_channel: string | null;
  notice_text: string | null;
  installment_condition: string | null;
  discount_value: number | string;
  discount_value_max: number | string | null;
  max_discount_amount: number | null;
  discount_unit: string;
  valid_from: string | null;
  valid_until: string | null;
  source_url: string | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
  status: string;
};

const initialState: DiscountEditFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary sr-discounts-submit-btn" disabled={pending}>
      {pending ? "저장 중..." : "수정 저장"}
    </button>
  );
}

export function EditDiscountForm({
  discount,
  brands,
  categories,
  providers,
  products,
}: {
  discount: DiscountEditValues;
  brands: BrandOption[];
  categories: BenefitCategoryOption[];
  providers: ProviderOption[];
  products: BenefitProductOption[];
}) {
  const defaultBenefitProductIds =
    discount.benefit_product_ids && discount.benefit_product_ids.length > 0
      ? discount.benefit_product_ids
      : discount.benefit_product_id != null
        ? [discount.benefit_product_id]
        : [];

  const updateAction = updateDiscountAction.bind(null, discount.id);
  const [state, formAction] = useActionState(updateAction, initialState);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    String(discount.benefit_category_id),
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    String(discount.provider_id),
  );
  const [providerOptions, setProviderOptions] = useState(providers);
  const [productOptions, setProductOptions] = useState(products);
  const [selectedBenefitProductIds, setSelectedBenefitProductIds] = useState<number[]>(
    defaultBenefitProductIds,
  );
  const [discountUnit, setDiscountUnit] = useState(discount.discount_unit);
  const defaultOpenGroups = getDiscountFormDefaultOpenGroups(discount);

  const filteredProviders = useMemo(
    () =>
      selectedCategoryId
        ? providerOptions.filter(
            (provider) =>
              provider.benefit_category_id === Number(selectedCategoryId),
          )
        : providerOptions,
    [providerOptions, selectedCategoryId],
  );

  const selectedCategoryCode = resolveCategoryCode(selectedCategoryId, categories);
  const cardCategoryId =
    categories.find((category) => category.code === "card")?.id ?? null;
  const membershipCategoryId =
    categories.find((category) => category.code === "membership")?.id ?? null;

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

  const handleProviderUpsert = (
    provider: ProviderOption,
    allProduct?: BenefitProductOption,
  ) => {
    setProviderOptions((current) => {
      if (current.some((row) => row.id === provider.id)) {
        return current;
      }
      return [...current, provider];
    });

    if (allProduct) {
      handleProductUpsert(allProduct);
    }
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
                  defaultValue={discount.brand_id}
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
                  defaultValue={discount.title}
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
              membershipCategoryId={membershipCategoryId}
              selectedProviderName={selectedProviderName}
              selectedBenefitProductIds={selectedBenefitProductIds}
              defaultBenefitProductIds={defaultBenefitProductIds}
              defaultBenefitProductId={discount.benefit_product_id}
              onCategoryChange={handleCategoryChange}
              onProviderChange={handleProviderChange}
              onProviderUpsert={handleProviderUpsert}
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
                  htmlFor="discount_unit"
                  required
                  className="sr-discounts-field--discount-type"
                  error={state.fieldErrors?.discount_unit}
                >
                  <AdminDiscountUnitSelect
                    id="discount_unit"
                    name="discount_unit"
                    value={discountUnit}
                    onChange={setDiscountUnit}
                    required
                  />
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
                    unit={discountUnit}
                    defaultValue={discount.discount_value}
                    defaultValueMax={discount.discount_value_max}
                    required={discountUnit !== "free"}
                    valueError={state.fieldErrors?.discount_value}
                    valueMaxError={state.fieldErrors?.discount_value_max}
                  />
                </DiscountFormField>

                <DiscountFormField
                  label="최대 할인금액"
                  htmlFor="max_discount_amount"
                  className="sr-discounts-field--max-discount-amount"
                  hint="할인 적용 시 이 금액을 초과해 할인되지 않습니다."
                  hintInline
                >
                  <MoneyInput
                    id="max_discount_amount"
                    name="max_discount_amount"
                    placeholder="예: 10000"
                    defaultValue={
                      discount.max_discount_amount != null
                        ? String(discount.max_discount_amount)
                        : ""
                    }
                  />
                </DiscountFormField>
              </div>
            </div>
          </DiscountFormRow>

          <DiscountFormRow>
            <DiscountConditionDetailFields
              values={{
                condition_text: discount.condition_text,
                apply_basis: discount.apply_basis,
                stackable_policy: discount.stackable_policy,
                usage_channel: discount.usage_channel,
                installment_condition: discount.installment_condition,
              }}
            />
          </DiscountFormRow>

          <DiscountFormRow>
            <DiscountVisibilityFields
              mode="edit"
              defaultStatus={discount.status}
              statusError={state.fieldErrors?.status}
            />
          </DiscountFormRow>

          <DiscountFormRow className="sr-discounts-form-row--last">
            <div className="sr-discounts-form-section">
            <p className="sr-discounts-group-title mb-2">추가 옵션</p>

            <div className="sr-discounts-form-fields">
              <DiscountFormOptionGroup
                group="notice"
                label="주의사항 입력"
                defaultOpen={defaultOpenGroups.notice}
              >
                <DiscountNoticeFields defaultValue={discount.notice_text} />
              </DiscountFormOptionGroup>

              <DiscountFormOptionGroup
                group="period"
                label="기간 설정"
                defaultOpen={defaultOpenGroups.period}
              >
                <div className="col-12 sr-discounts-period-row">
                  <DiscountFormField label="시작일" htmlFor="valid_from">
                    <input
                      id="valid_from"
                      name="valid_from"
                      className="form-control"
                      defaultValue={discount.valid_from ?? ""}
                      type="date"
                    />
                  </DiscountFormField>

                  <DiscountFormField
                    label="종료일"
                    htmlFor="valid_until"
                    error={state.fieldErrors?.valid_until}
                  >
                    <input
                      id="valid_until"
                      name="valid_until"
                      className="form-control"
                      defaultValue={discount.valid_until ?? ""}
                      type="date"
                    />
                  </DiscountFormField>
                </div>
              </DiscountFormOptionGroup>

              <DiscountFormOptionGroup
                group="data"
                label="데이터 관리"
                defaultOpen={defaultOpenGroups.data}
              >
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
                      defaultValue={discount.source_url ?? ""}
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
                      defaultValue={discount.admin_memo ?? ""}
                      placeholder="내부 확인용 메모 (사용자에게 노출되지 않음)"
                    />
                  </DiscountFormField>
                </div>
              </DiscountFormOptionGroup>
            </div>
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
