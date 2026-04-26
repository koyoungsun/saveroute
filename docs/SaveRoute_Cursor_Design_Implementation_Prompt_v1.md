# SaveRoute Cursor Design Implementation Prompt v1.0

> Cursor에 그대로 붙여 넣어 사용할 수 있는 페이지/컴포넌트별 구현 프롬프트 모음.
> 각 프롬프트는 독립적으로 사용 가능하며, 앞선 Phase 구현이 완료되었음을 가정한다.

---

## 사용 방법

1. 각 프롬프트를 Cursor Chat에 그대로 붙여 넣는다.
2. `[확인 필요]` 표시된 항목은 실제 환경에 맞게 수정한다.
3. 구현 후 해당 Git 커밋 메시지를 사용한다.

---

## PROMPT-01: Tailwind 디자인 토큰 설정

```
다음 조건으로 SaveRoute 프로젝트의 Tailwind 디자인 토큰을 설정해줘.

파일 위치: tailwind.config.ts

요구사항:
- theme.extend.colors에 다음 커스텀 컬러 추가:
  primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#DBEAFE' }
  surface: { DEFAULT: '#FFFFFF', muted: '#F8FAFC' }
  text: { main: '#111827', sub: '#6B7280', muted: '#9CA3AF' }
- theme.extend.borderRadius:
  card: '16px'
  btn: '12px'
- 최대 너비 max-w-app: '430px' 추가
- content 경로: ['./src/**/*.{ts,tsx}']

추가로 globals.css에:
- body background: #F8FAFC
- 모바일 기본 font-family: system-ui, -apple-system, sans-serif
```

---

## PROMPT-02: UserShell 레이아웃 컴포넌트

```
다음 조건으로 src/components/layout/UserShell.tsx를 구현해줘.

역할: 사용자 화면의 공통 레이아웃 래퍼

요구사항:
- max-w-[430px] mx-auto bg-surface-muted min-h-screen relative
- children을 pb-16 (하단 탭바 높이) 래핑
- BottomTab 컴포넌트를 fixed 하단에 포함
- props: { children: React.ReactNode }

BottomTab 컴포넌트 (같은 파일 또는 별도):
- fixed bottom-0 bg-white border-t border-gray-100 h-16
- 탭 3개: 홈(/), 내 혜택(/my-benefits), 마이페이지(/mypage)
- 활성 탭: text-blue-600, 비활성: text-gray-400
- next/link 사용
- usePathname으로 활성 탭 판별
- 아이콘은 lucide-react 사용 (Home, CreditCard, User)
```

---

## PROMPT-03: SearchBar 컴포넌트

```
다음 조건으로 src/components/search/SearchBar.tsx를 구현해줘.

Props:
interface SearchBarProps {
  defaultValue?: string
  isLoggedIn: boolean
  onSearch?: (keyword: string) => void  // 로그인 상태일 때
  onAuthRequired?: () => void           // 비로그인 상태일 때
}

요구사항:
- 입력창: w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none
- 검색 버튼: w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold
- Enter 키 또는 버튼 클릭으로 검색
- 검색어 trim 후 빈 값이면 동작 안 함
- 비로그인 상태에서 검색 시 onAuthRequired 호출
- 로그인 상태에서 검색 시 /search?keyword={encodeURIComponent(keyword)} 라우팅 (useRouter)
- placeholder: "어디에서 가장 싸게 쓸 수 있을까요?"
```

---

## PROMPT-04: 홈 페이지

```
다음 조건으로 src/app/(user)/page.tsx를 구현해줘.

요구사항:
1. Server Component로 Supabase에서 popular brands 조회
   - brand_daily_stats 기준 최근 7일 검색 상위 6개 brand 조회
   - 데이터 없으면 빈 배열 처리

2. 레이아웃:
   - pt-16 중앙 정렬
   - 로고: "SaveRoute" text-2xl font-extrabold text-blue-600 text-center
   - 서브타이틀: "내 혜택 중 가장 유리한 선택을 찾아드려요." text-sm text-gray-500 text-center mt-1
   - SearchBar: mt-10
   - PopularBrandChips: mt-8

3. PopularBrandChips:
   - "최근 많이 찾은 곳" 레이블 (text-xs text-gray-400)
   - 가로 스크롤 flex gap-2 overflow-x-auto pb-2 scrollbar-hide
   - 각 칩: rounded-full bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm whitespace-nowrap
   - 클릭 시 /search?keyword={brandName} 이동

4. 로그인 여부: Supabase SSR로 서버에서 세션 확인
   - 비로그인 시 SearchBar의 isLoggedIn=false 전달
```

---

## PROMPT-05: DiscountRankFirst 컴포넌트 (1위 카드)

```
다음 조건으로 src/components/search/DiscountRankFirst.tsx를 구현해줘.

Props:
interface DiscountRankFirstProps {
  providerName: string
  productName?: string
  discountValue: number
  discountUnit: 'percent' | 'won' | 'special_price' | 'free' | 'unknown'
  usageType: string
}

usageType 한국어 변환:
- onsite_payment → "현장결제"
- app_booking → "앱 예매"
- online_booking → "온라인 예약"
- coupon_code → "쿠폰코드"
- membership_app → "멤버십 앱"
- unknown → "방식 확인 필요"

할인값 표시 형식:
- percent: "최대 {value}%"
- won: "{value.toLocaleString()}원 할인"
- special_price: "특가 {specialPrice.toLocaleString()}원"
- free: "무료"
- unknown: "할인 있음"

디자인:
- bg-blue-600 text-white rounded-2xl p-5
- 제공사명: text-sm opacity-80
- 할인율: text-3xl font-extrabold mt-1
- 적용방식 배지: inline-flex items-center px-2 py-0.5 rounded-full bg-white/20 text-xs mt-2
- 혜택 상품명: text-xs opacity-70 mt-2
```

---

## PROMPT-06: DiscountRankItem 컴포넌트 (2–3위)

```
다음 조건으로 src/components/search/DiscountRankItem.tsx를 구현해줘.

Props:
interface DiscountRankItemProps {
  rank: number
  providerName: string
  productName?: string
  discountValue: number
  discountUnit: 'percent' | 'won' | 'special_price' | 'free' | 'unknown'
  usageType: string
  specialPrice?: number
}

디자인:
- bg-white rounded-2xl p-4 shadow-sm border border-gray-100
- flex justify-between items-center
- 왼쪽: 순위(text-xs text-gray-400) + 제공사명(text-sm font-semibold) + 혜택상품(text-xs text-gray-500)
- 오른쪽: 할인값(text-xl font-bold text-gray-900) + 적용방식 배지(bg-blue-50 text-blue-700)
- 배지: text-xs rounded-full px-2 py-0.5
```

---

## PROMPT-07: DiscountDetailPanel 컴포넌트

```
다음 조건으로 src/components/search/DiscountDetailPanel.tsx를 구현해줘.

Props:
interface DiscountDetailPanelProps {
  discounts: DiscountDetail[]
  hasMvnoDiscount: boolean
}

interface DiscountDetail {
  id: number
  title: string
  providerName: string
  discountValue: number
  discountUnit: string
  specialPrice?: number
  usageType: string
  isStackable: boolean
  stackingNote?: string
  conditionText?: string
  sourceUrl?: string
  lastCheckedAt: string
  validUntil?: string
  hasNoExpiry: boolean
  isMvno: boolean
}

요구사항:
- bg-gray-50 rounded-2xl p-4 space-y-4
- 각 할인 항목을 divider로 구분
- 항목당 노출:
  - 제목 + 할인값 (font-medium)
  - 조건 설명 (text-xs text-gray-500, 있을 때만)
  - 중복 적용: "중복 가능" (bg-green-50 text-green-700) / "중복 불가" (bg-red-50 text-red-700) 배지
  - stackingNote (text-xs text-gray-400, 있을 때만)
  - 출처 URL (있을 때만 외부 링크 아이콘과 함께 표시)
  - 최근 확인일: "최근 확인 2025-01-10" (text-xs text-gray-400)
  - 만료일: hasNoExpiry=true이면 미노출, 있으면 "~2025-12-31" 표시
- hasMvnoDiscount=true이면 하단에 알뜰요금제 안내:
  bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700
  문구: "알뜰요금제 혜택은 통신사/요금제별로 다를 수 있어 실제 적용 여부 확인이 필요합니다."
```

---

## PROMPT-08: 검색 결과 페이지

```
다음 조건으로 src/app/(user)/search/page.tsx를 구현해줘.

조건:
- searchParams: { keyword: string }
- Server Component (데이터 fetching)
- 로그인 안 된 경우 /auth/login?redirect=/search?keyword={keyword} 리다이렉트

서버에서 처리할 로직 (src/lib/search.ts로 분리):
1. normalize_keyword(keyword) 처리
2. brands 테이블에서 name 또는 aliases에서 매칭
3. 매칭된 brand의 active discounts 조회
4. user_benefits 조회
5. discounts × user_benefits 매칭 및 정렬:
   - discount_unit='percent' 기준 내림차순
   - 상위 3개 topDiscounts
   - 전체 allDiscounts
6. search_logs INSERT (user_id 없이, gender_group/age_group은 profiles에서 조회)
7. brand_daily_stats UPSERT

결과 상태별 렌더링:
- unmatched: EmptyState 컴포넌트
- matched (할인 없음): "현재 등록된 할인이 없습니다." 안내
- matched (만료만 있음): "만료된 할인 정보만 있습니다." 안내
- matched + active 할인: DiscountRankFirst + DiscountRankItem × 2 + 더보기 버튼

더보기 버튼/패널:
- 'use client' 클라이언트 컴포넌트로 분리 (DiscountExpandSection)
- useState로 펼침/접힘 토글
- 펼쳐지면 DiscountDetailPanel 렌더
```

---

## PROMPT-09: EmptyState + 업데이트 요청

```
다음 조건으로 src/components/search/EmptyState.tsx를 구현해줘.

Props:
interface EmptyStateProps {
  keyword: string
}

요구사항:
1. 'use client' 컴포넌트
2. localStorage에서 '{keyword}_search_count' 값 읽어 방문 횟수 파악
3. /api/brand-requests GET으로 해당 keyword의 request_count 조회
4. 버튼 스타일 결정:
   - 기본: border border-blue-600 text-blue-600
   - 강조 (방문 3회+): bg-blue-600 text-white
   - 비활성 (request_count=10): bg-gray-100 text-gray-400 disabled
5. 요청 클릭 시 POST /api/brand-requests { keyword }
   - 성공: Toast "요청이 접수되었습니다." (success, 3초)
   - 실패: Toast "요청 중 오류가 발생했습니다." (error)
6. 레이아웃: flex flex-col items-center pt-16 px-4 text-center
```

---

## PROMPT-10: 내 혜택 설정 페이지

```
다음 조건으로 src/app/(user)/my-benefits/page.tsx와
관련 컴포넌트 src/components/benefits/BenefitForm.tsx를 구현해줘.

페이지 (Server Component):
- providers 전체 목록 조회 (is_active=true)
- benefit_products 전체 목록 조회 (is_active=true)
- 현재 user_benefits 조회

BenefitForm ('use client'):
Props:
  providers: Provider[]
  products: BenefitProduct[]
  initialBenefits: UserBenefit[]

요구사항:
- 통신사 섹션:
  - provider_type IN ('telecom_major', 'telecom_mvno') 필터링
  - 통신사 선택 → 해당 provider의 benefit_products 표시
  - is_mvno=true 상품 선택 시 알뜰요금제 안내 표시
  - "+ 통신사 추가" 버튼 (최대 2개)

- 카드 섹션:
  - provider_type='card_company' 필터링
  - 카드 선택 → card_type 배지 표시
  - "+ 카드 추가" 버튼 (최대 3개)

- 등록된 혜택 목록: 선택된 항목 pill로 표시 + 삭제

- 저장하기 버튼:
  - POST /api/user-benefits
  - body: { benefits: Array<{benefit_category_id, provider_id, benefit_product_id}> }
  - 성공: Toast "혜택이 저장되었습니다."
  - 버튼 disabled + 로딩 상태 처리
```

---

## PROMPT-11: Toast 컴포넌트

```
다음 조건으로 src/components/ui/Toast.tsx와
src/hooks/useToast.ts를 구현해줘.

Toast 컴포넌트:
- fixed top-4 right-4 z-50 (또는 top-4 left-1/2 -translate-x-1/2 for mobile)
- bg-white shadow-lg rounded-xl border-l-4 px-4 py-3
- border 색상: success=green-500, error=red-500, warning=yellow-500, info=blue-500
- 아이콘 + 메시지 텍스트
- duration ms 후 자동 사라짐 (기본 3000ms)
- 퇴장 애니메이션: opacity-0 transition

useToast 훅:
- toast(message, type, duration?) 함수 반환
- 동시에 여러 토스트 스택 가능 (최대 3개)

ToastProvider:
- Context API 기반
- app layout에 전역 등록
```

---

## PROMPT-12: 어드민 레이아웃

```
다음 조건으로 src/app/admin/layout.tsx를 구현해줘.

요구사항:
1. 서버에서 Supabase 세션 확인
   - 미인증 → /admin/login 리다이렉트
   - role != 'operator' AND role != 'master' → /admin/login 리다이렉트

2. Bootstrap 5 임포트 (어드민 전용):
   - 'bootstrap/dist/css/bootstrap.min.css' import
   - 클라이언트 컴포넌트에서 useEffect로 bootstrap JS 초기화

3. 레이아웃 구조:
   <div style={{display:'flex'}}>
     <AdminSidebar currentPath={pathname} userRole={role} />
     <div style={{flex:1}}>
       <AdminHeader email={email} role={role} />
       <main className="container-fluid p-4">{children}</main>
     </div>
   </div>

4. AdminSidebar 컴포넌트:
   - width: 240px, min-height: 100vh
   - background: #1E293B, color: #CBD5E1
   - 메뉴 구조 (SaveRoute_Admin_Structure_v1.md 참조)
   - Accounts 메뉴는 role='master'일 때만 표시
   - active 항목: bg-white/10 text-white rounded
   - next/link 사용

5. AdminHeader 컴포넌트:
   - bg-white border-bottom px-4 py-3
   - 좌: "SaveRoute Admin"
   - 우: 이메일 + role badge + 로그아웃 버튼
```

---

## PROMPT-13: 어드민 공통 컴포넌트

```
다음 어드민 공통 컴포넌트를 src/components/admin/ 아래에 구현해줘.
Bootstrap 5 클래스만 사용하고 커스텀 CSS는 최소화해줘.

1. KpiCard (KpiCard.tsx)
Props: { title: string, value: number|string, icon?: string, variant?: 'primary'|'success'|'warning'|'danger', changeText?: string }
- Bootstrap card with bg-{variant}-subtle
- 숫자 크게, 제목 작게
- changeText 있으면 small 태그로 하단 표시

2. StatusBadge (StatusBadge.tsx)
Props: { status: string }
- 상태별 Bootstrap badge 클래스 매핑:
  active→'bg-success', draft→'bg-secondary', expired→'bg-danger',
  hidden→'bg-dark', pending→'bg-warning text-dark',
  processing→'bg-info text-dark', completed→'bg-success',
  ignored→'bg-secondary'

3. ConfidenceBadge (ConfidenceBadge.tsx)
Props: { confidence: 'high'|'medium'|'low' }
- high→'bg-success', medium→'bg-warning text-dark', low→'bg-danger'

4. ConfirmModal (ConfirmModal.tsx)
Props: { show: boolean, title: string, message: string, confirmLabel?: string, variant?: 'danger'|'primary', onConfirm: ()=>void, onCancel: ()=>void }
- Bootstrap Modal 컴포넌트
- confirmLabel 기본값: "확인"
- variant='danger' 이면 확인 버튼 btn-danger

5. TagInput (TagInput.tsx)
Props: { tags: string[], onChange: (tags: string[]) => void, placeholder?: string }
- 입력 후 Enter 또는 콤마로 태그 추가
- 태그: badge bg-primary me-1 + X 버튼
- Bootstrap form-control 스타일
```

---

## PROMPT-14: 어드민 대시보드

```
다음 조건으로 src/app/admin/dashboard/page.tsx를 구현해줘.

요구사항:
1. Server Component에서 KPI 데이터 병렬 조회 (Promise.all):
   - 오늘 검색 수: daily_search_stats WHERE date=today
   - 누적 검색 수: search_logs COUNT
   - 오늘 신규회원: daily_user_stats WHERE date=today
   - 활성 할인 수: discounts WHERE status='active' COUNT
   - 업데이트 필요: discounts WHERE status='active' AND last_checked_at < 30일전 COUNT
   - 미지원 요청: brand_requests WHERE status='pending' COUNT

2. KPI 카드: Bootstrap row g-3, col-6 col-md-4 col-xl-2
   각각 KpiCard 컴포넌트 사용

3. 차트 섹션 ('use client' 클라이언트 컴포넌트로 분리, DashboardCharts.tsx):
   Chart.js + react-chartjs-2 사용
   - 배치: row g-4
   - 1행: 일별 검색 (col-md-6) + 일별 신규회원 (col-md-6)
   - 2행: 브랜드 TOP10 bar (col-md-6) + 미지원 요청 TOP10 bar (col-md-6)
   - 3행: 성별 doughnut (col-md-4) + 연령대 bar (col-md-4) + 카테고리 pie (col-md-4)
   데이터는 /api/admin/stats/dashboard GET으로 클라이언트에서 fetch

4. 하단 테이블 (col-md-6 각):
   - 업데이트 필요 할인 (last_checked_at 오래된 순 5개)
   - 최근 unmatched 검색어 (오늘 상위 10개)
   - table table-sm table-hover 적용
```

---

## PROMPT-15: Discount 관리 폼

```
다음 조건으로 src/app/admin/discounts/new/page.tsx와
src/components/admin/DiscountForm.tsx를 구현해줘.

DiscountForm ('use client'):
react-hook-form + zod 사용

스키마:
const discountSchema = z.object({
  brand_id: z.number().min(1),
  benefit_category_id: z.number().min(1),
  provider_id: z.number().min(1),
  benefit_product_id: z.number().optional(),
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(200),
  detail: z.string().optional(),
  condition_text: z.string().optional(),
  discount_value: z.number().min(0),
  discount_unit: z.enum(['percent','won','special_price','free','unknown']),
  special_price: z.number().optional(),
  usage_type: z.enum(['onsite_payment','app_booking','online_booking','coupon_code','membership_app','unknown']),
  is_stackable: z.boolean(),
  stacking_note: z.string().optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  has_no_expiry: z.boolean(),
  source_url: z.string().url().optional().or(z.literal('')),
  last_checked_at: z.string().min(1),
  data_confidence: z.enum(['high','medium','low']),
  status: z.enum(['draft','active','expired','hidden']),
  admin_memo: z.string().optional(),
})

레이아웃: Bootstrap row g-3 2컬럼 구성 (SaveRoute_Admin_UI_Wireframe_v1.md 참조)

조건부 표시:
- discount_unit='special_price' → special_price 입력 필드 표시
- has_no_expiry=true → valid_until 입력 비활성화 + 값 초기화
- benefit_category_id 변경 → provider 목록 필터링
- provider_id 변경 → benefit_product 목록 필터링

저장 시:
- admin_audit_logs INSERT (action: 'create', target_table: 'discounts')
- 성공: /admin/discounts 리다이렉트
```

---

## PROMPT-16: 검색 API Route

```
다음 조건으로 src/app/api/search/route.ts를 구현해줘.

GET /api/search?keyword={keyword}

처리 순서:
1. 인증 확인 (Supabase 세션)
   - 미인증: 401 반환

2. keyword normalize:
   const normalized = keyword.toLowerCase().replace(/[^가-힣a-zA-Z0-9]/g, '').trim()

3. brands 조회:
   SELECT * FROM brands
   WHERE is_active = true
   AND (
     name ILIKE '%{keyword}%'
     OR EXISTS (SELECT 1 FROM unnest(aliases) a WHERE a ILIKE '%{keyword}%')
   )
   LIMIT 1

4. 브랜드 없으면:
   - brand_requests upsert (normalized_keyword 기준, request_count MAX 10)
   - search_logs INSERT (result_status: 'unmatched', user_id 없음)
   - 200 반환 { status: 'unmatched', keyword }

5. 브랜드 있으면:
   a. discounts 조회: WHERE brand_id=? AND status='active'
   b. user_benefits 조회: WHERE user_id=? AND is_active=true
   c. 매칭 로직:
      - discount의 benefit_category_id + provider_id 기준으로 user_benefits와 매칭
      - benefit_product_id가 있으면 추가 매칭 조건
   d. 매칭된 할인 정렬:
      - discount_unit='percent': discount_value DESC
      - 기타: 이후에 배치
   e. topDiscounts: 상위 3개
   f. allDiscounts: 전체
   g. search_logs INSERT
   h. brand_daily_stats UPSERT (search_count +1)
   i. daily_search_stats UPSERT
   j. 200 반환 {
        status: 'matched',
        brand: { id, name, category },
        topDiscounts,
        allDiscounts,
        hasMvnoDiscount: allDiscounts.some(d => d.isMvno)
      }

에러 처리: try-catch, 500 반환
```

---

## PROMPT-17: 전체 빈 상태/로딩 처리 원칙

```
SaveRoute 프로젝트 전체에서 다음 빈 상태 처리를 일관되게 적용해줘.

사용자 화면:
1. 로딩: 스켈레톤 UI (animate-pulse bg-gray-200)
   - 검색 결과: 카드 형태 스켈레톤 3개
   - 내 혜택: 섹션별 스켈레톤
   
2. 에러: Toast (danger) + 재시도 버튼
   - 메시지: "일시적인 오류가 발생했습니다. 다시 시도해주세요."

3. 빈 상태:
   - 내 혜택 없음: "혜택을 먼저 등록해주세요" + /my-benefits 버튼
   - 할인 없음: "현재 등록된 할인이 없습니다."
   - 만료만 있음: "만료된 할인 정보만 있습니다."

어드민 화면:
1. 로딩: Bootstrap spinner-border spinner-border-sm
2. 빈 테이블: <td colspan="N" class="text-center text-muted py-5">데이터가 없습니다.</td>
3. 에러: <div class="alert alert-danger">{message}</div>
4. 저장 중: 버튼 disabled + 텍스트 "저장 중..."

모든 컴포넌트에서 위 규칙을 따르도록 구현해줘.
```

---

## 공통 지시사항 (모든 프롬프트에 묵시적으로 적용)

```
- TypeScript strict mode
- 모든 Supabase 호출은 src/types/database.ts 타입 사용
- API Route는 try-catch + 적절한 HTTP 상태코드
- 사용자 화면: Tailwind CSS만 사용 (Bootstrap 금지)
- 어드민 화면: Bootstrap 5만 사용 (Tailwind 금지, 단 관리 목적 유틸리티는 허용)
- search_logs, result_click_logs에 user_id 절대 저장 금지
- 어드민 모든 수정/생성/삭제 시 admin_audit_logs INSERT
- 폼 저장/삭제에는 ConfirmModal 사용
- 로딩/빈 상태/에러 상태 항상 구현
```
