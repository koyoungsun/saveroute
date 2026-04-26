"use client";

interface EmptyStateProps {
  keyword?: string;
}

export function EmptyState({ keyword }: EmptyStateProps) {
  const handleRequest = () => {
    console.log("Update requested", { keyword });
  };

  return (
    <div className="flex flex-col items-center px-4 pt-16 text-center">
      <div className="mb-4 text-4xl" aria-hidden="true">
        🔍
      </div>
      <h1 className="text-lg font-semibold text-gray-800">
        아직 할인 정보가 없어요.
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        요청하시면 업데이트 후보에 반영할게요.
      </p>

      <button
        type="button"
        onClick={handleRequest}
        className="mt-6 w-full max-w-xs rounded-xl border border-blue-600 py-3 font-medium text-blue-600"
      >
        업데이트 요청하기
      </button>
      <p className="mt-3 text-xs text-gray-400">
        요청 수가 많은 업체부터 먼저 확인합니다.
      </p>
    </div>
  );
}
