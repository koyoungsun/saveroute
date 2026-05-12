-- 세이브루트 기본 데이터: benefit_categories 보강, 통신 3사·알뜰폰 MVNO, 알뜰폰당 기본 회선 상품 1건
-- 멱등: benefit_categories.code / providers.code / benefit_products.code 기준 ON CONFLICT

-- optional: 사용망·메모 (스키마에 없을 때만 추가)
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS memo TEXT;

-- ---------------------------------------------------------------------------
-- 1) benefit_categories
-- ---------------------------------------------------------------------------
INSERT INTO public.benefit_categories (code, name, description, sort_order)
VALUES
  ('telecom', '통신사', '이동통신 3사(망) 멤버십·회선', 1),
  ('mvno', '알뜰폰', 'MVNO 알뜰 통신사', 2),
  ('card', '카드', '신용·체크·선불 카드 혜택', 3),
  ('coupon', '쿠폰', '쿠폰·프로모션 연동 혜택', 4),
  ('membership', '멤버십', '외부 멤버십·제휴 혜택', 5)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = COALESCE(EXCLUDED.description, public.benefit_categories.description),
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 2) 기존 시드에 있던 MVNO 3사 → 카테고리 mvno 로 이동 (FK는 동일 id 유지)
-- ---------------------------------------------------------------------------
UPDATE public.providers AS p
SET
  benefit_category_id = (SELECT id FROM public.benefit_categories WHERE code = 'mvno' LIMIT 1),
  updated_at = NOW()
WHERE p.code IN ('kt_m_mobile', 'sk_7mobile', 'uplus_mvno');

-- ---------------------------------------------------------------------------
-- 3) 통신 3사 (telecom_major · 카테고리 telecom)
-- ---------------------------------------------------------------------------
INSERT INTO public.providers (benefit_category_id, name, code, provider_type, is_active, memo)
SELECT
  (SELECT id FROM public.benefit_categories WHERE code = 'telecom' LIMIT 1),
  v.name,
  v.code,
  'telecom_major'::TEXT,
  TRUE,
  v.memo
FROM (VALUES
  ('SKT', 'skt', '망: SKT'),
  ('KT', 'kt', '망: KT'),
  ('LG U+', 'lguplus', '망: LG U+')
) AS v(name, code, memo)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_type = EXCLUDED.provider_type,
  memo = COALESCE(EXCLUDED.memo, public.providers.memo),
  is_active = TRUE,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- 4) 알뜰폰 MVNO 브랜드 (telecom_mvno · 카테고리 mvno)
--    display name / code(slug) / memo(사용망 안내)
-- ---------------------------------------------------------------------------
INSERT INTO public.providers (benefit_category_id, name, code, provider_type, is_active, memo)
SELECT
  (SELECT id FROM public.benefit_categories WHERE code = 'mvno' LIMIT 1),
  v.name,
  v.code,
  'telecom_mvno'::TEXT,
  TRUE,
  v.memo
FROM (VALUES
  ('LG헬로모바일', 'lg-hello-mobile', 'MVNO · 사용망: LG U+'),
  ('프리티', 'pretty', 'MVNO · 사용망: KT'),
  ('티플러스', 't-plus', 'MVNO · 사용망: SKT'),
  ('모빙', 'mobing', 'MVNO · 사용망: SKT'),
  ('이야기모바일', 'iyagi-mobile', 'MVNO · 사용망: LG U+'),
  ('리브모바일', 'live-mobile', 'MVNO · 사용망: SKT'),
  ('스노우맨', 'snowman-mobile', 'MVNO · 사용망: SKT'),
  ('스마텔', 'smartel', 'MVNO · 사용망: SKT'),
  ('아이즈모바일', 'eyes-mobile', 'MVNO · 사용망: SKT'),
  ('에넥스텔레콤', 'enextelecom', 'MVNO · 사용망: KT'),
  ('안심모바일', 'ansim-mobile', 'MVNO · 사용망: KT'),
  ('우체국 알뜰폰', 'epost-mobile', 'MVNO · 사용망: KT (우체국 알뜰폰)'),
  ('스카이라이프모바일', 'skylife-mobile', 'MVNO · 사용망: LG U+'),
  ('토스모바일', 'toss-mobile', 'MVNO · 사용망: SKT')
) AS v(name, code, memo)
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_type = EXCLUDED.provider_type,
  memo = COALESCE(EXCLUDED.memo, public.providers.memo),
  is_active = TRUE,
  updated_at = NOW();

-- 기존 코드와 이름만 요청 명칭으로 맞춤 (같은 사업자·다른 표기 병합)
UPDATE public.providers
SET
  name = 'KT엠모바일',
  memo = COALESCE(memo, 'MVNO · 사용망: KT'),
  benefit_category_id = (SELECT id FROM public.benefit_categories WHERE code = 'mvno' LIMIT 1),
  updated_at = NOW()
WHERE code = 'kt_m_mobile';

UPDATE public.providers
SET
  name = 'SK세븐모바일',
  memo = COALESCE(memo, 'MVNO · 사용망: SKT'),
  benefit_category_id = (SELECT id FROM public.benefit_categories WHERE code = 'mvno' LIMIT 1),
  updated_at = NOW()
WHERE code = 'sk_7mobile';

UPDATE public.providers
SET
  name = 'U+유모바일',
  memo = COALESCE(memo, 'MVNO · 사용망: LG U+'),
  benefit_category_id = (SELECT id FROM public.benefit_categories WHERE code = 'mvno' LIMIT 1),
  updated_at = NOW()
WHERE code = 'uplus_mvno';

-- KT엠모바일·SK세븐모바일·U+유모바일 은 시드 코드 kt_m_mobile · sk_7mobile · uplus_mvno 로만 유지 (FK 호환)

-- ---------------------------------------------------------------------------
-- 5) benefit_products: MVNO provider 당 «기본 회선» 1건 (코드: {provider_code}_default_line)
--    요금제 세분화 없음 · telecom_mvno_plan + is_mvno
-- ---------------------------------------------------------------------------
INSERT INTO public.benefit_products (
  benefit_category_id,
  provider_id,
  name,
  code,
  product_type,
  grade,
  card_type,
  is_mvno,
  mvno_notice_required,
  is_active
)
SELECT
  p.benefit_category_id,
  p.id,
  p.name || ' 기본 회선',
  p.code || '_default_line',
  'telecom_mvno_plan'::TEXT,
  NULL::TEXT,
  NULL::TEXT,
  TRUE,
  TRUE,
  TRUE
FROM public.providers p
WHERE p.provider_type = 'telecom_mvno'
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  benefit_category_id = EXCLUDED.benefit_category_id,
  provider_id = EXCLUDED.provider_id,
  product_type = EXCLUDED.product_type,
  is_mvno = EXCLUDED.is_mvno,
  mvno_notice_required = EXCLUDED.mvno_notice_required,
  is_active = TRUE,
  updated_at = NOW();

-- 기존 시드 요금제 행이 있어도 그대로 두고, default_line 을 대표 선택지로 추가함 (중복 행 허용·운영에서 정리 가능)

-- MVNO 상품 카테고리 id를 provider 와 일치시킴
UPDATE public.benefit_products bp
SET
  benefit_category_id = p.benefit_category_id,
  updated_at = NOW()
FROM public.providers p
WHERE bp.provider_id = p.id
  AND p.provider_type = 'telecom_mvno'
  AND bp.benefit_category_id IS DISTINCT FROM p.benefit_category_id;
