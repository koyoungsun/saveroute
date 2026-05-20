"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  resolveCategoryCode,
  type DiscountBenefitProductOption,
} from "@/lib/benefits/discount-product-options";

import { DiscountAmountInput } from "@/components/admin/DiscountAmountInput";

import { DiscountBenefitProductSelect } from "../../DiscountBenefitProductSelect";
import { CardBenefitProductCombobox } from "../../CardBenefitProductCombobox";
import { TelecomDiscountProductMultiSelect } from "../../TelecomDiscountProductMultiSelect";
import { DISCOUNT_STATUS_OPTIONS } from "@/lib/ui/format-status-label";
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
  installment_condition: string | null;
  discount_value: number | string;
  discount_unit: string;
  valid_from: string | null;
  valid_until: string | null;
  source_url: string | null;
  status: string;
};

const initialState: DiscountEditFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
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
  const updateAction = updateDiscountAction.bind(null, discount.id);
  const [state, formAction] = useActionState(updateAction, initialState);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    String(discount.benefit_category_id),
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    String(discount.provider_id),
  );
  const [productOptions, setProductOptions] = useState(products);
  const [selectedBenefitProductId, setSelectedBenefitProductId] = useState(
    discount.benefit_product_id != null ? String(discount.benefit_product_id) : "",
  );
  const [discountUnit, setDiscountUnit] = useState(discount.discount_unit);

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

  const defaultBenefitProductIds =
    discount.benefit_product_ids && discount.benefit_product_ids.length > 0
      ? discount.benefit_product_ids
      : discount.benefit_product_id != null
        ? [discount.benefit_product_id]
        : [];

  return (
    <form action={formAction} className="card sr-block">
      <div className="card-body">
        {state.message ? (
          <div className="alert alert-danger" role="alert">
            {state.message}
          </div>
        ) : null}

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="brand_id">
              브랜드
            </label>
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
            {state.fieldErrors?.brand_id ? (
              <div className="form-text text-danger">
                {state.fieldErrors.brand_id}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="title">
              할인 제목
            </label>
            <input
              id="title"
              name="title"
              className="form-control"
              defaultValue={discount.title}
              required
            />
            {state.fieldErrors?.title ? (
              <div className="form-text text-danger">
                {state.fieldErrors.title}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label
              className="form-label fw-semibold"
              htmlFor="benefit_category_id"
            >
              혜택 카테고리
            </label>
            <select
              id="benefit_category_id"
              name="benefit_category_id"
              className="form-select"
              value={selectedCategoryId}
              onChange={(event) => {
                setSelectedCategoryId(event.target.value);
                setSelectedProviderId("");
                setSelectedBenefitProductId("");
              }}
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
            {state.fieldErrors?.benefit_category_id ? (
              <div className="form-text text-danger">
                {state.fieldErrors.benefit_category_id}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="provider_id">
              제공사
            </label>
            <select
              id="provider_id"
              name="provider_id"
              className="form-select"
              value={selectedProviderId}
              onChange={(event) => {
                setSelectedProviderId(event.target.value);
                setSelectedBenefitProductId("");
              }}
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
            {state.fieldErrors?.provider_id ? (
              <div className="form-text text-danger">
                {state.fieldErrors.provider_id}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label
              className="form-label fw-semibold"
              htmlFor="benefit_product_id"
            >
              혜택상품
            </label>
            {selectedCategoryCode === "telecom" ? (
              <TelecomDiscountProductMultiSelect
                products={filteredProducts}
                defaultSelectedIds={defaultBenefitProductIds}
                disabled={!selectedProviderId}
                fieldError={state.fieldErrors?.benefit_product_id}
              />
            ) : selectedCategoryCode === "card" && cardCategoryId != null ? (
              <CardBenefitProductCombobox
                products={filteredProducts}
                providerId={selectedProviderId ? Number(selectedProviderId) : null}
                cardCategoryId={cardCategoryId}
                providerName={selectedProviderName}
                value={selectedBenefitProductId}
                onChange={setSelectedBenefitProductId}
                onProductUpsert={handleProductUpsert}
                disabled={!selectedProviderId}
                emptyHint={
                  selectedProviderId
                    ? "브랜드 직접 할인 / 상품 없음"
                    : undefined
                }
                fieldError={state.fieldErrors?.benefit_product_id}
              />
            ) : (
              <DiscountBenefitProductSelect
                categoryCode={selectedCategoryCode}
                products={filteredProducts}
                defaultValue={discount.benefit_product_id}
                disabled={!selectedProviderId}
                emptyHint={
                  selectedProviderId
                    ? "브랜드 직접 할인 / 상품 없음"
                    : undefined
                }
              />
            )}
            {selectedCategoryCode !== "telecom" &&
            selectedCategoryCode !== "card" &&
            state.fieldErrors?.benefit_product_id ? (
              <div className="form-text text-danger">
                {state.fieldErrors.benefit_product_id}
              </div>
            ) : selectedCategoryCode !== "telecom" &&
              selectedCategoryCode !== "card" ? (
              <div className="form-text">
                카드/통신사/멤버십 상품별 할인인 경우에만 선택합니다.
              </div>
            ) : selectedCategoryCode === "card" ? (
              <div className="form-text">
                카드사 전체 상품은 상단에 노출되며, 특정 카드는 검색으로 찾을 수
                있습니다. 목록에 없으면 신규 카드를 추가할 수 있습니다.
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="discount_unit">
              할인 유형
            </label>
            <select
              id="discount_unit"
              name="discount_unit"
              className="form-select"
              value={discountUnit}
              onChange={(event) => setDiscountUnit(event.target.value)}
              required
            >
              <option value="percent">percent</option>
              <option value="won">won</option>
              <option value="special_price">special_price</option>
              <option value="free">free</option>
              <option value="unknown">unknown</option>
            </select>
            {state.fieldErrors?.discount_unit ? (
              <div className="form-text text-danger">
                {state.fieldErrors.discount_unit}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="discount_value">
              할인값
            </label>
            <DiscountAmountInput
              unit={discountUnit}
              defaultValue={discount.discount_value}
              placeholder={discountUnit === "percent" ? "예: 20" : "예: 10,000"}
              required={discountUnit !== "free"}
            />
            {state.fieldErrors?.discount_value ? (
              <div className="form-text text-danger">
                {state.fieldErrors.discount_value}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="status">
              상태
            </label>
            <select
              id="status"
              name="status"
              className="form-select"
              defaultValue={discount.status}
              required
            >
              {DISCOUNT_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.status ? (
              <div className="form-text text-danger">
                {state.fieldErrors.status}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="valid_from">
              시작일
            </label>
            <input
              id="valid_from"
              name="valid_from"
              className="form-control"
              defaultValue={discount.valid_from ?? ""}
              type="date"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="valid_until">
              종료일
            </label>
            <input
              id="valid_until"
              name="valid_until"
              className="form-control"
              defaultValue={discount.valid_until ?? ""}
              type="date"
            />
            {state.fieldErrors?.valid_until ? (
              <div className="form-text text-danger">
                {state.fieldErrors.valid_until}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="source_url">
              출처 URL
            </label>
            <input
              id="source_url"
              name="source_url"
              className="form-control"
              defaultValue={discount.source_url ?? ""}
              placeholder="https://example.com"
              type="url"
            />
            {state.fieldErrors?.source_url ? (
              <div className="form-text text-danger">
                {state.fieldErrors.source_url}
              </div>
            ) : null}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="installment_condition">
              할부 조건
            </label>
            <input
              id="installment_condition"
              name="installment_condition"
              className="form-control"
              defaultValue={discount.installment_condition ?? ""}
              placeholder="예) 2~3개월 할부 시 적용 / 일시불 결제 시 적용 / 일시불·할부 모두 가능"
            />
            <div className="form-text">선택 입력 · 검색 결과에 결제 조건으로 표시됩니다.</div>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="condition_text">
              조건 문구
            </label>
            <textarea
              id="condition_text"
              name="condition_text"
              className="form-control"
              defaultValue={discount.condition_text ?? ""}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-end gap-2">
        <a href="/admin/discounts" className="btn btn-outline-secondary">
          취소
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}
