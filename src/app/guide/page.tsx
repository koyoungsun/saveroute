import Link from "next/link";

import { UserPage } from "@/components/layout/UserPage";
import { UserShell } from "@/components/layout/UserShell";

const steps = [
  {
    title: "혜택 등록",
    body: "보유 중인 카드, 통신사, 멤버십/포인트 혜택을 등록해 주세요. 등록한 혜택과 매칭되는 할인에 «내 할인 가능» 표시가 붙습니다.",
    href: "/my-benefits",
    cta: "내 혜택 등록하기",
  },
  {
    title: "브랜드 검색",
    body: "방문하려는 브랜드명을 검색하세요. 식당, 영화관, 놀이동산 등 브랜드별 할인 정보를 한곳에서 확인할 수 있습니다.",
    href: "/",
    cta: "홈에서 검색하기",
  },
  {
    title: "할인 확인",
    body: "검색 결과에서 할인율, 조건, 유의사항을 확인하세요. 로그인 후에는 내 혜택 기준 BEST 할인과 맞춤 정렬을 볼 수 있습니다.",
    href: "/search",
    cta: null,
  },
  {
    title: "예상 결제금액 계산",
    body: "검색 결과 상단에 예상 결제금액을 입력하면 각 할인 카드에 예상 할인·예상 결제가 표시됩니다. 실제 할인은 현장/카드사 조건에 따라 달라질 수 있습니다.",
    href: "/search",
    cta: null,
  },
] as const;

export default function GuidePage() {
  return (
    <UserShell>
      <UserPage tone="comfortable" className="sr-user-stack">
        <article className="sr-user-card">
          <h1 className="sr-user-t-page-title sr-user-text-primary">사용방법</h1>
          <p className="sr-user-t-body sr-user-text-muted mt-2">
            SaveRoute에서 혜택을 등록하고, 브랜드를 검색해 최적 할인을 확인하는 방법입니다.
          </p>

          <ol className="sr-user-guide-steps mt-6 space-y-4">
            {steps.map((step, index) => (
              <li key={step.title} className="sr-user-guide-step sr-user-card-soft rounded-2xl p-4">
                <p className="sr-user-guide-step__number sr-user-t-badge sr-user-text-link">
                  STEP {index + 1}
                </p>
                <h2 className="sr-user-t-section-title sr-user-text-primary mt-1">
                  {step.title}
                </h2>
                <p className="sr-user-t-body sr-user-text-secondary mt-2">{step.body}</p>
                {step.cta ? (
                  <Link
                    href={step.href}
                    className="sr-user-btn-secondary sr-user-btn-secondary--compact mt-3 inline-flex"
                  >
                    {step.cta}
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="sr-user-callout sr-user-callout--empty mt-6">
            <p className="sr-user-t-muted sr-user-text-muted">
              포인트 적립/사용 정보는 할인 카드 상세에서 확인할 수 있으며, 예상 결제 계산에는
              퍼센트·정액 할인만 반영됩니다.
            </p>
          </div>
        </article>
      </UserPage>
    </UserShell>
  );
}
