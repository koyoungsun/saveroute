"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import { formatBenefitProductOptionLabel } from "@/lib/benefits/format-product-label";

import { createDiscountAction, type DiscountFormState } from "./actions";

type BrandOption = {
  id: number;
  name: string;
  slug: string;
};

type BenefitCategoryOption = {
  id: number;
  name: string;
};

type ProviderOption = {
  id: number;
  name: string;
  benefit_category_id: number;
};

type BenefitProductOption = {
  id: number;
  name: string;
  benefit_category_id: number;
  provider_id: number;
  benefit_type?: string | null;
  is_all_product?: boolean;
};

const initialState: DiscountFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
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
  const [state, formAction] = useActionState(
    createDiscountAction,
    initialState,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");

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

  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => {
          if (selectedProviderId) {
            return product.provider_id === Number(selectedProviderId);
          }

          if (selectedCategoryId) {
            return product.benefit_category_id === Number(selectedCategoryId);
          }

          return true;
        })
        .sort((a, b) => {
          if (a.is_all_product && !b.is_all_product) return -1;
          if (!a.is_all_product && b.is_all_product) return 1;
          return a.name.localeCompare(b.name, "ko");
        }),
    [products, selectedCategoryId, selectedProviderId],
  );

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
              placeholder="예: VIP 20% 할인"
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
              onChange={(event) => setSelectedProviderId(event.target.value)}
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
            <select
              id="benefit_product_id"
              name="benefit_product_id"
              className="form-select"
              defaultValue=""
              disabled={!selectedProviderId}
            >
              <option value="">
                {selectedProviderId
                  ? "브랜드 직접 할인 / 상품 없음"
                  : "제공사 선택 후 선택 가능"}
              </option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {formatBenefitProductOptionLabel(product)}
                </option>
              ))}
            </select>
            {state.fieldErrors?.benefit_product_id ? (
              <div className="form-text text-danger">
                {state.fieldErrors.benefit_product_id}
              </div>
            ) : (
              <div className="form-text">
                카드/통신사/멤버십 상품별 할인인 경우에만 선택합니다.
              </div>
            )}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="discount_type">
              할인 유형
            </label>
            <select
              id="discount_type"
              name="discount_type"
              className="form-select"
              defaultValue="percent"
              required
            >
              <option value="percent">percent</option>
              <option value="won">won</option>
              <option value="special_price">special_price</option>
              <option value="free">free</option>
              <option value="unknown">unknown</option>
            </select>
            {state.fieldErrors?.discount_type ? (
              <div className="form-text text-danger">
                {state.fieldErrors.discount_type}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="discount_value">
              할인값
            </label>
            <input
              id="discount_value"
              name="discount_value"
              className="form-control"
              min="0"
              placeholder="예: 20"
              step="0.01"
              type="number"
              required
            />
            {state.fieldErrors?.discount_value ? (
              <div className="form-text text-danger">
                {state.fieldErrors.discount_value}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label
              className="form-label fw-semibold"
              htmlFor="max_discount_amount"
            >
              최대 할인 금액
            </label>
            <input
              id="max_discount_amount"
              name="max_discount_amount"
              className="form-control"
              min="0"
              placeholder="예: 10000"
              type="number"
            />
          </div>

          <div className="col-md-4">
            <label
              className="form-label fw-semibold"
              htmlFor="min_payment_amount"
            >
              최소 결제 금액
            </label>
            <input
              id="min_payment_amount"
              name="min_payment_amount"
              className="form-control"
              min="0"
              placeholder="예: 30000"
              type="number"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="start_date">
              시작일
            </label>
            <input
              id="start_date"
              name="start_date"
              className="form-control"
              type="date"
            />
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="end_date">
              종료일
            </label>
            <input
              id="end_date"
              name="end_date"
              className="form-control"
              type="date"
            />
            {state.fieldErrors?.end_date ? (
              <div className="form-text text-danger">
                {state.fieldErrors.end_date}
              </div>
            ) : null}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="source_url">
              출처 URL
            </label>
            <input
              id="source_url"
              name="source_url"
              className="form-control"
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
              placeholder="예) 2~3개월 할부 시 적용 / 일시불 결제 시 적용 / 일시불·할부 모두 가능"
            />
            <div className="form-text">선택 입력 · 검색 결과에 결제 조건으로 표시됩니다.</div>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="notice">
              안내/유의사항
            </label>
            <textarea
              id="notice"
              name="notice"
              className="form-control"
              placeholder="할인 조건, 제외 항목, 이용 유의사항"
              rows={4}
            />
            <div className="form-text">
              현재 DB에는 별도 notice/max/min 컬럼이 없어 조건 문구로 함께
              저장됩니다.
            </div>
          </div>

          <div className="col-12">
            <div className="form-check form-switch">
              <input
                id="is_active"
                name="is_active"
                className="form-check-input"
                type="checkbox"
                defaultChecked
              />
              <label className="form-check-label" htmlFor="is_active">
                활성 상태로 등록
              </label>
            </div>
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
