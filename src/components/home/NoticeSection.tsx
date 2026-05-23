const notices = ["1", "2", "3"];

export function NoticeSection() {
  return (
    <section className="sr-user-card mt-6 rounded-3xl p-5">
      <h2 className="text-base font-black text-gray-950">Notice</h2>
      <p className="mt-2 text-xs leading-5 text-gray-500">
        신규 업데이트 점검은 제작사의 상황에 따라 변동됩니다.
      </p>

      <div className="mt-4 space-y-2">
        {notices.map((notice) => (
          <div
            key={notice}
            className="flex h-11 items-center rounded-2xl bg-gray-50 px-4 text-sm font-semibold text-gray-400"
          >
            {notice}
          </div>
        ))}
      </div>
    </section>
  );
}
