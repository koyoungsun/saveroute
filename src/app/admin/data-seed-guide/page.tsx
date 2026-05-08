import Link from "next/link";

type Field = {
  label: string;
  value: string;
};

type Sample = {
  brand: string;
  brandFields: Field[];
  productFields: Field[];
  discountFields: Field[];
};

const samples: Sample[] = [
  {
    brand: "메가커피",
    brandFields: [
      { label: "브랜드명", value: "메가MGC커피" },
      { label: "slug", value: "mega-mgc-coffee" },
      { label: "카테고리", value: "식음료" },
      { label: "웹사이트 URL", value: "https://www.mega-mgccoffee.com" },
      { label: "설명", value: "메가MGC커피 테스트 입력용 브랜드" },
      { label: "활성 상태로 등록", value: "체크" },
    ],
    productFields: [
      { label: "혜택 카테고리", value: "통신사" },
      { label: "제공사", value: "KT" },
      { label: "상품명", value: "KT VIP" },
      { label: "활성 상태", value: "체크" },
      { label: "알뜰폰 상품", value: "체크 해제" },
      { label: "알뜰폰 안내 필요", value: "체크 해제" },
    ],
    discountFields: [
      { label: "브랜드", value: "메가MGC커피 (mega-mgc-coffee)" },
      { label: "할인 제목", value: "KT VIP 아메리카노 500원 할인" },
      { label: "혜택 카테고리", value: "통신사" },
      { label: "제공사", value: "KT" },
      { label: "혜택상품", value: "KT VIP" },
      { label: "할인 유형", value: "won" },
      { label: "할인값", value: "500" },
      { label: "최대 할인 금액", value: "500" },
      { label: "최소 결제 금액", value: "0" },
      { label: "시작일", value: "2026-05-01" },
      { label: "종료일", value: "2026-12-31" },
      { label: "출처 URL", value: "https://www.mega-mgccoffee.com" },
      { label: "안내/유의사항", value: "월 1회, 일부 매장 제외" },
      { label: "활성 상태로 등록", value: "체크" },
    ],
  },
  {
    brand: "CGV",
    brandFields: [
      { label: "브랜드명", value: "CGV" },
      { label: "slug", value: "cgv" },
      { label: "카테고리", value: "여가" },
      { label: "웹사이트 URL", value: "https://www.cgv.co.kr" },
      { label: "설명", value: "CGV 영화관 테스트 입력용 브랜드" },
      { label: "활성 상태로 등록", value: "체크" },
    ],
    productFields: [
      { label: "혜택 카테고리", value: "통신사" },
      { label: "제공사", value: "SKT" },
      { label: "상품명", value: "SKT T 멤버십" },
      { label: "활성 상태", value: "체크" },
      { label: "알뜰폰 상품", value: "체크 해제" },
      { label: "알뜰폰 안내 필요", value: "체크 해제" },
    ],
    discountFields: [
      { label: "브랜드", value: "CGV (cgv)" },
      { label: "할인 제목", value: "SKT T 멤버십 영화 예매 2,000원 할인" },
      { label: "혜택 카테고리", value: "통신사" },
      { label: "제공사", value: "SKT" },
      { label: "혜택상품", value: "SKT T 멤버십" },
      { label: "할인 유형", value: "won" },
      { label: "할인값", value: "2000" },
      { label: "최대 할인 금액", value: "2000" },
      { label: "최소 결제 금액", value: "12000" },
      { label: "시작일", value: "2026-05-01" },
      { label: "종료일", value: "2026-12-31" },
      { label: "출처 URL", value: "https://www.cgv.co.kr" },
      { label: "안내/유의사항", value: "일반 2D 영화 기준, 일부 특별관 제외" },
      { label: "활성 상태로 등록", value: "체크" },
    ],
  },
  {
    brand: "롯데월드",
    brandFields: [
      { label: "브랜드명", value: "롯데월드" },
      { label: "slug", value: "lotte-world" },
      { label: "카테고리", value: "여가" },
      { label: "웹사이트 URL", value: "https://adventure.lotteworld.com" },
      { label: "설명", value: "롯데월드 테스트 입력용 브랜드" },
      { label: "활성 상태로 등록", value: "체크" },
    ],
    productFields: [
      { label: "혜택 카테고리", value: "카드" },
      { label: "제공사", value: "신한카드" },
      { label: "상품명", value: "신한 Deep Dream" },
      { label: "활성 상태", value: "체크" },
      { label: "알뜰폰 상품", value: "체크 해제" },
      { label: "알뜰폰 안내 필요", value: "체크 해제" },
    ],
    discountFields: [
      { label: "브랜드", value: "롯데월드 (lotte-world)" },
      { label: "할인 제목", value: "신한카드 자유이용권 50% 할인" },
      { label: "혜택 카테고리", value: "카드" },
      { label: "제공사", value: "신한카드" },
      { label: "혜택상품", value: "신한 Deep Dream" },
      { label: "할인 유형", value: "percent" },
      { label: "할인값", value: "50" },
      { label: "최대 할인 금액", value: "33000" },
      { label: "최소 결제 금액", value: "0" },
      { label: "시작일", value: "2026-05-01" },
      { label: "종료일", value: "2026-12-31" },
      { label: "출처 URL", value: "https://adventure.lotteworld.com" },
      { label: "안내/유의사항", value: "본인 1인 기준, 전월 실적 조건 확인 필요" },
      { label: "활성 상태로 등록", value: "체크" },
    ],
  },
];

function formatFields(fields: Field[]) {
  return fields.map((field) => `${field.label}: ${field.value}`).join("\n");
}

function CopyBlock({
  title,
  href,
  fields,
}: {
  title: string;
  href: string;
  fields: Field[];
}) {
  return (
    <div className="card h-100 border-0 shadow-sm">
      <div className="card-header bg-white d-flex justify-content-between align-items-center gap-2">
        <div>
          <h3 className="h6 mb-1">{title}</h3>
          <p className="text-muted small mb-0">아래 내용을 입력폼에 복사해 넣으세요.</p>
        </div>
        <Link href={href} className="btn btn-outline-secondary btn-sm">
          입력폼 열기
        </Link>
      </div>
      <div className="card-body">
        <textarea
          className="form-control font-monospace"
          readOnly
          rows={Math.max(fields.length + 1, 8)}
          value={formatFields(fields)}
        />
      </div>
    </div>
  );
}

export default function DataSeedGuidePage() {
  return (
    <>
      <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Data Seed Guide</h1>
          <p className="text-muted mb-0">
            테스트 데이터를 운영자가 Admin 입력폼에 수동 등록할 수 있도록
            정리한 복사용 가이드입니다.
          </p>
        </div>
        <span className="badge text-bg-warning">DB insert 없음</span>
      </div>

      <div className="alert alert-light border sr-block" role="note">
        <div className="fw-bold mb-1">권장 입력 순서</div>
        <ol className="mb-0 ps-3">
          <li>브랜드를 먼저 등록합니다.</li>
          <li>혜택상품이 없으면 혜택상품을 등록합니다.</li>
          <li>할인 등록에서 브랜드와 혜택상품을 선택해 할인 정보를 입력합니다.</li>
        </ol>
      </div>

      <div className="vstack gap-4">
        {samples.map((sample) => (
          <section className="card sr-block" key={sample.brand}>
            <div className="card-header bg-white">
              <h2 className="h5 mb-0">{sample.brand} 샘플 데이터</h2>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-xl-4">
                  <CopyBlock
                    title="브랜드 입력"
                    href="/admin/brands/new"
                    fields={sample.brandFields}
                  />
                </div>
                <div className="col-xl-4">
                  <CopyBlock
                    title="혜택상품 입력"
                    href="/admin/benefit-products/new"
                    fields={sample.productFields}
                  />
                </div>
                <div className="col-xl-4">
                  <CopyBlock
                    title="할인 입력"
                    href="/admin/discounts/new"
                    fields={sample.discountFields}
                  />
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
