import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

type BrandSuggestionRow = {
  id: number;
  name: string;
  slug: string;
  aliases: string[] | null;
};

function normalizeKeyword(keyword: string) {
  return keyword.trim().toLowerCase().replace(/[^가-힣a-zA-Z0-9]/g, "");
}

function matchesAlias(aliases: string[] | null, query: string, normalized: string) {
  return (aliases ?? []).some((alias) => {
    const aliasLower = alias.toLowerCase();
    const normalizedAlias = normalizeKeyword(alias);

    return aliasLower.includes(query.toLowerCase()) || normalizedAlias.includes(normalized);
  });
}

function scoreSuggestion(brand: BrandSuggestionRow, query: string, normalized: string) {
  const nameLower = brand.name.toLowerCase();
  const slugLower = brand.slug.toLowerCase();
  const queryLower = query.toLowerCase();
  const normalizedName = normalizeKeyword(brand.name);
  const normalizedSlug = normalizeKeyword(brand.slug);

  if (nameLower === queryLower) return 0;
  if (normalizedName === normalized) return 1;
  if (nameLower.startsWith(queryLower) || normalizedName.startsWith(normalized)) return 2;
  if (slugLower.startsWith(queryLower) || normalizedSlug.startsWith(normalized)) return 3;
  if (matchesAlias(brand.aliases, query, normalized)) return 4;
  return 5;
}

function uniqueSuggestions(rows: BrandSuggestionRow[]) {
  return rows.reduce<BrandSuggestionRow[]>((unique, brand) => {
    if (!unique.some((item) => item.id === brand.id)) {
      unique.push(brand);
    }

    return unique;
  }, []);
}

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim();
  const normalized = normalizeKeyword(query);

  if (!normalized) {
    return NextResponse.json({ suggestions: [] });
  }

  const supabase = await createServerSupabaseClient();
  const pattern = `%${query}%`;
  const normalizedPattern = `%${normalized}%`;

  const [
    { data: nameMatches, error: nameError },
    { data: slugMatches, error: slugError },
    { data: aliasCandidates, error: aliasError },
  ] = await Promise.all([
    supabase
      .from("brands")
      .select("id,name,slug,aliases")
      .eq("is_active", true)
      .ilike("name", pattern)
      .order("name", { ascending: true })
      .limit(10),
    supabase
      .from("brands")
      .select("id,name,slug,aliases")
      .eq("is_active", true)
      .ilike("slug", normalizedPattern)
      .order("name", { ascending: true })
      .limit(10),
    supabase
      .from("brands")
      .select("id,name,slug,aliases")
      .eq("is_active", true)
      .not("aliases", "is", null)
      .order("name", { ascending: true })
      .limit(100),
  ]);

  if (nameError || slugError || aliasError) {
    return NextResponse.json({ suggestions: [] });
  }

  const aliasMatches = ((aliasCandidates ?? []) as BrandSuggestionRow[]).filter(
    (brand) => matchesAlias(brand.aliases, query, normalized),
  );
  const suggestions = uniqueSuggestions([
    ...((nameMatches ?? []) as BrandSuggestionRow[]),
    ...((slugMatches ?? []) as BrandSuggestionRow[]),
    ...aliasMatches,
  ])
    .sort((a, b) => {
      const scoreDiff =
        scoreSuggestion(a, query, normalized) - scoreSuggestion(b, query, normalized);
      if (scoreDiff !== 0) return scoreDiff;

      return a.name.localeCompare(b.name);
    })
    .slice(0, 8)
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
    }));

  return NextResponse.json({ suggestions });
}
