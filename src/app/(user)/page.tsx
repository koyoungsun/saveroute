import Link from "next/link";

import { PopularBrandChips } from "@/components/search/PopularBrandChips";
import { SearchBar } from "@/components/search/SearchBar";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const popularBrands = ["롯데월드", "CGV", "스타벅스", "에버랜드", "서울랜드"];

function getUserDisplayName(email?: string | null) {
  if (!email) {
    return "";
  }

  return email.split("@")[0] ?? "";
}

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  const displayName = getUserDisplayName(session?.user?.email);

  return (
    <div className="px-4 pt-16">
      <h1 className="text-center text-2xl font-extrabold text-blue-600">
        SaveRoute
      </h1>
      {session ? (
        <p className="mt-1 text-center text-sm text-gray-500">
          내 혜택 중 가장 유리한 선택을 찾아드려요.
        </p>
      ) : (
        <p className="mt-1 text-center text-sm text-gray-500">
          내 혜택을 등록하면 가장 유리한 할인을 찾을 수 있어요.
        </p>
      )}

      <div className="mt-10">
        {session ? (
          <>
            <div className="mb-4 space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {displayName}님,
              </p>
              <p className="text-lg font-semibold text-gray-900">
                어디에서 가장 싸게 쓸 수 있을까요?
              </p>
            </div>
            <SearchBar isLoggedIn />
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Link
                href="/auth/login"
                className="block w-full rounded-xl bg-blue-600 py-3 text-center font-semibold text-white hover:bg-blue-700"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="block w-full rounded-xl border border-gray-200 bg-white py-3 text-center font-semibold text-gray-900 hover:bg-gray-50"
              >
                회원가입
              </Link>
            </div>

            <div className="mt-6">
              <SearchBar isLoggedIn={false} />
            </div>
          </>
        )}
      </div>

      {session ? (
        <div className="mt-8">
          <PopularBrandChips brands={popularBrands} />
        </div>
      ) : null}
    </div>
  );
}
