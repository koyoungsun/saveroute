# SaveRoute UI Design Spec v1.0

> 사용자 화면(Tailwind CSS + PWA)과 어드민 화면(Bootstrap 5)의 디자인 시스템 및 컴포넌트 스펙.

---

## 1. 디자인 원칙

| 원칙 | 설명 |
|------|------|
| 결정 우선 | 정보보다 결정이 먼저 보이게 한다 |
| 단순함 | 한 화면에 너무 많은 설명을 넣지 않는다 |
| 모바일 우선 | 사용자 화면은 430px 기준 1컬럼 PWA |
| 어드민 보수 | Bootstrap 5 기본 스타일 최대한 유지, 커스텀 CSS 최소화 |
| 광고 금지 | 배너, 팝업, 과한 색상 사용 금지 |
| 여백 우선 | 여백은 넉넉하게, 텍스트는 짧게, 버튼은 명확하게 |

---

## 2. 사용자 화면 디자인 토큰

### 2.1 색상 시스템

```css
/* Tailwind 커스텀 토큰 (tailwind.config.ts) */
colors: {
  primary:   { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#DBEAFE' },
  surface:   { DEFAULT: '#FFFFFF', muted: '#F8FAFC' },
  border:    { DEFAULT: '#E5E7EB' },
  text: {
    main:    '#111827',
    sub:     '#6B7280',
    muted:   '#9CA3AF',
  },
  status: {
    success: '#16A34A',
    warning: '#F59E0B',
    danger:  '#DC2626',
  },
}
```

### 2.2 타이포그래피

| 역할 | 클래스 | 크기/굵기 |
|------|--------|-----------|
| 페이지 타이틀 | `text-xl font-bold text-gray-900` | 20px / 700 |
| 섹션 헤딩 | `text-base font-semibold text-gray-800` | 16px / 600 |
| 할인율 (1위) | `text-3xl font-extrabold text-blue-600` | 30px / 800 |
| 할인율 (2–3위) | `text-xl font-bold text-gray-900` | 20px / 700 |
| 본문 | `text-sm text-gray-700` | 14px / 400 |
| 보조 설명 | `text-xs text-gray-500` | 12px / 400 |
| 배지 | `text-xs font-medium` | 12px / 500 |

### 2.3 공간/형태

```
카드 radius:    rounded-2xl  (16px)
버튼 radius:    rounded-xl   (12px)
입력창 radius:  rounded-xl   (12px)
배지 radius:    rounded-full

카드 그림자:    shadow-sm (0 1px 3px rgba(0,0,0,0.08))
최대 너비:      max-w-[430px] mx-auto
기본 패딩:      px-4 (16px 좌우)
카드 패딩:      p-4 (16px)
섹션 간격:      space-y-4
```

### 2.4 공통 클래스 패턴

```
기본 카드:      bg-white rounded-2xl shadow-sm border border-gray-100 p-4
Primary 버튼:   w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base
Secondary 버튼: w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium text-base
입력창:         w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900
적용방식 배지:  px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700
```

---

## 3. 사용자 화면 페이지 스펙

### 3.1 홈 (`/`)

**레이아웃 구조**
```
[전체 배경: bg-surface-muted min-h-screen]
  [중앙 컨테이너: max-w-[430px] mx-auto px-4]
    [상단 여백: pt-16]
    [로고: text-2xl font-extrabold text-blue-600 text-center]
    [서브타이틀: text-sm text-gray-500 text-center mt-1]
    [검색 영역: mt-10]
      [입력창]
      [검색 버튼: mt-2]
    [인기 브랜드 칩: mt-8]
```

**컴포넌트 스펙**

`SearchBar`:
- 입력창 + 검색 버튼을 묶은 단일 컴포넌트
- 비로그인 시 submit → `/auth/login?redirect=/search?keyword={keyword}` 이동
- 로그인 시 submit → `/search?keyword={keyword}` 이동
- placeholder: `"어디에서 가장 싸게 쓸 수 있을까요?"`

`PopularBrandChips`:
- `brand_daily_stats` 기준 최근 7일 검색 상위 6개
- 가로 스크롤 (overflow-x-auto, flex gap-2)
- 칩 스타일: `px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 shadow-sm whitespace-nowrap`
- 클릭 시 해당 브랜드 검색

---

### 3.2 검색 결과 (`/search?keyword=`)

**결과 있음 레이아웃**
```
[브랜드명 + 카테고리 헤더]
[내 할인 베스트 레이블]
[1위 카드: DiscountRankFirst]
[2–3위 리스트: DiscountRankItem × 2]
[더보기 버튼]
[더보기 패널: DiscountDetailPanel (토글)]
```

`DiscountRankFirst` (1위 카드):
```
[bg-blue-600 rounded-2xl p-5 text-white]
  [제공사명: text-sm opacity-80]
  [할인율: text-3xl font-extrabold mt-1]
  [적용방식 배지: bg-white/20 text-white text-xs rounded-full px-2 py-0.5]
  [혜택명: text-xs opacity-70 mt-2]
```

`DiscountRankItem` (2–3위):
```
[bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center]
  [왼쪽]
    [순위 번호: text-xs text-gray-400 font-medium]
    [제공사명: text-sm font-semibold text-gray-900 mt-0.5]
    [혜택명: text-xs text-gray-500]
  [오른쪽]
    [할인율: text-xl font-bold text-gray-900]
    [적용방식 배지]
```

`더보기 버튼`:
```
[border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600 w-full mt-3 flex items-center justify-center gap-1]
텍스트: "+ 더보기" / "접기"
```

`DiscountDetailPanel`:
```
[bg-gray-50 rounded-2xl p-4 mt-2 space-y-3]
  [각 할인 항목]
    [구분선]
    [혜택명: font-medium]
    [조건 설명: text-xs text-gray-500]
    [중복 적용: 배지]
    [출처/확인일/만료일: text-xs text-gray-400]
  [알뜰요금제 안내: bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700]
```

**결과 없음 레이아웃**

`EmptyState`:
```
[중앙 정렬 flex flex-col items-center pt-16 px-4]
  [아이콘 영역: text-4xl mb-4] (이모지 또는 SVG 아이콘)
  [제목: text-lg font-semibold text-gray-800 text-center]
    "아직 할인 정보가 없어요."
  [설명: text-sm text-gray-500 text-center mt-2]
    "요청하시면 업데이트 후보에 반영할게요."
  [요청 버튼: mt-6 w-full max-w-xs]
  [안내: text-xs text-gray-400 text-center mt-3]
    "요청 수가 많은 업체부터 먼저 확인합니다."
```

버튼 상태:
- 기본: `border border-blue-600 text-blue-600 rounded-xl py-3 font-medium`
- 강조(3회 이상): `bg-blue-600 text-white rounded-xl py-3 font-semibold`
- 비활성(10회): `bg-gray-100 text-gray-400 rounded-xl py-3 cursor-not-allowed`

---

### 3.3 내 혜택 설정 (`/my-benefits`)

**레이아웃 구조**
```
[페이지 헤딩: "내 혜택 설정"]
[통신사 섹션 카드]
  [섹션 레이블: "통신사"]
  [통신사 선택 드롭다운]
  [등급/요금제 선택 드롭다운 (조건부)]
  [알뜰요금제 안내 (조건부)]
[카드 섹션 카드]
  [섹션 레이블: "카드"]
  [카드사 선택 드롭다운]
  [카드 선택 드롭다운 (조건부)]
  [카드 타입 뱃지 (조건부)]
[등록된 혜택 목록]
[저장하기 버튼: 하단 fixed or 스크롤 하단]
```

드롭다운 스타일: `select` → `w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm`

등록 혜택 목록 아이템:
```
[flex items-center justify-between py-2]
  [혜택명: text-sm font-medium text-gray-800]
  [삭제 버튼: text-gray-400 hover:text-red-500]
```

알뜰요금제 안내:
```
[bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2 text-xs text-amber-700]
"알뜰요금제 혜택은 통신사/요금제별로 다를 수 있어 실제 적용 여부 확인이 필요합니다."
```

---

### 3.4 마이페이지 (`/mypage`)

**레이아웃 구조**
```
[내 혜택 요약 카드]
  [등록된 혜택 수]
  [혜택 수정 링크]
[프로필 설정 카드]
  [성별 선택: radio 또는 select]
  [연령대 선택: select]
  [안내: "통계 목적으로만 사용됩니다."]
[메뉴 리스트]
  [이용약관 →]
  [개인정보 처리방침 →]
  [구분선]
  [로그아웃 (text-red-500)]
  [회원 탈퇴 (text-gray-400 text-xs)]
```

메뉴 아이템 스타일:
```
[flex items-center justify-between py-4 border-b border-gray-100 last:border-0]
  [텍스트: text-sm text-gray-700]
  [화살표: text-gray-400]
```

---

### 3.5 하단 탭바

```
[fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto]
[bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]]
[h-16 flex items-center justify-around px-4]

탭 아이템:
  [flex flex-col items-center gap-1]
    [아이콘: 24px]
    [레이블: text-xs]
  활성: text-blue-600
  비활성: text-gray-400

탭 목록:
  홈 (/)
  내 혜택 (/my-benefits)
  마이페이지 (/mypage)
```

---

## 4. 어드민 디자인 시스템

### 4.1 Bootstrap 5 커스텀 변수 (최소)

```css
/* admin-custom.css - 최소한만 오버라이드 */
:root {
  --bs-body-bg: #F8FAFC;
  --bs-card-border-radius: 0.5rem;
}

.sidebar {
  width: 240px;
  min-height: 100vh;
  background-color: #1E293B;
  color: #CBD5E1;
}

.sidebar .nav-link {
  color: #94A3B8;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
}

.sidebar .nav-link:hover,
.sidebar .nav-link.active {
  color: #FFFFFF;
  background-color: rgba(255,255,255,0.08);
  border-radius: 0.375rem;
}

.sidebar .nav-section-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #475569;
  padding: 0.5rem 1.25rem 0.25rem;
  margin-top: 0.5rem;
}
```

### 4.2 상태 배지 매핑

| 상태 | Bootstrap 클래스 |
|------|-----------------|
| active | `badge bg-success` |
| draft | `badge bg-secondary` |
| expired | `badge bg-danger` |
| hidden | `badge bg-dark` |
| pending | `badge bg-warning text-dark` |
| processing | `badge bg-info text-dark` |
| completed | `badge bg-success` |
| ignored | `badge bg-secondary` |
| high confidence | `badge bg-success` |
| medium confidence | `badge bg-warning text-dark` |
| low confidence | `badge bg-danger` |
| 노출중 | `badge bg-success` |
| 숨김 | `badge bg-secondary` |

### 4.3 테이블 공통

```html
<table class="table table-hover table-sm align-middle">
  <thead class="table-light">...</thead>
  <tbody>...</tbody>
</table>
```

페이지네이션: Bootstrap `pagination` 컴포넌트 사용.

### 4.4 폼 공통

- 레이블: `form-label fw-semibold`
- 입력: `form-control` / `form-select`
- 필수 표시: `<span class="text-danger">*</span>`
- 도움말: `form-text text-muted`
- 저장/취소 버튼: 폼 하단 우측 정렬 (`d-flex justify-content-end gap-2`)

---

## 5. 공통 컴포넌트 인터페이스

### 사용자 컴포넌트

```typescript
// SearchBar
interface SearchBarProps {
  defaultValue?: string
  onSearch: (keyword: string) => void
  isLoggedIn: boolean
}

// DiscountResultCard
interface DiscountResultCardProps {
  brandName: string
  brandCategory?: string
  topDiscounts: DiscountItem[]    // 최대 3개
  allDiscounts: DiscountItem[]    // 더보기용
  hasMvnoDiscount: boolean
}

// DiscountItem
interface DiscountItem {
  id: number
  title: string
  providerName: string
  discountValue: number
  discountUnit: 'percent' | 'won' | 'special_price' | 'free' | 'unknown'
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

// EmptyState
interface EmptyStateProps {
  keyword: string
  searchCount: number    // 이 키워드 누적 검색 수 (클라이언트 기준)
  requestCount: number   // brand_requests.request_count
  onRequest: () => void
}

// BenefitSelector
interface BenefitSelectorProps {
  categories: BenefitCategory[]
  providers: Provider[]
  products: BenefitProduct[]
  selectedBenefits: UserBenefit[]
  onChange: (benefits: UserBenefit[]) => void
}

// Toast
interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number   // ms, default 3000
}
```

### 어드민 컴포넌트

```typescript
// KpiCard
interface KpiCardProps {
  title: string
  value: number | string
  icon?: string
  variant?: 'primary' | 'success' | 'warning' | 'danger'
  change?: { value: number; direction: 'up' | 'down' }
}

// AdminDataTable
interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  pagination?: PaginationProps
  onRowClick?: (row: T) => void
}

// StatusBadge
interface StatusBadgeProps {
  status: 'active' | 'draft' | 'expired' | 'hidden' | 'pending' | 'processing' | 'completed' | 'ignored'
}

// ConfirmModal
interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string   // default: "확인"
  cancelLabel?: string    // default: "취소"
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

// TagInput (aliases 입력)
interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}
```

---

## 6. 반응형 전략

| 화면 | 전략 |
|------|------|
| 사용자 화면 | 430px 고정 1컬럼, 이하에서 100% 너비 |
| 어드민 - 사이드바 | 1024px 이상 고정, 이하 햄버거 메뉴 |
| 어드민 - 테이블 | `table-responsive` 래핑 |
| 어드민 - 폼 | 768px 이상 2컬럼, 이하 1컬럼 |
| 어드민 - 차트 | Bootstrap `row g-3` 그리드, col-12 col-md-6 |

---

## 7. 접근성 (최소 요구사항)

- 모든 입력에 `id` + `<label for>` 연결
- 버튼에 `aria-label` (아이콘 전용 버튼)
- 색상만으로 상태 구분하지 않음 (텍스트 병용)
- focus ring: Tailwind `focus-visible:ring-2 focus-visible:ring-blue-500`
- 로딩 상태: `aria-busy="true"`

---

## 8. 로딩/빈 상태 처리 원칙

| 상태 | 사용자 화면 | 어드민 화면 |
|------|------------|------------|
| 로딩 중 | 스켈레톤 카드 (pulse animation) | `<div class="spinner-border spinner-border-sm">` |
| 빈 데이터 | EmptyState 컴포넌트 | `<td colspan="N" class="text-center text-muted py-5">데이터가 없습니다.</td>` |
| 에러 | Toast (danger) + 재시도 버튼 | Bootstrap `alert alert-danger` |
| 저장 중 | 버튼 disabled + "저장 중..." 텍스트 | 버튼 `disabled` + spinner |
