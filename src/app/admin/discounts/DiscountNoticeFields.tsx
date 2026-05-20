export function DiscountNoticeFields({
  defaultValue = "",
}: {
  defaultValue?: string | null;
}) {
  return (
    <div className="col-12">
      <label className="form-label fw-semibold" htmlFor="notice_text">
        주의사항
      </label>
      <textarea
        id="notice_text"
        name="notice_text"
        className="form-control"
        rows={3}
        defaultValue={defaultValue ?? ""}
        placeholder="예) 타 쿠폰·프로모션과 중복 불가 / 일부 매장 제외 / 공휴일 제외"
      />
      <div className="sr-discounts-field__hint form-text mb-0">
        중복 불가, 매장 제외, 기간 제한 등은 주의사항으로 입력하세요. 검색 결과에서는
        「자세히 보기」에 노출됩니다.
      </div>
    </div>
  );
}
