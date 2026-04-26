# SaveRoute User Flow v1.0

---

## 1. 전체 사용자 플로우 맵

```
[홈 /]
  │
  ├─ 비로그인 ──→ [검색 시도] ──→ [로그인 유도 화면] ──→ [로그인 /auth/login]
  │                                                           │
  │                                                    [회원가입 /auth/signup]
  │
  └─ 로그인 ──→ [검색 입력]
                    │
                    ▼
             [검색 결과 /search?keyword=]
                    │
             ┌──────┴──────┐
             │             │
           matched      unmatched
             │             │
        [결과 카드]    [안내 문구]
             │         [업데이트 요청 버튼]
        [+ 더보기]
             │
        [상세 정보]
```

---

## 2. 플로우별 상세

### 2.1 회원가입 플로우

```
[홈] → [로그인 유도]
  → /auth/signup
    → 이메일 입력
    → 비밀번호 입력 (8자 이상)
    → 이메일 인증 (Supabase Magic Link 또는 OTP)
    → profiles 레코드 자동 생성 (role: 'user')
    → /my-benefits 이동 (혜택 설정 유도)
      → 혜택 등록
      → 저장
      → /home 이동
```

**예외:**
- 이미 가입된 이메일 → `"이미 가입된 이메일입니다."` 안내
- 인증 메일 미수신 → 재발송 버튼

---

### 2.2 로그인 플로우

```
/auth/login
  → 이메일 + 비밀번호 입력
  → Supabase auth.signInWithPassword()
  → 성공: 이전 페이지 or 홈으로 이동
  → 실패: "이메일 또는 비밀번호를 확인해주세요."
```

**세션 유지:**
- Supabase 기본 세션 (쿠키 기반)
- 앱 재실행 시 세션 복원
- 만료 시 로그인 화면으로 이동

---

### 2.3 검색 플로우

```
[홈] 검색 입력
  → normalize_keyword() 처리
  → GET /api/search?keyword={normalized}

[서버]
  1. brands.name 또는 aliases[]에서 키워드 매칭
     → 없으면 → result_status: 'unmatched'
                → brand_requests 테이블 upsert (request_count++)
                → search_logs INSERT
                → 클라이언트: 결과 없음 화면

  2. 매칭된 brand_id로 discounts WHERE status = 'active' 조회
     → 없으면 → result_status: 'matched' (할인 없음)
                → search_logs INSERT
                → 클라이언트: "현재 등록된 할인이 없습니다."

  3. 로그인 사용자의 user_benefits 조회
  4. discounts × user_benefits 매칭
     (benefit_category_id + provider_id + benefit_product_id)
  5. discount_unit = 'percent' 기준 내림차순 정렬
  6. 상위 3개 → '내 할인 베스트'
  7. search_logs INSERT (user_id 없이)
  8. brand_daily_stats UPDATE
  9. daily_search_stats UPDATE

[클라이언트]
  → 결과 카드 렌더링 (최대 3개)
  → '+ 더보기' 버튼 (전체 active 할인)
```

---

### 2.4 업데이트 요청 플로우

```
[검색 결과 없음 화면]
  → [업데이트 요청하기] 버튼 클릭
  → POST /api/brand-requests
    → brand_requests WHERE normalized_keyword = ? 조회
      → 없으면: INSERT (request_count = 1)
      → 있으면: UPDATE request_count = request_count + 1
               (max 10 초과 시 업데이트 없음 + 안내 문구)
  → Toast: "요청이 접수되었습니다."

[클라이언트]
  → 동일 키워드 3회 이상 검색 시: 버튼 강조 스타일 변경
  → 10회 도달 시: "이미 최다 요청된 업체입니다." 버튼 비활성화
```

---

### 2.5 내 혜택 설정 플로우

```
/my-benefits
  → 기존 user_benefits 조회 → 현재 선택값 표시

  [통신사 선택]
    → provider_type IN ('telecom_major', 'telecom_mvno') 목록
    → 통신사 선택 시 → 해당 통신사의 benefit_products 목록 로드
    → 등급/요금제 선택 (선택 사항)
    → 알뜰요금제(is_mvno = true) 선택 시 안내 표시

  [카드 선택]
    → provider_type = 'card_company' 목록
    → 카드사 선택 시 → 해당 카드사의 benefit_products 목록 로드
    → 카드 선택 시 card_type 표시 (신용/체크/선불/기타)

  [저장 버튼]
    → DELETE existing user_benefits WHERE user_id = ?
    → INSERT new user_benefits
    → Toast: "혜택이 저장되었습니다."
    → 검색 결과에 즉시 반영
```

---

### 2.6 마이페이지 플로우

```
/mypage
  → profiles 조회 → 성별, 연령대 현재 값 표시
  → 성별/연령대 변경 시 → profiles UPDATE
  → 내 혜택 수정 → /my-benefits 이동
  → 이용약관 → /terms
  → 개인정보 처리방침 → /privacy

  [로그아웃]
    → Supabase auth.signOut()
    → / 로 이동

  [회원 탈퇴]
    → 확인 모달: "정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다."
    → 확인 클릭
    → user_benefits DELETE (cascade)
    → profiles DELETE (auth.users DELETE은 Supabase 서버사이드 처리)
    → / 로 이동
```

---

## 3. 어드민 플로우

### 3.1 어드민 로그인

```
/admin/login
  → 이메일 + 비밀번호 입력
  → Supabase auth.signInWithPassword()
  → profiles.role = 'operator' OR 'master' 체크
  → 권한 없으면: "접근 권한이 없습니다." + 로그인 화면 유지
  → 권한 있으면: /admin/dashboard 이동
```

### 3.2 할인 등록 플로우

```
/admin/discounts/new
  → 브랜드 검색/선택
  → 베네핏 카테고리 선택
    → 카테고리에 따라 제공사 목록 필터링
  → 제공사 선택
    → 해당 제공사의 혜택 상품 목록 필터링
  → 혜택 상품 선택 (optional)
  → 할인 상세 정보 입력
  → 만료일 없음 체크 시 → 만료일 입력 필드 비활성화
  → status = 'draft' 로 저장
  → admin_audit_logs INSERT
  → /admin/discounts 목록으로 이동
```

### 3.3 업데이트 요청 처리 플로우

```
/admin/brand-requests
  → 요청 목록 확인 (request_count DESC)
  → 요청 선택
    → 브랜드가 없으면 → /admin/brands/new 이동 후 브랜드 등록
    → 할인 등록 → /admin/discounts/new
  → 요청 status = 'completed'로 변경
  → 메모 입력
  → admin_audit_logs INSERT
```

---

## 4. 화면 전환 상태 관리

| 상태 | 처리 |
|------|------|
| 로딩 중 | 스피너 or 스켈레톤 UI |
| 검색 중 | 입력창 disabled + 로딩 표시 |
| 에러 | Toast 메시지 (3초 자동 사라짐) |
| 성공 | Toast 메시지 (녹색, 2초) |
| 빈 상태 | Empty state 컴포넌트 (안내 문구 + 액션 버튼) |

---

## 5. 네비게이션 구조

```
[하단 탭바 - 로그인 상태]
  🏠 홈 (/)
  🔍 검색 (/search)
  💳 내 혜택 (/my-benefits)
  👤 마이페이지 (/mypage)

[비로그인 상태]
  🏠 홈 (/)
  👤 로그인 (/auth/login)
```
