-- =============================================================================
-- SaveRoute 검색·혜택 개인화 QA 시드 (구조 검증용)
-- - 운영 데이터 구분: admin_memo LIKE 'QA_SEED|%' (LIKE에서 [] 문자 클래스 회피)
-- - 재실행 안전: 동일 태그 할인·브랜드 선삭제 후 삽입
-- 시나리오: KT 등록 → 스타벅스 검색 → KT 할인에 «내 할인 가능»
-- =============================================================================

DELETE FROM public.discounts
WHERE admin_memo LIKE 'QA_SEED|%';

DELETE FROM public.brands
WHERE admin_memo LIKE 'QA_SEED|%';

INSERT INTO public.brands (name, slug, category_id, aliases, official_url, is_active, admin_memo)
VALUES
  (
    '스타벅스',
    'qa-starbucks',
    (SELECT id FROM public.brand_categories WHERE code = 'food' LIMIT 1),
    ARRAY['starbucks', '스타벅스코리아', 'STARBUCKS']::TEXT[],
    'https://www.starbucks.co.kr',
    TRUE,
    'QA_SEED| 브랜드 · 검색/혜택 개인화 QA'
  ),
  (
    'CGV',
    'qa-cgv',
    (SELECT id FROM public.brand_categories WHERE code = 'leisure' LIMIT 1),
    ARRAY['씨지브이', 'cgv']::TEXT[],
    'https://www.cgv.co.kr',
    TRUE,
    'QA_SEED| 브랜드 · 검색/혜택 개인화 QA'
  ),
  (
    '메가커피',
    'qa-megacoffee',
    (SELECT id FROM public.brand_categories WHERE code = 'food' LIMIT 1),
    ARRAY['메가 커피', 'megacoffee']::TEXT[],
    'https://www.mega-mgcc.co.kr',
    TRUE,
    'QA_SEED| 브랜드 · 검색/혜택 개인화 QA'
  ),
  (
    '배스킨라빈스',
    'qa-baskinrobbins',
    (SELECT id FROM public.brand_categories WHERE code = 'food' LIMIT 1),
    ARRAY['베라', 'baskin', 'BR']::TEXT[],
    'https://www.baskinrobbins.co.kr',
    TRUE,
    'QA_SEED| 브랜드 · 검색/혜택 개인화 QA'
  ),
  (
    '파리바게뜨',
    'qa-parisbaguette',
    (SELECT id FROM public.brand_categories WHERE code = 'food' LIMIT 1),
    ARRAY['파리바게트', 'paris baguette', '파바']::TEXT[],
    'https://www.paris.co.kr',
    TRUE,
    'QA_SEED| 브랜드 · 검색/혜택 개인화 QA'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category_id = EXCLUDED.category_id,
  aliases = EXCLUDED.aliases,
  official_url = EXCLUDED.official_url,
  is_active = TRUE,
  admin_memo = EXCLUDED.admin_memo,
  updated_at = NOW();

INSERT INTO public.discounts (
  brand_id,
  benefit_category_id,
  provider_id,
  benefit_product_id,
  title,
  summary,
  condition_text,
  discount_value,
  discount_unit,
  usage_type,
  is_stackable,
  valid_until,
  has_no_expiry,
  source_url,
  last_checked_at,
  data_confidence,
  status,
  admin_memo
)
VALUES
  (
    (SELECT id FROM public.brands WHERE slug = 'qa-starbucks' LIMIT 1),
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom' LIMIT 1),
    (SELECT id FROM public.providers WHERE code = 'kt' LIMIT 1),
    (SELECT id FROM public.benefit_products WHERE code = 'kt_vip' LIMIT 1),
    'KT 멤버십 스타벅스 할인',
    'QA_SEED| KT VIP 멤버십 스타벅스 음료 할인(임시율)',
    '멤버십 앱에서 결제 시 적용된다고 가정한 QA 문구입니다.',
    30,
    'percent',
    'membership_app',
    FALSE,
    NULL,
    TRUE,
    'https://example.com/qa/kt-starbucks',
    CURRENT_DATE,
    'medium',
    'active',
    'QA_SEED| KT 멤버십 스타벅스 · personalization QA'
  ),
  (
    (SELECT id FROM public.brands WHERE slug = 'qa-cgv' LIMIT 1),
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom' LIMIT 1),
    (SELECT id FROM public.providers WHERE code = 'skt' LIMIT 1),
    (SELECT id FROM public.benefit_products WHERE code = 'skt_tmembership' LIMIT 1),
    'SKT 멤버십 CGV 할인',
    'QA_SEED| SKT T멤버십 CGV 관람 할인(임시율)',
    'T멤버십 앱 예매 시 적용된다고 가정한 QA 문구입니다.',
    2000,
    'won',
    'app_booking',
    FALSE,
    NULL,
    TRUE,
    'https://example.com/qa/skt-cgv',
    CURRENT_DATE,
    'medium',
    'active',
    'QA_SEED| SKT 멤버십 CGV · personalization QA'
  ),
  (
    (SELECT id FROM public.brands WHERE slug = 'qa-baskinrobbins' LIMIT 1),
    (SELECT id FROM public.benefit_categories WHERE code = 'telecom' LIMIT 1),
    (SELECT id FROM public.providers WHERE code = 'lguplus' LIMIT 1),
    (SELECT id FROM public.benefit_products WHERE code = 'lguplus_vip' LIMIT 1),
    'LG U+ 배스킨라빈스 할인',
    'QA_SEED| U+ VIP 배스킨라빈스 할인(임시율)',
    'U+ 멤버십 제휴 결제 시 적용된다고 가정한 QA 문구입니다.',
    15,
    'percent',
    'membership_app',
    FALSE,
    NULL,
    TRUE,
    'https://example.com/qa/lgu-baskin',
    CURRENT_DATE,
    'medium',
    'active',
    'QA_SEED| LG U+ 배스킨라빈스 · personalization QA'
  ),
  (
    (SELECT id FROM public.brands WHERE slug = 'qa-megacoffee' LIMIT 1),
    (SELECT id FROM public.benefit_categories WHERE code = 'card' LIMIT 1),
    (SELECT id FROM public.providers WHERE code = 'shinhan_card' LIMIT 1),
    (SELECT id FROM public.benefit_products WHERE code = 'shinhan_deep_dream' LIMIT 1),
    '신한카드 메가커피 할인',
    'QA_SEED| 신한 Deep Dream 메가커피 할인(임시율)',
    '신한카드 현장 결제 시 적용된다고 가정한 QA 문구입니다.',
    10,
    'percent',
    'onsite_payment',
    FALSE,
    NULL,
    TRUE,
    'https://example.com/qa/shinhan-mega',
    CURRENT_DATE,
    'medium',
    'active',
    'QA_SEED| 신한카드 메가커피 · personalization QA'
  ),
  (
    (SELECT id FROM public.brands WHERE slug = 'qa-parisbaguette' LIMIT 1),
    (SELECT id FROM public.benefit_categories WHERE code = 'card' LIMIT 1),
    (SELECT id FROM public.providers WHERE code = 'kb_card' LIMIT 1),
    (SELECT id FROM public.benefit_products WHERE code = 'kb_nori_check' LIMIT 1),
    'KB국민카드 파리바게뜨 할인',
    'QA_SEED| KB국민 노리 체크 파리바게뜨 할인(임시율)',
    'KB국민 체크카드 결제 시 적용된다고 가정한 QA 문구입니다.',
    5,
    'percent',
    'onsite_payment',
    FALSE,
    NULL,
    TRUE,
    'https://example.com/qa/kb-paris',
    CURRENT_DATE,
    'medium',
    'active',
    'QA_SEED| KB국민카드 파리바게뜨 · personalization QA'
  );

-- 미등록 브랜드 QA 예시 검색어: «테스트미등록브랜드123» 등 (브랜드 미매칭 시 빈 상태·등록 요청 플로우 확인)
