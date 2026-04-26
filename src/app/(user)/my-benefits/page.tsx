import { BenefitForm } from "@/components/benefits/BenefitForm";

export default function MyBenefitsPage() {
  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-gray-900">내 혜택 설정</h1>
      <div className="mt-4">
        <BenefitForm />
      </div>
    </div>
  );
}
