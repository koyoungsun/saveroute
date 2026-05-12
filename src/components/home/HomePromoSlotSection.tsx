"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { type HomePromoSlot } from "@/lib/homePromoSlots";

const slotClassNames = [
  "bg-gradient-to-br from-[#51a05d] to-[#8fd694]",
  "bg-gradient-to-br from-[#ff8a3d] to-[#ffd166]",
  "bg-gradient-to-br from-[#4f7cff] to-[#8ec5ff]",
  "bg-gradient-to-br from-[#7c5cff] to-[#c4a7ff]",
];

function handlePromoSlotClick(slot: HomePromoSlot) {
  // TODO: Add detailed click logs here when promo_slot_click_logs is ready.
  void slot;
}

export function HomePromoSlotSection({ slots }: { slots: HomePromoSlot[] }) {
  const promoSlots = useMemo(
    () => [...slots].sort((a, b) => b.priority - a.priority),
    [slots],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = Math.min(activeIndex, Math.max(promoSlots.length - 1, 0));

  const goToPrevious = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex <= 0
        ? promoSlots.length - 1
        : Math.min(currentIndex - 1, promoSlots.length - 1),
    );
  }, [promoSlots.length]);

  const goToNext = useCallback(() => {
    setActiveIndex((currentIndex) =>
      currentIndex >= promoSlots.length - 1 ? 0 : currentIndex + 1,
    );
  }, [promoSlots.length]);

  useEffect(() => {
    if (promoSlots.length <= 1) {
      return;
    }

    const timer = window.setInterval(goToNext, 5000);

    return () => window.clearInterval(timer);
  }, [goToNext, promoSlots.length]);

  if (promoSlots.length === 0) {
    return null;
  }

  return (
    <section className="mt-6" aria-label="추천 할인 배너">
      <div className="relative overflow-hidden rounded-3xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${safeActiveIndex * 100}%)` }}
        >
          {promoSlots.map((slot, index) => (
            <Link
              key={slot.id}
              href={`/api/promo-slots/${slot.id}/click`}
              onClick={() => handlePromoSlotClick(slot)}
              target={slot.linkType === "external" ? "_blank" : undefined}
              rel={slot.linkType === "external" ? "noopener noreferrer" : undefined}
              className={`${slotClassNames[index % slotClassNames.length]} relative flex h-[120px] w-full shrink-0 flex-col justify-between overflow-hidden p-5 text-white shadow-sm`}
            >
              {slot.imageUrl ? (
                <span
                  className="absolute inset-0 bg-cover bg-center opacity-25"
                  style={{ backgroundImage: `url(${slot.imageUrl})` }}
                  aria-hidden
                />
              ) : null}
              <span className="absolute inset-0 bg-black/5" aria-hidden />
              <div className="flex items-center gap-2">
                <p className="relative text-xs font-black tracking-[0.16em] text-white/75">
                  {slot.badge}
                </p>
                {slot.isSponsored ? (
                  <span className="relative rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white/80">
                    스폰서
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <h2 className="text-lg font-black leading-tight">
                  {slot.title}
                </h2>
                <p className="mt-1 text-xs font-semibold text-white/80">
                  {slot.description}
                </p>
                {slot.hashtags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {slot.hashtags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-bold text-white/75"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>

        {promoSlots.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-sm font-black text-gray-800 shadow-sm backdrop-blur hover:bg-white"
              aria-label="이전 추천 할인"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-sm font-black text-gray-800 shadow-sm backdrop-blur hover:bg-white"
              aria-label="다음 추천 할인"
            >
              &gt;
            </button>
          </>
        ) : null}
      </div>

      {promoSlots.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2">
          {promoSlots.map((slot, index) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                safeActiveIndex === index ? "w-5 bg-sr-primary" : "w-2 bg-gray-300"
              }`}
              aria-label={`${index + 1}번째 추천 할인으로 이동`}
              aria-current={safeActiveIndex === index ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
