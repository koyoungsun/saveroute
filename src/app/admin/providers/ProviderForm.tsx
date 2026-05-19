"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  type ProviderFormState,
  type ProviderType,
} from "./form-shared";

type BenefitCategoryOption = {
  id: number;
  name: string;
};

export type ProviderFormValues = {
  id?: number;
  name: string;
  code: string;
  benefit_category_id: number;
  provider_type: ProviderType;
  official_url: string | null;
  logo_url: string | null;
  display_order: number;
  memo: string | null;
  is_active: boolean;
};

const PROVIDER_TYPE_OPTIONS: { value: ProviderType; label: string }[] = [
  { value: "telecom_major", label: "telecom_major (통신 3사)" },
  { value: "telecom_mvno", label: "telecom_mvno (알뜰폰)" },
  { value: "card_company", label: "card_company (카드사)" },
  { value: "coupon_platform", label: "coupon_platform (쿠폰)" },
  { value: "membership_company", label: "membership_company (멤버십)" },
];

type ProviderFormAction = (
  prevState: ProviderFormState,
  formData: FormData,
) => Promise<ProviderFormState>;

const initialState: ProviderFormState = {};

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending
        ? mode === "create"
          ? "등록 중..."
          : "저장 중..."
        : mode === "create"
          ? "제공사 등록"
          : "수정 저장"}
    </button>
  );
}

export function ProviderForm({
  action,
  categories,
  initialValues,
  mode,
}: {
  action: ProviderFormAction;
  categories: BenefitCategoryOption[];
  initialValues?: ProviderFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card sr-block">
      <div className="card-body">
        {state.message ? (
          <div className="alert alert-danger" role="alert">
            {state.message}
          </div>
        ) : null}

        {mode === "edit" && initialValues?.id != null ? (
          <div className="alert alert-light border mb-3 py-2 small" role="status">
            제공사 ID: <strong>{initialValues.id}</strong> (변경 불가)
          </div>
        ) : null}

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="name">
              제공사명
            </label>
            <input
              id="name"
              name="name"
              className="form-control"
              defaultValue={initialValues?.name ?? ""}
              required
            />
            {state.fieldErrors?.name ? (
              <div className="form-text text-danger">{state.fieldErrors.name}</div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="code">
              code (고유 식별자)
            </label>
            <input
              id="code"
              name="code"
              className="form-control font-monospace"
              defaultValue={initialValues?.code ?? ""}
              placeholder="예: shinhan_card"
              required
            />
            <div className="form-text">
              영문 소문자·숫자·밑줄. DB 유니크 키 (slug 역할).
            </div>
            {state.fieldErrors?.code ? (
              <div className="form-text text-danger">{state.fieldErrors.code}</div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="benefit_category_id">
              혜택 카테고리
            </label>
            <select
              id="benefit_category_id"
              name="benefit_category_id"
              className="form-select"
              defaultValue={
                initialValues ? String(initialValues.benefit_category_id) : ""
              }
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
            <label className="form-label fw-semibold" htmlFor="provider_type">
              provider_type
            </label>
            <select
              id="provider_type"
              name="provider_type"
              className="form-select"
              defaultValue={initialValues?.provider_type ?? ""}
              required
            >
              <option value="" disabled>
                유형 선택
              </option>
              {PROVIDER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.provider_type ? (
              <div className="form-text text-danger">
                {state.fieldErrors.provider_type}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="display_order">
              display_order
            </label>
            <input
              id="display_order"
              name="display_order"
              type="number"
              min={0}
              step={1}
              className="form-control"
              defaultValue={initialValues?.display_order ?? 500}
            />
            <div className="form-text">작을수록 목록에서 먼저 노출됩니다.</div>
            {state.fieldErrors?.display_order ? (
              <div className="form-text text-danger">
                {state.fieldErrors.display_order}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <div className="form-check form-switch mt-4 pt-2">
              <input
                id="is_active"
                name="is_active"
                className="form-check-input"
                type="checkbox"
                defaultChecked={initialValues?.is_active ?? true}
              />
              <label className="form-check-label" htmlFor="is_active">
                활성 상태 (is_active)
              </label>
            </div>
            <div className="form-text">
              삭제 대신 비활성화만 지원합니다. 참조 중인 혜택·할인 데이터는 유지됩니다.
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="official_url">
              official_url
            </label>
            <input
              id="official_url"
              name="official_url"
              className="form-control"
              defaultValue={initialValues?.official_url ?? ""}
              placeholder="https://"
            />
            {state.fieldErrors?.official_url ? (
              <div className="form-text text-danger">
                {state.fieldErrors.official_url}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="logo_url">
              logo_url
            </label>
            <input
              id="logo_url"
              name="logo_url"
              className="form-control"
              defaultValue={initialValues?.logo_url ?? ""}
              placeholder="https://"
            />
            {state.fieldErrors?.logo_url ? (
              <div className="form-text text-danger">{state.fieldErrors.logo_url}</div>
            ) : null}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="memo">
              memo
            </label>
            <textarea
              id="memo"
              name="memo"
              className="form-control"
              rows={3}
              defaultValue={initialValues?.memo ?? ""}
            />
            {state.fieldErrors?.memo ? (
              <div className="form-text text-danger">{state.fieldErrors.memo}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-end gap-2">
        <a href="/admin/providers" className="btn btn-outline-secondary">
          취소
        </a>
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
