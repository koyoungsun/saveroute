"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { createBrandAction, type BrandFormState } from "./actions";

type BrandCategoryOption = {
  id: number;
  name: string;
};

const initialState: BrandFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "등록 중..." : "브랜드 등록"}
    </button>
  );
}

export function BrandForm({
  categories,
}: {
  categories: BrandCategoryOption[];
}) {
  const [state, formAction] = useActionState(createBrandAction, initialState);

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
            <label className="form-label fw-semibold" htmlFor="name">
              브랜드명
            </label>
            <input
              id="name"
              name="name"
              className="form-control"
              placeholder="예: 롯데월드"
              required
            />
            {state.fieldErrors?.name ? (
              <div className="form-text text-danger">
                {state.fieldErrors.name}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="slug">
              slug
            </label>
            <input
              id="slug"
              name="slug"
              className="form-control"
              placeholder="예: lotte-world"
              required
            />
            {state.fieldErrors?.slug ? (
              <div className="form-text text-danger">
                {state.fieldErrors.slug}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="category_id">
              카테고리
            </label>
            <select
              id="category_id"
              name="category_id"
              className="form-select"
              defaultValue=""
            >
              <option value="">
                카테고리 없음 / 미선택
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {state.fieldErrors?.category_id ? (
              <div className="form-text text-danger">
                {state.fieldErrors.category_id}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="website_url">
              웹사이트 URL
            </label>
            <input
              id="website_url"
              name="website_url"
              className="form-control"
              placeholder="https://example.com"
              type="url"
            />
            {state.fieldErrors?.website_url ? (
              <div className="form-text text-danger">
                {state.fieldErrors.website_url}
              </div>
            ) : null}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="description">
              설명
            </label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              placeholder="브랜드 설명 또는 운영 메모"
              rows={4}
            />
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
        <a href="/admin/brands" className="btn btn-outline-secondary">
          취소
        </a>
        <SubmitButton />
      </div>
    </form>
  );
}
