import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    title: "수집하는 개인정보",
    body: "SaveRoute는 회원가입과 서비스 이용을 위해 이메일, 선택 입력한 성별, 연령대, 사용자가 등록한 혜택 정보를 수집할 수 있습니다.",
  },
  {
    title: "개인정보 이용 목적",
    body: "수집한 정보는 로그인, 혜택 비교, 서비스 품질 개선, 집계 통계 분석을 위해 사용됩니다.",
  },
  {
    title: "수집하지 않는 정보",
    body: "SaveRoute는 카드 번호를 저장하지 않으며 결제 내역도 저장하지 않습니다.",
  },
  {
    title: "검색 로그 및 통계",
    body: "검색 로그에는 user_id를 저장하지 않습니다. 성별과 연령대는 선택 입력 항목이며 개인 추적이 아닌 집계 통계 목적으로만 사용됩니다.",
  },
  {
    title: "개인정보 보관 및 파기",
    body: "개인정보는 서비스 제공에 필요한 기간 동안 보관되며, 탈퇴 또는 보관 목적이 사라진 경우 관련 법령에 따라 파기됩니다.",
  },
  {
    title: "제3자 제공",
    body: "SaveRoute는 이용자의 개인정보를 동의 없이 제3자에게 제공하지 않습니다. 단, 법령에 따른 요청이 있는 경우는 예외입니다.",
  },
  {
    title: "이용자 권리",
    body: "이용자는 본인의 개인정보 조회, 수정, 삭제를 요청할 수 있으며, 서비스 내 제공되는 기능 또는 문의를 통해 처리할 수 있습니다.",
  },
  {
    title: "문의",
    body: "개인정보 처리와 관련한 문의는 SaveRoute 운영팀으로 연락할 수 있습니다.",
  },
];

export default function PrivacyPage() {
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
        <h1 className="text-xl font-bold text-gray-900">개인정보 처리방침</h1>

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
