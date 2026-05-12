CREATE TABLE IF NOT EXISTS public.promo_slots (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  badge TEXT NOT NULL,
  image_url TEXT,
  href TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  sponsor_name TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT promo_slots_period_check
    CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at <= ends_at)
);

CREATE INDEX IF NOT EXISTS idx_promo_slots_active_period_priority
  ON public.promo_slots (is_active, priority DESC, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_promo_slots_created_at
  ON public.promo_slots (created_at DESC);

INSERT INTO public.promo_slots (
  title,
  description,
  badge,
  href,
  priority,
  is_active,
  is_sponsored
)
SELECT
  '이번 주 인기 할인 모아보기',
  '자주 쓰는 브랜드 혜택을 한눈에 확인하세요.',
  '추천 할인',
  '/search?keyword=스타벅스',
  30,
  TRUE,
  FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.promo_slots
  WHERE title = '이번 주 인기 할인 모아보기'
    AND href = '/search?keyword=스타벅스'
);

INSERT INTO public.promo_slots (
  title,
  description,
  badge,
  href,
  priority,
  is_active,
  is_sponsored,
  sponsor_name
)
SELECT
  '카드 혜택 놓치지 않기',
  '보유 카드 기준으로 더 좋은 할인을 찾아드려요.',
  '카드 혜택',
  '/search?keyword=CGV',
  20,
  TRUE,
  TRUE,
  'SaveRoute 제휴'
WHERE NOT EXISTS (
  SELECT 1 FROM public.promo_slots
  WHERE title = '카드 혜택 놓치지 않기'
    AND href = '/search?keyword=CGV'
);

INSERT INTO public.promo_slots (
  title,
  description,
  badge,
  href,
  priority,
  is_active,
  is_sponsored
)
SELECT
  '멤버십 중복 혜택 체크',
  '통신사와 멤버십 혜택을 함께 비교해보세요.',
  '멤버십',
  '/search?keyword=롯데월드',
  10,
  TRUE,
  FALSE
WHERE NOT EXISTS (
  SELECT 1 FROM public.promo_slots
  WHERE title = '멤버십 중복 혜택 체크'
    AND href = '/search?keyword=롯데월드'
);

CREATE OR REPLACE FUNCTION public.set_promo_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_promo_slots_updated_at ON public.promo_slots;
CREATE TRIGGER set_promo_slots_updated_at
  BEFORE UPDATE ON public.promo_slots
  FOR EACH ROW
  EXECUTE FUNCTION public.set_promo_slots_updated_at();

ALTER TABLE public.promo_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read active promo slots" ON public.promo_slots;
CREATE POLICY "public can read active promo slots"
  ON public.promo_slots FOR SELECT
  TO anon, authenticated
  USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

DROP POLICY IF EXISTS "admins can manage promo slots" ON public.promo_slots;
CREATE POLICY "admins can manage promo slots"
  ON public.promo_slots FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
