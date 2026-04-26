# SaveRoute Cursor Implementation Plan v1.0

> Cursor에 전달 가능한 단계별 개발 구현 계획서.
> 각 Phase는 독립적으로 커밋 가능한 단위로 구성.

---

## 0. 프로젝트 초기 설정

### 0.1 Next.js 프로젝트 생성

```bash
npx create-next-app@latest saveroute \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
cd saveroute
```

### 0.2 패키지 설치

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# 사용자 UI
npm install clsx tailwind-merge

# 어드민 (Bootstrap + Chart.js)
npm install bootstrap chart.js

# 폼 검증
npm install react-hook-form zod @hookform/resolvers

# 유틸
npm install dayjs
```

### 0.3 환경변수 설정 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 0.4 디렉토리 구조

```
src/
├── app/
│   ├── (user)/              # 사용자 레이아웃 그룹
│   │   ├── layout.tsx
│   │   ├── page.tsx         # 홈
│   │   ├── search/
│   │   │   └── page.tsx
│   │   ├── my-benefits/
│   │   │   └── page.tsx
│   │   └── mypage/
│   │       └── page.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts
│   ├── admin/               # 어드민 레이아웃 그룹
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── brands/
│   │   ├── discounts/
│   │   ├── benefit-categories/
│   │   ├── providers/
│   │   ├── benefit-products/
│   │   ├── brand-requests/
│   │   ├── search-logs/
│   │   ├── stats/
│   │   ├── accounts/
│   │   └── audit-logs/
│   ├── api/
│   │   ├── search/route.ts
│   │   ├── brand-requests/route.ts
│   │   └── user-benefits/route.ts
│   └── (static)/
│       ├── terms/page.tsx
│       └── privacy/page.tsx
├── components/
│   ├── ui/                  # 공통 UI 컴포넌트
│   ├── search/              # 검색 관련
│   ├── benefits/            # 혜택 설정 관련
│   └── admin/               # 어드민 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # 클라이언트 사이드
│   │   ├── server.ts        # 서버 사이드
│   │   └── middleware.ts
│   ├── utils.ts
│   └── normalize.ts         # 키워드 정규화
└── types/
    ├── database.ts          # Supabase 생성 타입
    └── index.ts
```

---

## Phase 1: 기반 구조 구축

### Git 커밋: `init: project setup`

**구현 목록:**

1. **Supabase 클라이언트 설정**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  )
}
```

2. **미들웨어 (세션 유지 + 어드민 보호)**

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // /admin/* 경로: role 체크
  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    // role = 'operator' OR 'master' 체크
    // 없으면 /admin/login 리다이렉트
  }
  // 세션 갱신
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

3. **PWA 설정**

```json
// public/manifest.json
{
  "name": "SaveRoute",
  "short_name": "SaveRoute",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Phase 2: Supabase 스키마

### Git 커밋: `feat: add supabase schema`

**Supabase SQL Editor에서 실행할 마이그레이션 파일:**

```
supabase/migrations/
├── 001_profiles.sql
├── 002_benefit_categories.sql
├── 003_providers.sql
├── 004_benefit_products.sql
├── 005_brand_categories.sql
├── 006_brands.sql
├── 007_discounts.sql
├── 008_user_benefits.sql
├── 009_coupons.sql
├── 010_search_logs.sql
├── 011_brand_requests.sql
├── 012_result_click_logs.sql
├── 013_admin_audit_logs.sql
├── 014_stats_tables.sql
├── 015_rls_policies.sql
└── 016_seed_data.sql
```

각 파일 내용은 `SaveRoute_DB_ERD_v1.md` 참조.

**Supabase 타입 자동 생성:**
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

## Phase 3: 인증 (로그인/회원가입)

### Git 커밋: `feat: add auth flow`

**구현 목록:**

1. `/auth/login` 페이지
   - 이메일, 비밀번호 입력 폼
   - `supabase.auth.signInWithPassword()`
   - 에러: Toast 표시
   - 성공: 이전 페이지 or 홈으로

2. `/auth/signup` 페이지
   - 이메일, 비밀번호 입력 폼
   - `supabase.auth.signUp()`
   - 이메일 인증 안내
   - profiles 자동 생성 트리거 (Supabase Database Function)

```sql
-- Supabase에서 실행: 회원가입 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

3. `/auth/callback/route.ts`
   - Supabase Auth 콜백 처리

4. 공통 컴포넌트
   - `<AuthGuard>`: 비로그인 시 리다이렉트
   - `useUser()` 훅

---

## Phase 4: 어드민 레이아웃

### Git 커밋: `feat: add admin layout`

**구현 목록:**

1. `/admin/layout.tsx` - Bootstrap 5 사이드바 레이아웃
   - 좌측 사이드바 (네비게이션 메뉴)
   - 상단 헤더 (어드민명, 로그아웃)
   - role 체크 (operator/master만 접근)

2. 사이드바 메뉴 구성:
```
대시보드
데이터 관리
  ├── 브랜드 관리
  ├── 할인 관리
  ├── 베네핏 카테고리
  ├── 제공사 관리
  └── 혜택 상품 관리
운영
  ├── 업데이트 요청
  ├── 데이터 확인 필요
  └── 검색 로그
통계
계정 관리 (master only)
감사 로그
```

3. Bootstrap 5 CDN 또는 로컬 import (어드민 전용 layout에서만)

---

## Phase 5: 브랜드 관리

### Git 커밋: `feat: add brand management`

**구현 목록:**

1. `/admin/brands` - 목록 (테이블, 검색, 필터)
2. `/admin/brands/new` - 등록 폼
3. `/admin/brands/:id` - 상세 (통계 + 할인 목록)
4. `/admin/brands/:id/edit` - 수정 폼

**API Routes:**
```
GET    /api/admin/brands
POST   /api/admin/brands
GET    /api/admin/brands/:id
PUT    /api/admin/brands/:id
DELETE /api/admin/brands/:id  (soft delete: is_active = false)
```

**aliases 처리:**
- 태그 입력 UI (enter로 추가, x로 제거)
- PostgreSQL `TEXT[]` 타입으로 저장

---

## Phase 6: 베네핏 카테고리 관리

### Git 커밋: `feat: add benefit category management`

1. `/admin/benefit-categories` - 목록 + CRUD
2. 정렬 (drag or sort_order 수동 입력)
3. `is_active` 토글 (삭제 대신)

---

## Phase 7: 제공사 관리

### Git 커밋: `feat: add provider management`

1. `/admin/providers` - 목록 + CRUD
2. provider_type 셀렉트 (5종)
3. benefit_category 연동 필터

---

## Phase 8: 혜택 상품 관리

### Git 커밋: `feat: add benefit product management`

1. `/admin/benefit-products` - 목록 + CRUD
2. product_type 셀렉트
3. card_type 조건부 표시 (product_type = credit_card/debit_card/prepaid_card일 때만)
4. is_mvno + mvno_notice_required 체크박스

---

## Phase 9: 할인 관리

### Git 커밋: `feat: add discount management`

**구현 목록:**

1. `/admin/discounts` - 목록 (검색, 필터, 상태 뱃지)
2. `/admin/discounts/new` - 등록 폼
3. `/admin/discounts/:id/edit` - 수정 폼

**폼 로직:**
- 베네핏 카테고리 선택 → 제공사 목록 동적 필터링
- 제공사 선택 → 혜택 상품 목록 동적 필터링
- `has_no_expiry` 체크 시 `valid_until` 필드 disabled
- `discount_unit = 'special_price'` 선택 시 `special_price` 필드 활성화
- 저장 시 `admin_audit_logs` INSERT

---

## Phase 10: 내 혜택 설정 (사용자)

### Git 커밋: `feat: add user benefit settings`

**구현 목록:**

1. `/my-benefits` 페이지

```typescript
// 혜택 설정 저장 API
// POST /api/user-benefits
// Body: { benefits: UserBenefitInput[] }
// 기존 user_benefits 전체 삭제 후 새로 INSERT (upsert 방식)
```

2. 통신사/카드 선택 UI:
   - providers 목록 로드 (type별 분리)
   - 선택된 provider에 따라 benefit_products 동적 로드
   - 알뜰요금제 선택 시 안내 문구 표시

3. 저장된 혜택 카드 목록 표시

---

## Phase 11: 검색 플로우

### Git 커밋: `feat: add search flow`

**구현 목록:**

1. 홈 페이지 (`/`) - 검색 입력창

2. 검색 API (`/api/search`)

```typescript
// GET /api/search?keyword=롯데월드
// 1. normalize_keyword(keyword)
// 2. brands 매칭 (name OR aliases @> ARRAY[keyword])
// 3. user_benefits 조회 (로그인 사용자)
// 4. discounts 조회 (brand_id, status='active')
// 5. 매칭 + 정렬
// 6. search_logs INSERT
// 7. brand_daily_stats, daily_search_stats UPSERT
```

3. 검색 결과 페이지 (`/search`)
   - `matched` 상태: 할인 카드 3개
   - `unmatched` 상태: 안내 + 요청 버튼
   - `matched` but 할인 없음: "현재 등록된 할인이 없습니다."

4. 더보기 컴포넌트 (토글)
   - 전체 active 할인 목록
   - 알뜰요금제 안내 문구 조건부 표시
   - `has_no_expiry` 조건부 만료일 표시
   - `source_url` 조건부 출처 링크 표시

5. 하단 탭바 컴포넌트

---

## Phase 12: 업데이트 요청 플로우

### Git 커밋: `feat: add brand request flow`

**구현 목록:**

1. 업데이트 요청 API

```typescript
// POST /api/brand-requests
// Body: { keyword: string }
// Logic:
//   normalized = normalize_keyword(keyword)
//   existing = brand_requests WHERE normalized_keyword = normalized
//   if (!existing) INSERT { keyword, normalized_keyword, request_count: 1 }
//   if (existing && existing.request_count < 10) UPDATE request_count++
//   if (existing.request_count >= 10) return { status: 'max_reached' }
```

2. 클라이언트 요청 횟수 카운트 (localStorage 활용)
   - 3회 이상 시 버튼 강조
   - 10회 시 버튼 비활성화

3. `/admin/brand-requests` 어드민 관리 페이지
   - request_count DESC 정렬
   - status 변경 기능
   - 메모 입력

---

## Phase 13: 어드민 대시보드

### Git 커밋: `feat: add admin dashboard charts`

**구현 목록:**

1. KPI 카드 6개 (Server Component로 데이터 fetch)

2. Chart.js 초기화 (어드민 layout에서 Bootstrap import와 함께)

3. 차트 컴포넌트 (`'use client'`):

```typescript
// components/admin/charts/DailySearchChart.tsx
// components/admin/charts/BrandTopChart.tsx
// components/admin/charts/GenderDistributionChart.tsx
// components/admin/charts/AgeGroupChart.tsx
// components/admin/charts/CategoryPieChart.tsx
```

4. 브랜드 상세 페이지 통계 섹션

---

## Phase 14: 마이페이지 + 정적 페이지

### Git 커밋: `chore: add terms and privacy pages`

**구현 목록:**

1. `/mypage` 페이지
   - 성별/연령대 수정 (profiles UPDATE)
   - 로그아웃
   - 회원 탈퇴 (확인 모달)

2. `/terms` - 이용약관 (정적 마크다운 or 하드코딩)

3. `/privacy` - 개인정보 처리방침

---

## Phase 15: 통계 / 로그 / 감사

### Git 커밋: `feat: add stats and audit logs`

1. `/admin/search-logs` - 검색 로그 테이블 (pagination)
2. `/admin/stats` - 통계 차트 (날짜 범위 선택)
3. `/admin/audit-logs` - 감사 로그 (read-only)
4. `/admin/update-check` - last_checked_at 30일 이전 할인 목록

---

## Phase 16: 계정 관리

### Git 커밋: `feat: add admin account management`

1. `/admin/accounts` - 운영자 목록 (master only)
   - 운영자 초대 (이메일 발송)
   - 권한 설정
   - 비활성화
   - 최대 5명 제한 체크

---

## 공통 컴포넌트 목록

### 사용자 UI

| 컴포넌트 | 설명 |
|----------|------|
| `<SearchBar>` | 메인 검색 입력창 |
| `<DiscountCard>` | 할인 결과 카드 |
| `<DiscountDetail>` | 더보기 상세 컴포넌트 |
| `<BenefitSelector>` | 혜택 선택 UI |
| `<EmptyState>` | 빈 결과 컴포넌트 |
| `<Toast>` | 알림 메시지 |
| `<BottomTab>` | 하단 탭바 |
| `<LoadingSpinner>` | 로딩 상태 |

### 어드민 UI

| 컴포넌트 | 설명 |
|----------|------|
| `<AdminSidebar>` | 어드민 사이드바 |
| `<DataTable>` | 공통 테이블 컴포넌트 |
| `<KpiCard>` | 대시보드 KPI 카드 |
| `<ConfirmModal>` | 확인 모달 |
| `<TagInput>` | aliases 태그 입력 |
| `<AuditLogger>` | 감사 로그 자동 기록 HOF |

---

## API 라우트 목록

```
# 사용자 API
GET  /api/search              검색
POST /api/brand-requests      업데이트 요청
GET  /api/user-benefits       내 혜택 조회
POST /api/user-benefits       내 혜택 저장

# 어드민 API
GET/POST        /api/admin/brands
GET/PUT/DELETE  /api/admin/brands/:id
GET/POST        /api/admin/discounts
GET/PUT/DELETE  /api/admin/discounts/:id
GET/POST        /api/admin/benefit-categories
GET/POST        /api/admin/providers
GET/POST        /api/admin/benefit-products
GET/PUT         /api/admin/brand-requests/:id
GET             /api/admin/search-logs
GET             /api/admin/stats
GET/POST/PUT    /api/admin/accounts
```

---

## 전체 개발 순서 요약

```
Phase 1:  init: project setup
Phase 2:  feat: add supabase schema
Phase 3:  feat: add auth flow
Phase 4:  feat: add admin layout
Phase 5:  feat: add brand management
Phase 6:  feat: add benefit category management
Phase 7:  feat: add provider management
Phase 8:  feat: add benefit product management
Phase 9:  feat: add discount management
Phase 10: feat: add user benefit settings
Phase 11: feat: add search flow
Phase 12: feat: add brand request flow
Phase 13: feat: add admin dashboard charts
Phase 14: chore: add terms and privacy pages
Phase 15: feat: add stats and audit logs
Phase 16: feat: add admin account management
```

---

## Cursor 전달 시 권장 프롬프트 패턴

```
다음 조건으로 [컴포넌트명]을 구현해줘:

1. 파일 위치: src/[경로]
2. 사용 기술: Next.js 14 App Router, TypeScript, Tailwind CSS
3. 데이터: Supabase client (src/lib/supabase/client.ts 또는 server.ts)
4. 타입: src/types/database.ts 참조
5. 에러 처리: Toast 컴포넌트 사용
6. [추가 요구사항]
```
