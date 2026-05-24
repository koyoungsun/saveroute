import Link from "next/link";
import {
  BadgePercent,
  Calculator,
  ChevronDown,
  CreditCard,
  Search,
  type LucideIcon,
} from "lucide-react";

import { BrandHubChrome } from "@/components/layout/BrandHubChrome";
import { UserPage } from "@/components/layout/UserPage";
import { UserShell } from "@/components/layout/UserShell";

type GuideStepTone = "blue" | "purple" | "green" | "gold";

type GuideStep = {
  title: string;
  body: string;
  tags: string[];
  icon: LucideIcon;
  tone: GuideStepTone;
  href?: string;
  cta?: string;
};

const steps: GuideStep[] = [
  {
    title: "혜택 등록",
    body: "보유한 카드, 통신사, 멤버십을 먼저 등록하세요.",
    tags: ["카드", "통신사", "멤버십"],
    icon: CreditCard,
    tone: "blue",
    href: "/my-benefits",
    cta: "내 혜택 등록하기",
  },
  {
    title: "브랜드 검색",
    body: "방문할 브랜드를 검색하세요.",
    tags: ["브랜드 검색", "혜택 찾기"],
    icon: Search,
    tone: "purple",
    href: "/",
    cta: "홈에서 검색하기",
  },
  {
    title: "할인 확인",
    body: "내 혜택 기준 BEST 할인을 확인하세요.",
    tags: ["BEST 할인", "내 혜택 적용"],
    icon: BadgePercent,
    tone: "green",
  },
  {
    title: "예상 결제금액 계산",
    body: "예상 결제 금액까지 빠르게 계산하세요.",
    tags: ["예상 결제", "할인 계산"],
    icon: Calculator,
    tone: "gold",
  },
];

export default function GuidePage() {
  return (
    <UserShell>
      <UserPage className="sr-user-account-page sr-user-guide-page sr-user-stack">
        <BrandHubChrome variant="account" />

        <div className="sr-user-account-page__body">
          <header className="sr-user-account-page__intro">
            <h1 className="sr-user-account-page__title">사용방법</h1>
            <p className="sr-user-guide-page__description">
              혜택 등록부터 검색, 할인 확인까지 한 번에 확인하세요.
            </p>
          </header>

          <ol className="sr-user-guide-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <li key={step.title} className="sr-user-guide-step-item">
                  <article
                    className={[
                      "sr-user-guide-step-card",
                      `sr-user-guide-step-card--${step.tone}`,
                      step.cta ? "sr-user-guide-step-card--with-cta" : "",
                      step.cta ? "" : "sr-user-guide-step-card--compact",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span
                      className={`sr-user-guide-step-rank sr-user-guide-step-rank--${step.tone}`}
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="sr-user-guide-step-card__content">
                      <h2 className="sr-user-guide-step__head">
                        <Icon
                          className="sr-user-guide-step__icon"
                          strokeWidth={2}
                          aria-hidden
                        />
                        <span className="sr-user-guide-step__title">{step.title}</span>
                      </h2>

                      <ul className="sr-user-guide-step__tags" aria-label="핵심 키워드">
                        {step.tags.map((tag) => (
                          <li key={tag} className="sr-user-guide-step__tag">
                            {tag}
                          </li>
                        ))}
                      </ul>

                      <p className="sr-user-guide-step__body">{step.body}</p>

                      {step.cta && step.href ? (
                        <Link href={step.href} className="sr-user-guide-step__cta">
                          {step.cta}
                        </Link>
                      ) : null}
                    </div>
                  </article>

                  {!isLast ? (
                    <div className="sr-user-guide-step__connector" aria-hidden>
                      <ChevronDown strokeWidth={2.25} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>

          <aside className="sr-user-guide-footnote">
            <p>
              포인트 적립/사용 정보는 할인 카드 상세에서 확인할 수 있으며, 예상
              결제 계산에는 퍼센트·정액 할인만 반영됩니다.
            </p>
          </aside>
        </div>
      </UserPage>
    </UserShell>
  );
}
