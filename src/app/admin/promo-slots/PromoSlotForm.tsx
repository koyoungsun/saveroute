"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  toDatetimeLocalValue,
  type PromoSlotFormState,
} from "@/lib/promoSlotForm";
import { LINK_TYPE_OPTIONS } from "@/lib/ui/format-status-label";

export type PromoSlotFormValues = {
  id?: string;
  title: string;
  description: string;
  badge: string;
  image_url: string | null;
  link_type: "internal" | "external";
  href: string;
  hashtags: string[] | null;
  priority: number;
  is_active: boolean;
  is_sponsored: boolean;
  sponsor_name: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

type PromoSlotFormAction = (
  state: PromoSlotFormState,
  formData: FormData,
) => Promise<PromoSlotFormState>;

const emptyValues: PromoSlotFormValues = {
  title: "",
  description: "",
  badge: "추천 할인",
  image_url: null,
  link_type: "internal",
  href: "/search?keyword=",
  hashtags: [],
  priority: 0,
  is_active: true,
  is_sponsored: false,
  sponsor_name: null,
  starts_at: null,
  ends_at: null,
};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}

export function PromoSlotForm({
  action,
  values,
  submitLabel,
  pendingLabel,
}: {
  action: PromoSlotFormAction;
  values?: PromoSlotFormValues;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useActionState(action, {});
  const initialValues = values ?? emptyValues;

  return (
    <form action={formAction} className="card sr-block">
      <div className="card-body">
        {state.message ? (
          <div className="alert alert-danger" role="alert">
            {state.message}
          </div>
        ) : null}

        <div className="alert alert-secondary py-2" role="status">
          홈 하단 추천 할인 구좌로 노출됩니다. 결제/광고 판매 처리는 아직 연결하지 않습니다.
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="title">
              제목
            </label>
            <input
              id="title"
              name="title"
              className="form-control"
              defaultValue={initialValues.title}
              placeholder="예: 이번 주 인기 할인 모아보기"
              required
            />
            {state.fieldErrors?.title ? (
              <div className="form-text text-danger">
                {state.fieldErrors.title}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="badge">
              배지
            </label>
            <input
              id="badge"
              name="badge"
              className="form-control"
              defaultValue={initialValues.badge}
              placeholder="예: 추천 할인"
              required
            />
            {state.fieldErrors?.badge ? (
              <div className="form-text text-danger">
                {state.fieldErrors.badge}
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
              defaultValue={initialValues.description}
              placeholder="예: 자주 쓰는 브랜드 혜택을 한눈에 확인하세요."
              rows={3}
              required
            />
            {state.fieldErrors?.description ? (
              <div className="form-text text-danger">
                {state.fieldErrors.description}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="link_type">
              링크 타입
            </label>
            <select
              id="link_type"
              name="link_type"
              className="form-select"
              defaultValue={initialValues.link_type}
            >
              {LINK_TYPE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {state.fieldErrors?.link_type ? (
              <div className="form-text text-danger">
                {state.fieldErrors.link_type}
              </div>
            ) : null}
          </div>

          <div className="col-md-8">
            <label className="form-label fw-semibold" htmlFor="href">
              이동 경로 href
            </label>
            <input
              id="href"
              name="href"
              className="form-control"
              defaultValue={initialValues.href}
              placeholder="/search?keyword=브랜드명 또는 https://..."
              required
            />
            <div className="form-text">
              내부는 /search?keyword=브랜드명, 외부는 https:// 형식을 사용합니다.
            </div>
            {state.fieldErrors?.href ? (
              <div className="form-text text-danger">
                {state.fieldErrors.href}
              </div>
            ) : null}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="hashtags">
              해시태그
            </label>
            <input
              id="hashtags"
              name="hashtags"
              className="form-control"
              defaultValue={(initialValues.hashtags ?? []).join(" ")}
              placeholder="#스타벅스 #카드혜택 #외부제휴"
            />
            <div className="form-text">
              쉼표 또는 공백으로 여러 태그를 입력할 수 있습니다.
            </div>
            {state.fieldErrors?.hashtags ? (
              <div className="form-text text-danger">
                {state.fieldErrors.hashtags}
              </div>
            ) : null}
          </div>

          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="priority">
              우선순위
            </label>
            <input
              id="priority"
              name="priority"
              className="form-control"
              defaultValue={initialValues.priority}
              type="number"
              step="1"
            />
            <div className="form-text">큰 숫자가 먼저 노출됩니다.</div>
            {state.fieldErrors?.priority ? (
              <div className="form-text text-danger">
                {state.fieldErrors.priority}
              </div>
            ) : null}
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="image_url">
              이미지 URL
            </label>
            <input
              id="image_url"
              name="image_url"
              className="form-control"
              defaultValue={initialValues.image_url ?? ""}
              placeholder="/icons/promo.png 또는 https://..."
            />
            {state.fieldErrors?.image_url ? (
              <div className="form-text text-danger">
                {state.fieldErrors.image_url}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="starts_at">
              노출 시작
            </label>
            <input
              id="starts_at"
              name="starts_at"
              className="form-control"
              defaultValue={toDatetimeLocalValue(initialValues.starts_at)}
              type="datetime-local"
            />
            {state.fieldErrors?.starts_at ? (
              <div className="form-text text-danger">
                {state.fieldErrors.starts_at}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold" htmlFor="ends_at">
              노출 종료
            </label>
            <input
              id="ends_at"
              name="ends_at"
              className="form-control"
              defaultValue={toDatetimeLocalValue(initialValues.ends_at)}
              type="datetime-local"
            />
            {state.fieldErrors?.ends_at ? (
              <div className="form-text text-danger">
                {state.fieldErrors.ends_at}
              </div>
            ) : null}
          </div>

          <div className="col-md-6">
            <div className="form-check form-switch">
              <input
                id="is_active"
                name="is_active"
                className="form-check-input"
                type="checkbox"
                defaultChecked={initialValues.is_active}
              />
              <label className="form-check-label" htmlFor="is_active">
                활성 상태
              </label>
            </div>
          </div>

          <div className="col-md-6">
            <div className="form-check form-switch">
              <input
                id="is_sponsored"
                name="is_sponsored"
                className="form-check-input"
                type="checkbox"
                defaultChecked={initialValues.is_sponsored}
              />
              <label className="form-check-label" htmlFor="is_sponsored">
                스폰서/제휴 표시
              </label>
            </div>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold" htmlFor="sponsor_name">
              스폰서명
            </label>
            <input
              id="sponsor_name"
              name="sponsor_name"
              className="form-control"
              defaultValue={initialValues.sponsor_name ?? ""}
              placeholder="예: 브랜드명 또는 제휴사명"
            />
            {state.fieldErrors?.sponsor_name ? (
              <div className="form-text text-danger">
                {state.fieldErrors.sponsor_name}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="card-footer bg-white d-flex justify-content-end gap-2">
        <Link href="/admin/promo-slots" className="btn btn-outline-secondary">
          취소
        </Link>
        <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
      </div>
    </form>
  );
}
