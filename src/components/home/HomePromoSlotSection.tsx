"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import { type HomePromoSlot } from "@/lib/homePromoSlots";
import { cn } from "@/lib/utils";

const VISIBLE_CARDS = 2.4;
const CARD_GAP_REM = 0.75;
const AUTO_MS = 5000;
const SWIPE_PX = 48;
const DRAG_CLICK_PX = 8;

const slotAccentClasses = [
  "from-[#51a05d]/15 to-[#8fd694]/10 text-[#2f7a3a]",
  "from-[#ff8a3d]/15 to-[#ffd166]/10 text-[#c45f12]",
  "from-[#4f7cff]/15 to-[#8ec5ff]/10 text-[#2f5fd4]",
  "from-[#7c5cff]/15 to-[#c4a7ff]/10 text-[#5b3fd4]",
];

function handlePromoSlotClick(slot: HomePromoSlot) {
  // TODO: Add detailed click logs here when promo_slot_click_logs is ready.
  void slot;
}

type PromoCardProps = {
  slot: HomePromoSlot;
  index: number;
  cardWidth: string;
  onNavigate: (slot: HomePromoSlot, event: ReactMouseEvent<HTMLAnchorElement>) => void;
};

function PromoCard({ slot, index, cardWidth, onNavigate }: PromoCardProps) {
  return (
    <Link
      href={`/api/promo-slots/${slot.id}/click`}
      onClick={(event) => onNavigate(slot, event)}
      target={slot.linkType === "external" ? "_blank" : undefined}
      rel={slot.linkType === "external" ? "noopener noreferrer" : undefined}
      draggable={false}
      className={cn(
                "sr-user-card sr-home-promo-rail__card relative flex shrink-0 flex-col justify-between overflow-hidden border border-gray-100 p-4 shadow-sm transition-shadow hover:shadow-md",
        `bg-gradient-to-br ${slotAccentClasses[index % slotAccentClasses.length]}`,
      )}
      style={{ width: cardWidth, minHeight: "7.5rem" }}
    >
      {slot.imageUrl ? (
        <span
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${slot.imageUrl})` }}
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-center gap-2">
        <p className="text-[0.6875rem] font-black uppercase tracking-[0.14em] text-gray-700/80">
          {slot.badge}
        </p>
        {slot.isSponsored ? (
          <span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.6875rem] font-bold text-gray-600">
            스폰서
          </span>
        ) : null}
      </div>

      <div className="relative mt-3">
        <h2 className="line-clamp-2 text-sm font-black leading-snug text-gray-950">
          {slot.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-xs font-medium leading-5 text-gray-600">
          {slot.description}
        </p>
        {slot.hashtags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {slot.hashtags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/70 px-2 py-0.5 text-[0.6875rem] font-semibold text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function HomePromoSlotSection({ slots }: { slots: HomePromoSlot[] }) {
  const promoSlots = useMemo(
    () => [...slots].sort((a, b) => b.priority - a.priority),
    [slots],
  );
  const count = promoSlots.length;
  const carouselEnabled = count > Math.floor(VISIBLE_CARDS);

  const loopSlots = useMemo(
    () => (carouselEnabled ? [...promoSlots, ...promoSlots] : promoSlots),
    [promoSlots, carouselEnabled],
  );

  const [index, setIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const indexRef = useRef(0);
  const pointerActiveRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const didDragRef = useRef(false);

  const cardWidth = `calc((100% - ${(Math.ceil(VISIBLE_CARDS) - 1) * CARD_GAP_REM}rem) / ${VISIBLE_CARDS})`;
  const stepWidth = `calc(${cardWidth} + ${CARD_GAP_REM}rem)`;
  const dotIndex = carouselEnabled ? index % count : 0;

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    setIndex(0);
    setTransitionEnabled(true);
    setDragOffsetPx(0);
    setIsDragging(false);
  }, [count]);

  const jumpWithoutTransition = useCallback((nextIndex: number) => {
    setTransitionEnabled(false);
    setIndex(nextIndex);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
      });
    });
  }, []);

  const goToNext = useCallback(() => {
    if (!carouselEnabled) {
      return;
    }
    setTransitionEnabled(true);
    setIndex((current) => current + 1);
  }, [carouselEnabled]);

  const goToPrev = useCallback(() => {
    if (!carouselEnabled) {
      return;
    }

    const current = indexRef.current;
    if (current > 0) {
      setTransitionEnabled(true);
      setIndex(current - 1);
      return;
    }

    setTransitionEnabled(false);
    setIndex(count);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTransitionEnabled(true);
        setIndex(count - 1);
      });
    });
  }, [carouselEnabled, count]);

  const goToDot = useCallback(
    (targetIndex: number) => {
      if (!carouselEnabled) {
        return;
      }
      setTransitionEnabled(true);
      setIndex(targetIndex);
    },
    [carouselEnabled],
  );

  useEffect(() => {
    if (!carouselEnabled || isDragging) {
      return undefined;
    }

    const timer = window.setInterval(goToNext, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [carouselEnabled, goToNext, isDragging]);

  const onTrackTransitionEnd = useCallback(() => {
    if (!carouselEnabled) {
      return;
    }

    if (indexRef.current >= count) {
      jumpWithoutTransition(indexRef.current - count);
    }
  }, [carouselEnabled, count, jumpWithoutTransition]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!carouselEnabled) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerActiveRef.current = true;
    pointerStartXRef.current = event.clientX;
    didDragRef.current = false;
    setIsDragging(true);
    setDragOffsetPx(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) {
      return;
    }

    const delta = event.clientX - pointerStartXRef.current;
    if (Math.abs(delta) > DRAG_CLICK_PX) {
      didDragRef.current = true;
    }
    setDragOffsetPx(delta);
  };

  const resetPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) {
      return;
    }

    pointerActiveRef.current = false;
    setIsDragging(false);
    setDragOffsetPx(0);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) {
      return;
    }

    const delta = event.clientX - pointerStartXRef.current;
    resetPointer(event);

    if (delta > SWIPE_PX) {
      goToPrev();
    } else if (delta < -SWIPE_PX) {
      goToNext();
    }
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    resetPointer(event);
  };

  const onCardNavigate = (
    slot: HomePromoSlot,
    event: ReactMouseEvent<HTMLAnchorElement>,
  ) => {
    handlePromoSlotClick(slot);
    if (didDragRef.current) {
      event.preventDefault();
    }
  };

  if (promoSlots.length === 0) {
    return null;
  }

  const trackTransition =
    transitionEnabled && !isDragging
      ? "transform 500ms cubic-bezier(0.33, 1, 0.68, 1)"
      : "none";

  return (
    <section className="sr-home-promo-rail" aria-label="추천 할인 배너">
      <div
        className={cn(
          "sr-home-promo-rail__viewport overflow-hidden",
          carouselEnabled && "sr-home-promo-rail__viewport--draggable",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div
          className="sr-home-promo-rail__track flex touch-pan-y"
          style={{
            gap: `${CARD_GAP_REM}rem`,
            transform: `translateX(calc(-1 * ${index} * (${stepWidth}) + ${dragOffsetPx}px))`,
            transition: trackTransition,
          }}
          onTransitionEnd={onTrackTransitionEnd}
        >
          {loopSlots.map((slot, slotIndex) => (
            <PromoCard
              key={`${slot.id}-${slotIndex}`}
              slot={slot}
              index={slotIndex % count}
              cardWidth={cardWidth}
              onNavigate={onCardNavigate}
            />
          ))}
        </div>
      </div>

      {carouselEnabled ? (
        <nav
          className="mt-3 flex items-center justify-center gap-2"
          aria-label="추천 할인 위치"
        >
          {promoSlots.map((slot, slotIndex) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => goToDot(slotIndex)}
              className={cn(
                "h-2 rounded-full transition-all",
                dotIndex === slotIndex ? "w-5 bg-sr-primary" : "w-2 bg-gray-300",
              )}
              aria-label={`${slotIndex + 1}번째 추천 할인으로 이동`}
              aria-current={dotIndex === slotIndex ? "true" : undefined}
            />
          ))}
        </nav>
      ) : null}
    </section>
  );
}
