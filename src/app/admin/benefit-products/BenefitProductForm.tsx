"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  InlineProviderAddPanel,
  type InlineProviderOption,
} from "@/app/admin/providers/InlineCardProviderAddPanel";
import { formatBenefitCategoryDisplayName } from "@/lib/benefits/format-benefit-category-label";

import type { BenefitProductFormState } from "./form-actions";

export type BenefitProductFormValues = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  name: string;
  is_active: boolean;
  is_mvno: boolean;
  mvno_notice_required: boolean;
  benefit_type?: string | null;
  card_type?: string | null;
  is_all_product?: boolean;
};

type BenefitCategoryOption = {
  id: number;
  name: string;
  code?: string;
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
  cardCategoryId,
  membershipCategoryId,
  initialValues,
  mode,
}: {
  action: BenefitProductFormAction;
  categories: BenefitCategoryOption[];
  providers: ProviderOption[];
  cardCategoryId: number | null;
  membershipCategoryId: number | null;
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
  const [providerOptions, setProviderOptions] = useState(providers);
  const [isAllProduct, setIsAllProduct] = useState(
    initialValues?.is_all_product ?? false,
  );

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

  const isCardCategory =
    cardCategoryId !== null &&
    selectedCategoryId !== "" &&
    Number(selectedCategoryId) === cardCategoryId;

  const isMembershipCategory =
    membershipCategoryId !== null &&
    selectedCategoryId !== "" &&
    Number(selectedCategoryId) === membershipCategoryId;

  const selectedProvider = filteredProviders.find(
    (provider) => provider.id === Number(selectedProviderId),
  );
  const membershipDefaultName = selectedProvider
    ? `${selectedProvider.name} 전체`
    : "멤버십명 전체";

  const defaultBenefitType = isAllProduct
    ? "all"
    : (initialValues?.benefit_type ?? "");

  const handleProviderUpsert = (provider: InlineProviderOption) => {
    setProviderOptions((current) => {
      if (current.some((row) => row.id === provider.id)) {
        return current;
      }
      return [...current, provider];
    });
  };

  const inlineProviderCategory = isCardCategory
    ? cardCategoryId != null
      ? ({ code: "card" as const, benefitCategoryId: cardCategoryId })
      : null
    : isMembershipCategory
      ? membershipCategoryId != null
        ? ({ code: "membership" as const, benefitCategoryId: membershipCategoryId })
        : null
      : null;

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
                setIsAllProduct(false);
              }}
              required
            >
              <option value="" disabled>
                카테고리 선택
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {formatBenefitCategoryDisplayName(category.code, category.name)}
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
            {inlineProviderCategory ? (
              <InlineProviderAddPanel
                categoryCode={inlineProviderCategory.code}
                benefitCategoryId={inlineProviderCategory.benefitCategoryId}
                visible
                disabled={!selectedCategoryId}
                onProviderCreated={handleProviderUpsert}
                onSelectProvider={setSelectedProviderId}
              />
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
              placeholder={
                isMembershipCategory ? membershipDefaultName : "예: KT VIP"
              }
              required={!isMembershipCategory}
            />
            {isMembershipCategory ? (
              <div className="form-text">
                비워두면 제공사명 기준으로 `{membershipDefaultName}` 형식으로
                저장됩니다. benefit_type=all · is_all_product=true · grade=전체
                패턴이 적용됩니다.
              </div>
            ) : null}
            {state.fieldErrors?.name ? (
              <div className="form-text text-danger">
                {state.fieldErrors.name}
              </div>
            ) : null}
          </div>

          {isMembershipCategory ? (
            <div className="col-12">
              <div className="alert alert-light border mb-0 py-2 small">
                membership 상품은 제공사별 <strong>전체</strong> 상품 1건으로
                관리됩니다. 제공사 등록 시 자동 생성되며, 여기서는 이름·활성
                상태를 동기화할 수 있습니다.
              </div>
            </div>
          ) : null}

          {isCardCategory ? (
            <>
              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    id="is_all_product"
                    name="is_all_product"
                    className="form-check-input"
                    type="checkbox"
                    checked={isAllProduct}
                    onChange={(event) => setIsAllProduct(event.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="is_all_product">
                    카드사 전체 상품
                  </label>
                </div>
                <div className="form-text">
                  활성화 시 benefit_type=all 로 저장되며, 해당 카드사 전체 할인에
                  매칭됩니다.
                </div>
              </div>

              {!isAllProduct ? (
                <div className="col-md-6">
                  <label
                    className="form-label fw-semibold"
                    htmlFor="benefit_type"
                  >
                    카드 혜택 유형
                  </label>
                  <select
                    id="benefit_type"
                    name="benefit_type"
                    className="form-select"
                    defaultValue={defaultBenefitType}
                  >
                    <option value="">선택 안 함</option>
                    <option value="credit">신용 (credit)</option>
                    <option value="debit">체크 (debit)</option>
                    <option value="prepaid">선불 (prepaid)</option>
                  </select>
                  {state.fieldErrors?.benefit_type ? (
                    <div className="form-text text-danger">
                      {state.fieldErrors.benefit_type}
                    </div>
                  ) : null}
                </div>
              ) : (
                <input type="hidden" name="benefit_type" value="all" />
              )}
            </>
          ) : null}

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
                disabled={isMembershipCategory}
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
                disabled={isMembershipCategory}
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
