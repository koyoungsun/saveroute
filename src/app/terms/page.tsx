import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "서비스 목적",
    body: "SaveRoute는 사용자가 등록한 혜택 정보를 바탕으로 브랜드별 할인 정보를 더 쉽게 비교할 수 있도록 돕는 서비스입니다.",
  },
  {
    title: "회원가입 및 계정",
    body: "회원은 본인의 계정을 안전하게 관리해야 하며, 계정 정보의 부정확한 입력으로 발생하는 불편은 회원에게 책임이 있습니다.",
  },
  {
    title: "서비스 이용",
    body: "회원은 SaveRoute를 개인적인 혜택 확인 목적으로 이용할 수 있으며, 서비스 운영을 방해하는 방식으로 사용할 수 없습니다.",
  },
  {
    title: "할인 정보 안내",
    body: "SaveRoute의 할인 정보는 참고용입니다. 실제 적용 여부, 조건, 기간은 각 브랜드와 혜택 제공사의 정책에 따라 달라질 수 있습니다.",
  },
  {
    title: "책임의 한계",
    body: "SaveRoute는 할인 정보의 정확성을 높이기 위해 노력하지만, 정보 변경이나 제공사 정책 차이로 인해 발생하는 손해에 대해 책임을 지지 않습니다.",
  },
  {
    title: "서비스 변경 및 중단",
    body: "SaveRoute는 운영상 필요에 따라 서비스 일부를 변경하거나 일시적으로 중단할 수 있습니다.",
  },
  {
    title: "문의",
    body: "서비스 이용 중 궁금한 점이나 요청 사항은 SaveRoute 운영팀으로 문의할 수 있습니다.",
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-surface-muted px-4 py-6">
      <Link
        href="/mypage"
        className="inline-flex items-center gap-1 text-sm text-gray-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        뒤로
      </Link>

      <article className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">이용약관</h1>

        <div className="mt-6 space-y-5">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-semibold text-gray-800">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
