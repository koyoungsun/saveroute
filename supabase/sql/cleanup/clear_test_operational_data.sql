-- 테스트 운영 데이터 초기화 (실데이터 입력 전)
-- 실행: Supabase SQL Editor 또는 psql
-- Node fallback: npm run cleanup:test-operational-data
--
-- 유지: benefit_categories, providers, benefit_products(시드·카드사 전체 포함),
--       brand_categories, admin_accounts, profiles, user_benefits, promo_slots, coupons(행 유지·brand_id만 해제)
--
-- 삭제: result_click_logs, search_logs, brand_requests, discounts, brands,
--       daily_search_stats, brand_daily_stats, brand_request_daily_stats, segment_search_stats
--
-- FK 순서: logs → stats/requests → discounts → (coupons.brand_id 해제) → brands

-- =============================================================================
-- §0 삭제 전 COUNT
-- =============================================================================
SELECT 'BEFORE' AS phase, 'result_click_logs' AS table_name, COUNT(*)::bigint AS row_count
FROM public.result_click_logs
UNION ALL SELECT 'BEFORE', 'search_logs', COUNT(*)::bigint FROM public.search_logs
UNION ALL SELECT 'BEFORE', 'brand_request_daily_stats', COUNT(*)::bigint FROM public.brand_request_daily_stats
UNION ALL SELECT 'BEFORE', 'brand_daily_stats', COUNT(*)::bigint FROM public.brand_daily_stats
UNION ALL SELECT 'BEFORE', 'segment_search_stats', COUNT(*)::bigint FROM public.segment_search_stats
UNION ALL SELECT 'BEFORE', 'daily_search_stats', COUNT(*)::bigint FROM public.daily_search_stats
UNION ALL SELECT 'BEFORE', 'brand_requests', COUNT(*)::bigint FROM public.brand_requests
UNION ALL SELECT 'BEFORE', 'discounts', COUNT(*)::bigint FROM public.discounts
UNION ALL SELECT 'BEFORE', 'brands', COUNT(*)::bigint FROM public.brands
UNION ALL SELECT 'BEFORE', 'coupons_with_brand', COUNT(*)::bigint FROM public.coupons WHERE brand_id IS NOT NULL
ORDER BY table_name;

BEGIN;

-- §1 클릭·검색 로그
DELETE FROM public.result_click_logs;
DELETE FROM public.search_logs;

-- §2 집계·요청 (brands/discounts FK 전)
DELETE FROM public.brand_request_daily_stats;
DELETE FROM public.brand_daily_stats;
DELETE FROM public.segment_search_stats;
DELETE FROM public.daily_search_stats;
DELETE FROM public.brand_requests;

-- §3 할인
DELETE FROM public.discounts;

-- §4 brands FK 참조 해제 (coupons 행은 유지)
UPDATE public.coupons
SET brand_id = NULL,
    updated_at = NOW()
WHERE brand_id IS NOT NULL;

-- §5 브랜드
DELETE FROM public.brands;

COMMIT;

-- =============================================================================
-- §6 삭제 후 COUNT (대상 테이블 0 기대, coupons_with_brand 0 기대)
-- =============================================================================
SELECT 'AFTER' AS phase, 'result_click_logs' AS table_name, COUNT(*)::bigint AS row_count
FROM public.result_click_logs
UNION ALL SELECT 'AFTER', 'search_logs', COUNT(*)::bigint FROM public.search_logs
UNION ALL SELECT 'AFTER', 'brand_request_daily_stats', COUNT(*)::bigint FROM public.brand_request_daily_stats
UNION ALL SELECT 'AFTER', 'brand_daily_stats', COUNT(*)::bigint FROM public.brand_daily_stats
UNION ALL SELECT 'AFTER', 'segment_search_stats', COUNT(*)::bigint FROM public.segment_search_stats
UNION ALL SELECT 'AFTER', 'daily_search_stats', COUNT(*)::bigint FROM public.daily_search_stats
UNION ALL SELECT 'AFTER', 'brand_requests', COUNT(*)::bigint FROM public.brand_requests
UNION ALL SELECT 'AFTER', 'discounts', COUNT(*)::bigint FROM public.discounts
UNION ALL SELECT 'AFTER', 'brands', COUNT(*)::bigint FROM public.brands
UNION ALL SELECT 'AFTER', 'coupons_with_brand', COUNT(*)::bigint FROM public.coupons WHERE brand_id IS NOT NULL
ORDER BY table_name;

-- =============================================================================
-- §7 유지 데이터 sanity (삭제하지 않음 — 참고용 COUNT)
-- =============================================================================
SELECT 'PRESERVED' AS phase, 'benefit_categories' AS table_name, COUNT(*)::bigint AS row_count
FROM public.benefit_categories
UNION ALL SELECT 'PRESERVED', 'providers', COUNT(*)::bigint FROM public.providers
UNION ALL SELECT 'PRESERVED', 'benefit_products', COUNT(*)::bigint FROM public.benefit_products
UNION ALL SELECT 'PRESERVED', 'benefit_products_all', COUNT(*)::bigint
FROM public.benefit_products WHERE is_all_product = TRUE AND benefit_type = 'all'
UNION ALL SELECT 'PRESERVED', 'brand_categories', COUNT(*)::bigint FROM public.brand_categories
UNION ALL SELECT 'PRESERVED', 'profiles', COUNT(*)::bigint FROM public.profiles
UNION ALL SELECT 'PRESERVED', 'admin_accounts', COUNT(*)::bigint FROM public.admin_accounts
UNION ALL SELECT 'PRESERVED', 'user_benefits', COUNT(*)::bigint FROM public.user_benefits
ORDER BY table_name;
