## SaveRoute Admin Design Guide v1

### 1) 디자인 컨셉

- **Refined Black Admin + Orange Accent**
  - 어두운 사이드바/헤더를 기반으로, **오렌지 포인트(#F97316)**로 상태/강조/액션을 표현합니다.
  - 정보 밀도가 높은 화면(테이블/차트)에서 **가독성, 대비, 간격**을 최우선으로 합니다.

### 2) 타이포그래피

- **Font**: Noto Sans KR
- **Base letter-spacing**: \(-0.7px\)
- **Title letter-spacing**: \(-1.5px\)
- **규칙**
  - Admin 영역 전체에 기본 letter-spacing 적용
  - `h1`, `h2`, `h3` 및 페이지 타이틀에는 title letter-spacing 적용
  - Bootstrap 기본 폰트 스택과 충돌하지 않도록 **Admin scope** 내부에서만 적용

### 3) 컬러 팔레트

- **Admin black**: `#111827`
- **Sidebar black**: `#0F172A`
- **Surface dark**: `#1E293B`
- **Accent orange**: `#F97316`
- **Accent orange soft**: `#FFEDD5`
- **Background**: `#F8FAFC`
- **Text main**: `#111827`
- **Text muted**: `#64748B`

### 4) 레이아웃 규칙

- **Full-width Admin**
  - Admin은 전체 폭을 사용합니다.
  - 본문은 `container-fluid` 기준으로 스크롤은 main 영역에서만 발생하도록 유지합니다.

### 5) Sidebar 규칙

- **아이콘**: Bootstrap Icons 사용(`bi bi-*`)
- **메뉴 텍스트 사이즈**
  - **Section label**: 11px
  - **Nav item**: 14px
- **Active menu**
  - 좌측 **오렌지 포인트 바** 또는 **오렌지 소프트 틴트 배경**
  - 아이콘/텍스트는 **화이트/오렌지**로 대비 확보
- **간격**
  - 항목 간 간격을 두고(숨 쉴 공간), hover 상태를 명확히 제공합니다.

### 6) Header 규칙

- 타이틀은 **bold**
- 역할/서브텍스트는 **semi-bold 또는 muted**
- 아이템(이메일/role/버튼) 간 간격을 일정하게 유지합니다.

### 7) Dashboard KPI 카드 규칙

- **아이콘(좌)** + **내용(우)** 레이아웃
- 배경은 **subtle tint**, 강조는 **오렌지 포인트**
- 값(value)은 **크고 굵게**, 라벨(label)은 **작고 semi-bold**, 보조 텍스트는 **muted**
- 동일 행에서 카드 높이가 어긋나지 않도록 **min-height**를 적용합니다.

### 8) Chart 카드 규칙

- 헤더: **타이틀 bold**, 서브타이틀은 읽기 쉬운 muted
- 카드 헤더는 깔끔한 라인(border-bottom)과 일정한 padding 유지
- 차트 영역은 페이지 그리드가 흔들리지 않도록 **고정 높이(260~320px)** 권장
- Chart.js 스타일
  - 그리드 라인은 약하게
  - 라인 차트는 부드럽게(tension)
  - 툴팁은 다크 배경 + 화이트 텍스트로 대비 확보

### 9) 테이블 규칙

- 글자 크기: **13~14px**
- 헤더 텍스트: semi-bold
- `table-responsive`, `align-middle` 유지
- 상태/신뢰도 배지는 **일관된 pill 크기**로 표의 리듬감을 맞춥니다.
- 액션 버튼은 컴팩트하게 정렬하고, 다수일 경우 `btn-group` 권장

