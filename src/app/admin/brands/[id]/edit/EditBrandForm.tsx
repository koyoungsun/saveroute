"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { updateBrandAction, type BrandEditFormState } from "./actions";
import {
  createBrandPriceItemAction,
  deleteBrandPriceItemAction,
  updateBrandPriceItemAction,
  type BrandPriceItemFormState,
} from "./price-items-actions";

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
  has_price_board: boolean;
};

export type BrandPriceItem = {
  id: string;
  brand_id: number;
  label: string;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const initialState: BrandEditFormState = {};
const initialPriceItemState: BrandPriceItemFormState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중..." : label}
    </button>
  );
}

export function EditBrandForm({
  brand,
  categories,
  priceItems,
}: {
  brand: BrandEditValues;
  categories: BrandCategoryOption[];
  priceItems: BrandPriceItem[];
}) {
  const updateAction = updateBrandAction.bind(null, brand.id);
  const [state, formAction] = useActionState(updateAction, initialState);
  const [priceBoardEnabled, setPriceBoardEnabled] = useState(brand.has_price_board);

  const items = useMemo(() => priceItems ?? [], [priceItems]);

  useEffect(() => {
    setPriceBoardEnabled(brand.has_price_board);
  }, [brand.has_price_board]);

  return (
    <>
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
                <div className="form-text text-danger">{state.fieldErrors.name}</div>
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
                <div className="form-text text-danger">{state.fieldErrors.slug}</div>
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
                <div className="form-text text-danger">{state.fieldErrors.category_id}</div>
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
                <div className="form-text text-danger">{state.fieldErrors.official_url}</div>
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

            <div className="col-12">
              <div className="form-check form-switch">
                <input
                  id="has_price_board"
                  name="has_price_board"
                  className="form-check-input"
                  type="checkbox"
                  defaultChecked={brand.has_price_board}
                  onChange={(event) => setPriceBoardEnabled(event.currentTarget.checked)}
                />
                <label className="form-check-label" htmlFor="has_price_board">
                  이용요금 계산기 사용
                </label>
                <div className="form-text">
                  ON으로 저장한 뒤, 아래 &quot;이용요금 항목&quot; 섹션에서 가격 항목을 각각
                  추가해야 검색 결과 계산기에 노출됩니다.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-footer bg-white d-flex justify-content-end gap-2">
          <Link href="/admin/brands" className="btn btn-outline-secondary">
            취소
          </Link>
          <SubmitButton label="브랜드 정보 저장" />
        </div>
      </form>

      {priceBoardEnabled ? (
        <BrandPriceItemsEditor brandId={brand.id} items={items} />
      ) : null}
    </>
  );
}

function DeletePriceItemButton({
  deleteAction,
}: {
  deleteAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-outline-danger btn-sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await deleteAction(new FormData());
          router.refresh();
        });
      }}
    >
      {pending ? "삭제 중..." : "삭제"}
    </button>
  );
}

function PriceItemSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-outline-primary btn-sm" disabled={pending}>
      {pending ? "저장 중..." : label}
    </button>
  );
}

function BrandPriceItemsEditor({
  brandId,
  items,
}: {
  brandId: number;
  items: BrandPriceItem[];
}) {
  const router = useRouter();
  const createAction = createBrandPriceItemAction.bind(null, brandId);
  const [createState, createFormAction] = useActionState(createAction, initialPriceItemState);
  const [createFormKey, setCreateFormKey] = useState(0);

  useEffect(() => {
    if (createState.success) {
      router.refresh();
      setCreateFormKey((current) => current + 1);
    }
  }, [createState.success, router]);

  return (
    <div className="card sr-block mt-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
          <div>
            <h2 className="h5 mb-1">이용요금 항목</h2>
            <p className="text-muted small mb-0">
              가격 항목은 <strong>항목 추가</strong> / <strong>저장</strong> / <strong>삭제</strong>{" "}
              버튼을 눌러 즉시 DB에 반영됩니다. 상단 &quot;브랜드 정보 저장&quot;만으로는 저장되지
              않습니다.
            </p>
          </div>
        </div>

        <div className="alert alert-info py-2 small mb-3" role="status">
          새 항목을 입력한 뒤 반드시 <strong>항목 추가</strong> 버튼을 눌러 주세요.
        </div>

        {createState.message ? (
          <div className="alert alert-danger" role="alert">
            {createState.message}
          </div>
        ) : null}

        {createState.success ? (
          <div className="alert alert-success py-2" role="status">
            가격 항목이 추가되었습니다.
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="text-muted small mb-3">등록된 가격 항목이 없습니다.</div>
        ) : (
          <div className="d-flex flex-column gap-2 mb-3">
            {items.map((item) => (
              <PriceItemRow key={item.id} brandId={brandId} item={item} />
            ))}
          </div>
        )}

        <form
          key={createFormKey}
          action={createFormAction}
          className="border rounded-3 p-3 bg-light"
        >
          <p className="small fw-semibold mb-2">새 가격 항목 추가</p>
          <div className="row g-2 align-items-end">
            <div className="col-md-5">
              <label className="form-label fw-semibold mb-1" htmlFor="new_label">
                라벨
              </label>
              <input
                id="new_label"
                name="label"
                className="form-control"
                placeholder="예: 성인 종일권"
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold mb-1" htmlFor="new_price">
                가격
              </label>
              <input
                id="new_price"
                name="price"
                className="form-control"
                placeholder="62000"
                inputMode="numeric"
                required
              />
            </div>
            <div className="col-md-2">
              <label className="form-label fw-semibold mb-1" htmlFor="new_sort_order">
                정렬
              </label>
              <input
                id="new_sort_order"
                name="sort_order"
                className="form-control"
                defaultValue="0"
                inputMode="numeric"
              />
            </div>
            <div className="col-md-2">
              <div className="form-check form-switch mb-2">
                <input
                  id="new_is_active"
                  name="is_active"
                  className="form-check-input"
                  type="checkbox"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="new_is_active">
                  활성
                </label>
              </div>
              <PriceItemSubmitButton label="항목 추가" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function PriceItemRow({ brandId, item }: { brandId: number; item: BrandPriceItem }) {
  const router = useRouter();
  const updateAction = updateBrandPriceItemAction.bind(null, brandId, item.id);
  const [updateState, updateFormAction] = useActionState(updateAction, initialPriceItemState);
  const deleteAction = deleteBrandPriceItemAction.bind(null, brandId, item.id);

  useEffect(() => {
    if (updateState.success) {
      router.refresh();
    }
  }, [updateState.success, router]);

  return (
    <form action={updateFormAction} className="border rounded-3 p-3">
      <div className="row g-2 align-items-end">
        <div className="col-md-5">
          <label className="form-label fw-semibold mb-1">라벨</label>
          <input
            name="label"
            className="form-control form-control-sm"
            defaultValue={item.label}
            required
          />
        </div>
        <div className="col-md-3">
          <label className="form-label fw-semibold mb-1">가격</label>
          <input
            name="price"
            className="form-control form-control-sm"
            defaultValue={String(item.price)}
            inputMode="numeric"
            required
          />
        </div>
        <div className="col-md-2">
          <label className="form-label fw-semibold mb-1">정렬</label>
          <input
            name="sort_order"
            className="form-control form-control-sm"
            defaultValue={String(item.sort_order)}
            inputMode="numeric"
          />
        </div>
        <div className="col-md-2">
          <div className="form-check form-switch mb-2">
            <input
              id={`active-${item.id}`}
              name="is_active"
              className="form-check-input"
              type="checkbox"
              defaultChecked={item.is_active}
            />
            <label className="form-check-label" htmlFor={`active-${item.id}`}>
              활성
            </label>
          </div>
          <div className="d-flex gap-2">
            <PriceItemSubmitButton label="저장" />
            <DeletePriceItemButton deleteAction={deleteAction} />
          </div>
        </div>
      </div>
      {updateState.message ? (
        <div className="form-text text-danger mt-2">{updateState.message}</div>
      ) : null}
      {updateState.success ? (
        <div className="form-text text-success mt-2">저장되었습니다.</div>
      ) : null}
    </form>
  );
}
