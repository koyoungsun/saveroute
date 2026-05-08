"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { X } from "lucide-react";

import {
  addUserBenefitAction,
  deactivateUserBenefitAction,
  type BenefitActionState,
} from "@/app/(user)/my-benefits/actions";

export type BenefitCategoryOption = {
  id: number;
  name: string;
  code: string;
};

export type ProviderOption = {
  id: number;
  name: string;
  benefit_category_id: number;
};

export type BenefitProductOption = {
  id: number;
  name: string;
  benefit_category_id: number;
  provider_id: number;
};

export type RegisteredUserBenefit = {
  id: number;
  benefit_category_id: number;
  provider_id: number;
  benefit_product_id: number | null;
  created_at: string;
  benefit_category: { name: string } | { name: string }[] | null;
  provider: { name: string } | { name: string }[] | null;
  benefit_product: { name: string } | { name: string }[] | null;
};

type BenefitFormProps = {
  categories: BenefitCategoryOption[];
  providers: ProviderOption[];
  benefitProducts: BenefitProductOption[];
  userBenefits: RegisteredUserBenefit[];
};

const initialState: BenefitActionState = {};

function relationName(relation: { name: string } | { name: string }[] | null) {
  if (Array.isArray(relation)) {
    return relation[0]?.name ?? "-";
  }

  return relation?.name ?? "-";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-gray-950 py-3 text-base font-semibold text-white hover:bg-gray-900 disabled:opacity-50"
    >
      {pending ? "저장 중..." : "혜택 저장"}
    </button>
  );
}

function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label={`${label} 삭제`}
      disabled={pending}
      className="shrink-0 rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
    >
      <X className="size-4" aria-hidden="true" />
    </button>
  );
}

export function BenefitForm({
  categories,
  providers,
  benefitProducts,
  userBenefits,
}: BenefitFormProps) {
  const [state, formAction] = useActionState(addUserBenefitAction, initialState);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  const filteredProviders = useMemo(
    () =>
      selectedCategoryId
        ? providers.filter(
            (provider) =>
              provider.benefit_category_id === Number(selectedCategoryId),
          )
        : [],
    [providers, selectedCategoryId],
  );

  const filteredProducts = useMemo(
    () =>
      selectedCategoryId && selectedProviderId
        ? benefitProducts.filter(
            (product) =>
              product.benefit_category_id === Number(selectedCategoryId) &&
              product.provider_id === Number(selectedProviderId),
          )
        : [],
    [benefitProducts, selectedCategoryId, selectedProviderId],
  );

  return (
    <div className="space-y-5">
      <form action={formAction} className="rounded-3xl bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-950">혜택상품 등록</h2>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            보유 중인 카드, 통신사 멤버십, 쿠폰, 멤버십 상품을 등록하면 검색
            결과에서 내 혜택을 먼저 보여드려요.
          </p>
        </div>

        {state.message ? (
          <p className="mt-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
            {state.message}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="benefit_category_id"
              className="text-sm font-semibold text-gray-800"
            >
              혜택 카테고리
            </label>
            <select
              id="benefit_category_id"
              name="benefit_category_id"
              value={selectedCategoryId}
              onChange={(event) => {
                setSelectedCategoryId(event.target.value);
                setSelectedProviderId("");
                setSelectedProductId("");
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500"
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
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.benefit_category_id}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="provider_id"
              className="text-sm font-semibold text-gray-800"
            >
              제공사
            </label>
            <select
              id="provider_id"
              name="provider_id"
              value={selectedProviderId}
              onChange={(event) => {
                setSelectedProviderId(event.target.value);
                setSelectedProductId("");
              }}
              disabled={!selectedCategoryId}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
              required
            >
              <option value="" disabled>
                {selectedCategoryId ? "제공사 선택" : "카테고리 먼저 선택"}
              </option>
              {filteredProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            {state.fieldErrors?.provider_id ? (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.provider_id}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="benefit_product_id"
              className="text-sm font-semibold text-gray-800"
            >
              혜택상품
            </label>
            <select
              id="benefit_product_id"
              name="benefit_product_id"
              value={selectedProductId}
              onChange={(event) => setSelectedProductId(event.target.value)}
              disabled={!selectedProviderId}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400"
              required
            >
              <option value="" disabled>
                {selectedProviderId ? "혜택상품 선택" : "제공사 먼저 선택"}
              </option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            {state.fieldErrors?.benefit_product_id ? (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.benefit_product_id}
              </p>
            ) : null}
          </div>

          <SubmitButton />
        </div>
      </form>

      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-950">등록된 혜택</h2>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600">
            {userBenefits.length}개
          </span>
        </div>

        {userBenefits.length > 0 ? (
          <ul className="mt-4 divide-y divide-gray-100">
            {userBenefits.map((benefit) => {
              const productName = relationName(benefit.benefit_product);

              return (
                <li
                  key={benefit.id}
                  className="flex items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-950">
                      {productName}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {relationName(benefit.benefit_category)} ·{" "}
                      {relationName(benefit.provider)}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      등록일 {formatDate(benefit.created_at)}
                    </p>
                  </div>
                  <form action={deactivateUserBenefitAction}>
                    <input
                      type="hidden"
                      name="user_benefit_id"
                      value={benefit.id}
                    />
                    <DeleteButton label={productName} />
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">
              등록된 혜택이 없습니다.
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              혜택상품을 등록하면 검색 결과에서 보유 혜택을 더 쉽게 찾을 수
              있어요.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
