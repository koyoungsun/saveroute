"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import type { BenefitProductFormState } from "./form-actions";

export type BenefitProductFormValues = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  name: string;
  is_active: boolean;
  is_mvno: boolean;
  mvno_notice_required: boolean;
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

type BenefitProductFormAction = (
  prevState: BenefitProductFormState,
  formData: FormData,
) => Promise<BenefitProductFormState>;

const initialState: BenefitProductFormState = {};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending
        ? mode === "create"
          ? "등록 중..."
          : "저장 중..."
        : mode === "create"
          ? "상품 등록"
          : "수정 저장"}
    </button>
  );
}

export function BenefitProductForm({
  action,
  categories,
  providers,
  initialValues,
  mode,
}: {
  action: BenefitProductFormAction;
  categories: BenefitCategoryOption[];
  providers: ProviderOption[];
  initialValues?: BenefitProductFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction] = useActionState(action, initialState);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialValues ? String(initialValues.benefit_category_id) : "",
  );
  const [selectedProviderId, setSelectedProviderId] = useState(
    initialValues ? String(initialValues.provider_id) : "",
  );

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

          <div className="col-md-6">
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

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="name">
              상품명
            </label>
            <input
              id="name"
              name="name"
              className="form-control"
              defaultValue={initialValues?.name ?? ""}
              placeholder="예: KT VIP"
              required
            />
            {state.fieldErrors?.name ? (
              <div className="form-text text-danger">
                {state.fieldErrors.name}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <div className="form-check form-switch">
              <input
                id="is_active"
                name="is_active"
                className="form-check-input"
                type="checkbox"
                defaultChecked={initialValues?.is_active ?? true}
              />
              <label className="form-check-label" htmlFor="is_active">
                활성 상태
              </label>
            </div>
          </div>

          <div className="col-md-4">
            <div className="form-check form-switch">
              <input
                id="is_mvno"
                name="is_mvno"
                className="form-check-input"
                type="checkbox"
                defaultChecked={initialValues?.is_mvno ?? false}
              />
              <label className="form-check-label" htmlFor="is_mvno">
                알뜰폰 상품
              </label>
            </div>
          </div>

          <div className="col-md-4">
            <div className="form-check form-switch">
              <input
                id="mvno_notice_required"
                name="mvno_notice_required"
                className="form-check-input"
                type="checkbox"
                defaultChecked={initialValues?.mvno_notice_required ?? false}
              />
              <label className="form-check-label" htmlFor="mvno_notice_required">
                알뜰폰 안내 필요
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-end gap-2">
        <a href="/admin/benefit-products" className="btn btn-outline-secondary">
          취소
        </a>
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
