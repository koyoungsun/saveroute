import { notFound, redirect } from "next/navigation";

import { NewDiscountPageContent } from "../new/NewDiscountPageContent";

type DiscountDynamicPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DiscountDynamicPage({ params }: DiscountDynamicPageProps) {
  const { id } = await params;

  if (id === "new") {
    return NewDiscountPageContent();
  }

  const discountId = Number(id);
  if (!Number.isInteger(discountId) || discountId <= 0) {
    notFound();
  }

  redirect(`/admin/discounts/${discountId}/edit`);
}
