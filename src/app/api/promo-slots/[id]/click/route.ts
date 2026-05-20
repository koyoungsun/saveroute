import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { parsePromoSlotId } from "@/lib/promoSlotId";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type PromoSlotClickRow = {
  id: string;
  href: string;
  link_type: "internal" | "external";
  starts_at: string | null;
  ends_at: string | null;
};

function isSafeHref(href: string, linkType: PromoSlotClickRow["link_type"]) {
  if (linkType === "internal") {
    return href.startsWith("/") && !href.startsWith("//");
  }

  try {
    const url = new URL(href);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isWithinActivePeriod(slot: PromoSlotClickRow) {
  const now = Date.now();
  const startsAt = slot.starts_at ? new Date(slot.starts_at).getTime() : null;
  const endsAt = slot.ends_at ? new Date(slot.ends_at).getTime() : null;

  if (startsAt && startsAt > now) {
    return false;
  }

  if (endsAt && endsAt < now) {
    return false;
  }

  return true;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const promoSlotId = parsePromoSlotId(id);
  const fallbackUrl = new URL("/", request.url);

  if (!promoSlotId) {
    return NextResponse.redirect(fallbackUrl);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("promo_slots")
    .select("id,href,link_type,starts_at,ends_at")
    .eq("id", promoSlotId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.redirect(fallbackUrl);
  }

  const promoSlot = data as PromoSlotClickRow;
  if (!isWithinActivePeriod(promoSlot)) {
    return NextResponse.redirect(fallbackUrl);
  }

  const redirectTarget = isSafeHref(promoSlot.href, promoSlot.link_type)
    ? promoSlot.href
    : "/";

  await supabase.rpc("increment_promo_slot_click_count", {
    slot_id: promoSlot.id,
  });

  return NextResponse.redirect(new URL(redirectTarget, request.url));
}
