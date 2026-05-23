"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";

const AUTO_MS = 10_000;
const SWIPE_PX = 48;

/** 활성 페이징 도트 — 살짝 올린 파스텔 민트 */
const MINT_ACTIVE = "#8fdfcf";

type Slide = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const SLIDES: Slide[] = [
  {
    src: "/icons/question.png",
    alt: "SaveRoute가 바라보는 문제들: 카드, 통신사, 멤버십 혜택이 여러 곳에 흩어져 있어요. 브랜드별로 어떤 혜택이 가장 좋은지 매번 직접 비교해야 해요. 내가 가진 혜택과 실제 할인 조건이 맞는지 확인하기 번거로워요.",
    width: 1024,
    height: 520,
  },
  {
    src: "/icons/sub-top.png",
    alt: "About SaveRoute. 생활 속 할인 정보를 내 혜택 기준으로 찾아주는 서비스. SaveRoute는 카드, 통신사, 멤버십 혜택을 등록해두고 브랜드를 검색하면 받을 수 있는 할인을 한 번에 비교할 수 있도록 돕는 생활형 할인 탐색 서비스입니다.",
    width: 1024,
    height: 683,
  },
];

export function AboutHeroCarousel() {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const pointerActiveRef = useRef(false);
  const pointerStartXRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (reduceMotion) return undefined;

    const id = window.setInterval(goNext, AUTO_MS);
    return () => window.clearInterval(id);
  }, [goNext, reduceMotion]);

  const pct = -(index / SLIDES.length) * 100;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerActiveRef.current = true;
    pointerStartXRef.current = event.clientX;
    setIsDragging(true);
    setDragOffsetPx(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointerActiveRef.current) {
      return;
    }

    setDragOffsetPx(event.clientX - pointerStartXRef.current);
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
      goPrev();
    } else if (delta < -SWIPE_PX) {
      goNext();
    }
  };

  const onPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    resetPointer(event);
  };

  const trackTransition =
    reduceMotion || isDragging
      ? "none"
      : "transform 500ms cubic-bezier(0.33, 1, 0.68, 1)";

  return (
    <section
      aria-roledescription="carousel"
      aria-label="SaveRoute 소개"
      className="flex flex-col gap-3"
    >
      <div
        className="sr-user-card--hero cursor-grab select-none overflow-hidden rounded-3xl active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div className="relative">
          <div
            className="flex touch-pan-y"
            style={{
              width: `${SLIDES.length * 100}%`,
              transform: `translateX(calc(${pct}% + ${dragOffsetPx}px))`,
              transition: trackTransition,
            }}
          >
            {SLIDES.map((slide, slideIndex) => (
              <div
                key={slide.src}
                aria-hidden={slideIndex !== index}
                className="shrink-0"
                style={{ width: `${100 / SLIDES.length}%` }}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  priority={slideIndex === 0}
                  draggable={false}
                  style={{ height: "auto", width: "100%", pointerEvents: "none" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <nav className="flex justify-center gap-2 pb-0.5" aria-label="슬라이드 위치">
        {SLIDES.map((_, dotIndex) => (
          <button
            key={dotIndex}
            type="button"
            aria-label={`슬라이드 ${dotIndex + 1} 보기`}
            aria-current={dotIndex === index ? "true" : undefined}
            onClick={() => setIndex(dotIndex)}
            className={
              dotIndex === index
                ? "h-2 w-6 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] transition-colors"
                : "size-2 rounded-full bg-gray-200 transition-colors hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
            }
            style={
              dotIndex === index ? { backgroundColor: MINT_ACTIVE } : undefined
            }
          />
        ))}
      </nav>
    </section>
  );
}
