import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const GENDER_VALUES = new Set(["male", "female", "other"] as const);
const AGE_VALUES = new Set(["10s", "20s", "30s", "40s", "50s", "60s+"] as const);

function parseGender(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  return GENDER_VALUES.has(value as "male" | "female" | "other") ? value : null;
}

function parseAge(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  return AGE_VALUES.has(value as "10s" | "20s" | "30s" | "40s" | "50s" | "60s+")
    ? value
    : null;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = sessionData.session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawGender = (body as { gender_group?: unknown }).gender_group;
  const rawAge = (body as { age_group?: unknown }).age_group;

  const gender_group = parseGender(rawGender);
  const age_group = parseAge(rawAge);

  if (rawGender !== null && rawGender !== undefined && rawGender !== "" && gender_group === null) {
    return NextResponse.json({ error: "Invalid gender_group" }, { status: 400 });
  }
  if (rawAge !== null && rawAge !== undefined && rawAge !== "" && age_group === null) {
    return NextResponse.json({ error: "Invalid age_group" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      gender_group,
      age_group,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
