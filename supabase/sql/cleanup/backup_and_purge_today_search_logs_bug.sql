-- search_logs: SSR 자동 INSERT 버그로 쌓인 "오늘(KST)" 테스트 데이터 백업 후 삭제
-- 대상: 전체 truncate 아님 — KST 오늘 00:00~내일 00:00 범위만
-- 실행: Supabase SQL Editor (개발/테스트 DB 전용)
--
-- §0 실행 전 확인 — 백업 테이블명을 오늘 날짜로 바꿔 주세요 (예: search_logs_backup_20260521)

-- =============================================================================
-- §1 삭제 전 COUNT
-- =============================================================================
SELECT 'BEFORE' AS phase, 'search_logs_all' AS scope, COUNT(*)::bigint AS row_count
FROM public.search_logs
UNION ALL
SELECT 'BEFORE', 'search_logs_today_kst', COUNT(*)::bigint
FROM public.search_logs
WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date = (now() AT TIME ZONE 'Asia/Seoul')::date
UNION ALL
SELECT 'BEFORE', 'search_logs_before_today_kst', COUNT(*)::bigint
FROM public.search_logs
WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date < (now() AT TIME ZONE 'Asia/Seoul')::date
ORDER BY scope;

-- 오늘(KST) 키워드별 중복 확인 (버그 패턴 점검)
SELECT
  normalized_keyword,
  COUNT(*)::bigint AS row_count,
  MIN(created_at) AS first_at,
  MAX(created_at) AS last_at
FROM public.search_logs
WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date = (now() AT TIME ZONE 'Asia/Seoul')::date
GROUP BY normalized_keyword
ORDER BY row_count DESC, normalized_keyword
LIMIT 20;

-- =============================================================================
-- §2 백업 (KST 오늘 범위만)
-- =============================================================================
-- 아래 backup_suffix 를 YYYYMMDD 로 수정 후 실행
-- 예: search_logs_backup_20260521

DROP TABLE IF EXISTS public.search_logs_backup_dev;

CREATE TABLE public.search_logs_backup_dev AS
SELECT
  sl.*,
  now() AS backed_up_at,
  (now() AT TIME ZONE 'Asia/Seoul')::date AS backup_kst_date
FROM public.search_logs sl
WHERE (sl.created_at AT TIME ZONE 'Asia/Seoul')::date = (now() AT TIME ZONE 'Asia/Seoul')::date;

COMMENT ON TABLE public.search_logs_backup_dev IS
  'search_logs KST 오늘 범위 백업 (SSR 자동 INSERT 버그 정리용). 확인 후 DROP 가능.';

SELECT COUNT(*)::bigint AS backed_up_rows FROM public.search_logs_backup_dev;

-- =============================================================================
-- §3 삭제 (KST 오늘 search_logs 만)
-- =============================================================================
BEGIN;

DELETE FROM public.search_logs
WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date = (now() AT TIME ZONE 'Asia/Seoul')::date;

COMMIT;

-- =============================================================================
-- §4 삭제 후 COUNT
-- =============================================================================
SELECT 'AFTER' AS phase, 'search_logs_all' AS scope, COUNT(*)::bigint AS row_count
FROM public.search_logs
UNION ALL
SELECT 'AFTER', 'search_logs_today_kst', COUNT(*)::bigint
FROM public.search_logs
WHERE (created_at AT TIME ZONE 'Asia/Seoul')::date = (now() AT TIME ZONE 'Asia/Seoul')::date
UNION ALL
SELECT 'AFTER', 'search_logs_backup_dev', COUNT(*)::bigint
FROM public.search_logs_backup_dev
ORDER BY scope;

-- =============================================================================
-- §5 (선택) daily_search_stats 오늘 행도 버그 집계가 섞였다면 초기화
-- =============================================================================
-- SELECT * FROM public.daily_search_stats
-- WHERE date = (now() AT TIME ZONE 'Asia/Seoul')::date;
--
-- BEGIN;
-- DELETE FROM public.daily_search_stats
-- WHERE date = (now() AT TIME ZONE 'Asia/Seoul')::date;
-- COMMIT;
