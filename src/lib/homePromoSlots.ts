export type HomePromoSlot = {
  id: string;
  title: string;
  description: string;
  badge: string;
  imageUrl?: string;
  linkType: "internal" | "external";
  href: string;
  hashtags: string[];
  startsAt?: string;
  endsAt?: string;
  priority: number;
  isSponsored: boolean;
  sponsorName?: string;
};

export type HomePromoSlotRow = {
  id: string;
  title: string;
  description: string;
  badge: string;
  image_url: string | null;
  link_type: "internal" | "external";
  href: string;
  hashtags: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  is_sponsored: boolean;
  sponsor_name: string | null;
};

export function toHomePromoSlot(row: HomePromoSlotRow): HomePromoSlot {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    badge: row.badge,
    imageUrl: row.image_url ?? undefined,
    linkType: row.link_type,
    href: row.href,
    hashtags: row.hashtags ?? [],
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    priority: row.priority,
    isSponsored: row.is_sponsored,
    sponsorName: row.sponsor_name ?? undefined,
  };
}
