"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { updateBrandAction, type BrandEditFormState } from "./actions";

type BrandCategoryOption = {
  id: number;
  name: string;
};

export type BrandEditValues = {
  id: number;
  name: string;
  slug: string;
  category_id: number | null;
  aliases: string[] | null;
  admin_memo: string | null;
  official_url: string | null;
  is_active: boolean;
};

const initialState: BrandEditFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중..." : "수정 저장"}
    </button>
  );
}

export function EditBrandForm({
  brand,
  categories,
}: {
  brand: BrandEditValues;
  categories: BrandCategoryOption[];
}) {
  const updateAction = updateBrandAction.bind(null, brand.id);
  const [state, formAction] = useActionState(updateAction, initialState);

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
              defaultValue={brand.name}
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
              defaultValue={brand.slug}
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
              defaultValue={brand.category_id ?? ""}
            >
              <option value="">카테고리 없음 / 미선택</option>
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
            <label className="form-label fw-semibold" htmlFor="official_url">
              공식 URL
            </label>
            <input
              id="official_url"
              name="official_url"
              className="form-control"
              defaultValue={brand.official_url ?? ""}
              placeholder="https://example.com"
              type="url"
            />
            {state.fieldErrors?.official_url ? (
              <div className="form-text text-danger">
                {state.fieldErrors.official_url}
              </div>
            ) : null}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="aliases">
              aliases
            </label>
            <textarea
              id="aliases"
              name="aliases"
              className="form-control"
              defaultValue={(brand.aliases ?? []).join(", ")}
              placeholder="예: 메가커피, 메가MGC, Mega Coffee"
              rows={3}
            />
            <div className="form-text">
              쉼표 또는 줄바꿈으로 여러 별칭을 입력할 수 있습니다.
            </div>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="admin_memo">
              운영 메모
            </label>
            <textarea
              id="admin_memo"
              name="admin_memo"
              className="form-control"
              defaultValue={brand.admin_memo ?? ""}
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
                defaultChecked={brand.is_active}
              />
              <label className="form-check-label" htmlFor="is_active">
                활성 상태
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-end gap-2">
        <Link href="/admin/brands" className="btn btn-outline-secondary">
          취소
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
