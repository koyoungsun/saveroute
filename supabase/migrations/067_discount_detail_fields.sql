-- 외식 등 복합 할인 조건 보조 필드 (nullable, 기존 행 영향 없음)

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS apply_basis TEXT
    CHECK (apply_basis IS NULL OR apply_basis IN ('order', 'person', 'table', 'menu'));

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS stackable_policy TEXT
    CHECK (
      stackable_policy IS NULL
      OR stackable_policy IN ('stackable', 'not_stackable', 'partial')
    );

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS usage_channel TEXT
    CHECK (
      usage_channel IS NULL
      OR usage_channel IN ('offline', 'online', 'app', 'phone', 'all')
    );

ALTER TABLE public.discounts
  ADD COLUMN IF NOT EXISTS notice_text TEXT;

COMMENT ON COLUMN public.discounts.apply_basis IS
  '적용 기준: order(결제 건당) / person(1인당) / table(테이블당) / menu(메뉴당)';

COMMENT ON COLUMN public.discounts.stackable_policy IS
  '중복 정책: stackable / not_stackable / partial';

COMMENT ON COLUMN public.discounts.usage_channel IS
  '적용 채널: offline / online / app / phone / all';

COMMENT ON COLUMN public.discounts.notice_text IS
  '주의사항(중복 불가, 매장 제외, 기간 제한 등). condition_text는 할인 조건 요약.';
