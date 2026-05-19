# SQL 참고 스크립트 (수동 실행 전용)

이 폴더에 있는 `.sql` 파일은 **문서화·디버깅·일회 정비** 목적입니다.

| 위치 | 용도 |
|------|------|
| `saveroute/supabase/migrations/*.sql` | Supabase 마이그레이션 파이프라인에서 DB에 순서대로 적용되는 **정식 변경**입니다. |
| `saveroute/docs/archive/sql-reference/*.sql` | SQL Editor 또는 `psql`에서 **직접 실행**할 때만 사용합니다. `supabase db push` / CI가 자동으로 돌리지 않습니다. |

이름에 `remote_apply_`, `verify_`, `*_check*` 등이 들어간 파일은 과거 상태 복구·검증용 초안일 수 있습니다. 현재 목표 스키마·RLS는 항상 `supabase/migrations`를 단일 근거로 삼습니다.

## 이 폴더에 포함된 파일

- `benefit_products_duplicate_check.sql` — 카탈로그 내 `(provider_id, name, benefit_type)` 중복 카운트
- `remote_apply_023_anon_catalog_read_policies.sql` — anon 카탈로그 정책 수동 재적용 초안 (`023` 마이그레이션과 유사 목적 시 참고)
- `verify_public_brands_rls_and_qa_row.sql` — `brands` RLS 목록 및 QA 행 확인
- `check_search_logs_structure.sql` — `search_logs` / `profiles` 컬럼·FK·RLS 점검
