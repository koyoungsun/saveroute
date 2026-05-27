import {
  BRAND_PAYMENT_APPLY_MODES,
  BRAND_PRICE_INPUT_MODES,
} from "@/lib/search/price-board-mode-types";

const PRICE_INPUT_LABELS: Record<(typeof BRAND_PRICE_INPUT_MODES)[number], string> = {
  manual_total: "총액 직접 입력",
  per_person: "1인 가격 × 인원",
  ticket_type: "권종별 가격 선택",
};

const PAYMENT_APPLY_LABELS: Record<(typeof BRAND_PAYMENT_APPLY_MODES)[number], string> = {
  single: "한 번에 결제",
  grouped_prepay: "여러 명 함께 예매",
  split: "혜택 나눠 결제",
};

type BrandPriceBoardModeFieldsProps = {
  priceInputMode?: string | null;
  paymentApplyMode?: string | null;
  disabled?: boolean;
};

export function BrandPriceBoardModeFields({
  priceInputMode = null,
  paymentApplyMode = null,
  disabled = false,
}: BrandPriceBoardModeFieldsProps) {
  return (
    <fieldset className="sr-admin-brand-edit__modes" disabled={disabled}>
      <p className="form-text sr-admin-brand-edit__modes-help">
        비워 두면 검색 화면에서 자동 추론합니다.
      </p>

      <div className="sr-admin-brand-edit__modes-grid">
        <div className="sr-admin-brand-edit__modes-group">
          <label className="form-label fw-semibold" htmlFor="price_input_mode">
            요금 입력 방식
          </label>
          <select
            id="price_input_mode"
            name="price_input_mode"
            className="form-select"
            defaultValue={priceInputMode ?? ""}
          >
            <option value="">자동 추론</option>
            {BRAND_PRICE_INPUT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {PRICE_INPUT_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>

        <div className="sr-admin-brand-edit__modes-group">
          <label className="form-label fw-semibold" htmlFor="payment_apply_mode">
            결제 적용 방식
          </label>
          <select
            id="payment_apply_mode"
            name="payment_apply_mode"
            className="form-select"
            defaultValue={paymentApplyMode ?? ""}
          >
            <option value="">자동 추론</option>
            {BRAND_PAYMENT_APPLY_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {PAYMENT_APPLY_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  );
}
