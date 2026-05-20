import {
  APPLY_BASIS_OPTIONS,
  STACKABLE_POLICY_OPTIONS,
  USAGE_CHANNEL_OPTIONS,
} from "@/lib/discounts/discount-detail-fields";

import { DiscountFormField } from "./DiscountFormField";

export type DiscountConditionDetailValues = {
  condition_text?: string | null;
  apply_basis?: string | null;
  stackable_policy?: string | null;
  usage_channel?: string | null;
  installment_condition?: string | null;
};

export function DiscountConditionDetailFields({
  values,
  showInstallment = true,
}: {
  values?: DiscountConditionDetailValues;
  showInstallment?: boolean;
}) {
  return (
    <div className="sr-discounts-form-section sr-discounts-condition-section">
      <p className="sr-discounts-group-title mb-2">적용 조건 상세</p>

      <div className="sr-discounts-form-fields">
        <DiscountFormField
          label="할인 조건 요약"
          htmlFor="condition_text"
          stack
          hint="사용자에게 노출되는 조건 요약입니다. 등록 시 최소·최대 금액은 기본 입력값과 함께 저장될 수 있습니다."
        >
          <textarea
            id="condition_text"
            name="condition_text"
            className="form-control"
            rows={3}
            defaultValue={values?.condition_text ?? ""}
            placeholder="예) 평일 런치 2인 이상 주문 시 / 메인 메뉴 1개 이상 주문 시"
          />
        </DiscountFormField>

        <div className="sr-discounts-condition-selects">
          <DiscountFormField label="적용 기준" htmlFor="apply_basis">
            <select
              id="apply_basis"
              name="apply_basis"
              className="form-select"
              defaultValue={values?.apply_basis ?? ""}
            >
              <option value="">선택 안 함</option>
              {APPLY_BASIS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </DiscountFormField>

          <DiscountFormField label="중복 가능 여부" htmlFor="stackable_policy">
            <select
              id="stackable_policy"
              name="stackable_policy"
              className="form-select"
              defaultValue={values?.stackable_policy ?? ""}
            >
              <option value="">선택 안 함</option>
              {STACKABLE_POLICY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </DiscountFormField>

          <DiscountFormField label="적용 채널" htmlFor="usage_channel">
            <select
              id="usage_channel"
              name="usage_channel"
              className="form-select"
              defaultValue={values?.usage_channel ?? ""}
            >
              <option value="">선택 안 함</option>
              {USAGE_CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </DiscountFormField>
        </div>

        {showInstallment ? (
          <DiscountFormField
            label="할부 조건"
            htmlFor="installment_condition"
            stack
            hint="선택 입력 · 검색 결과 「자세히 보기」에 결제 조건으로 표시됩니다."
          >
            <textarea
              id="installment_condition"
              name="installment_condition"
              className="form-control"
              rows={3}
              defaultValue={values?.installment_condition ?? ""}
              placeholder="예) 2~3개월 할부 시 적용 / 일시불 결제 시 적용 / 일시불·할부 모두 가능"
            />
          </DiscountFormField>
        ) : null}
      </div>
    </div>
  );
}
