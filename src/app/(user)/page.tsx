import { PopularBrandChips } from "@/components/search/PopularBrandChips";
import { SearchBar } from "@/components/search/SearchBar";

const popularBrands = ["롯데월드", "CGV", "스타벅스", "에버랜드", "서울랜드"];

export default function HomePage() {
  return (
    <div className="px-4 pt-16">
      <h1 className="text-center text-2xl font-extrabold text-blue-600">
        SaveRoute
      </h1>
      <p className="mt-1 text-center text-sm text-gray-500">
        내 혜택 중 가장 유리한 선택을 찾아드려요.
      </p>

      <div className="mt-10">
        <SearchBar />
      </div>

      <div className="mt-8">
        <PopularBrandChips brands={popularBrands} />
      </div>
    </div>
  );
}
