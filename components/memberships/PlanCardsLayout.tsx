"use client";

import { useEffect, useState, Children } from "react";
import type React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface PlanCardsLayoutProps {
  count: number;
  children: React.ReactNode;
  className?: string;
}

// ── Arrow button shared styles ────────────────────────────────────────────────
const arrowBase: React.CSSProperties = {
  background: "rgba(10, 4, 7, 0.92)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.65)",
};
const arrowHover: React.CSSProperties = {
  borderColor: "rgba(177,18,38,0.50)",
  boxShadow: "0 4px 24px rgba(177,18,38,0.28)",
};

// ── 4+ cards — Embla carousel sub-component (hooks must be at component level)
function CarouselFourPlus({ children }: { children: React.ReactNode }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    loop: false,
    dragFree: false,
  });

  const [canPrev, setCanPrev]     = useState(false);
  const [canNext, setCanNext]     = useState(false);
  const [selected, setSelected]   = useState(0);
  const [snaps, setSnaps]         = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
      setSelected(emblaApi.selectedScrollSnap());
      setSnaps(emblaApi.scrollSnapList());
    };
    update();
    emblaApi.on("reInit", update);
    emblaApi.on("select", update);
    return () => {
      emblaApi.off("reInit", update);
      emblaApi.off("select", update);
    };
  }, [emblaApi]);

  const childArray = Children.toArray(children);

  return (
    <div className="relative">
      {/* Embla viewport — padding gives shadow/transform breathing room */}
      <div ref={emblaRef} className="overflow-hidden" style={{ padding: "28px 4px" }}>
        <div className="flex gap-5">
          {childArray.map((child, i) => (
            <div
              key={i}
              className="flex-none transition-transform duration-300 ease-out"
              style={{
                width: "300px",
                transform: i === selected ? "translateY(-4px)" : "translateY(0)",
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      {canPrev && (
        <button
          onClick={() => emblaApi?.scrollPrev()}
          aria-label="Previous plans"
          className="hidden lg:flex absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full items-center justify-center transition-all duration-200"
          style={arrowBase}
          onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, arrowHover)}
          onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, arrowBase)}
        >
          <ChevronLeft className="h-4 w-4" style={{ color: "rgba(245,237,230,0.75)" }} />
        </button>
      )}

      {/* Right arrow */}
      {canNext && (
        <button
          onClick={() => emblaApi?.scrollNext()}
          aria-label="Next plans"
          className="hidden lg:flex absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full items-center justify-center transition-all duration-200"
          style={arrowBase}
          onMouseEnter={e => Object.assign((e.currentTarget as HTMLElement).style, arrowHover)}
          onMouseLeave={e => Object.assign((e.currentTarget as HTMLElement).style, arrowBase)}
        >
          <ChevronRight className="h-4 w-4" style={{ color: "rgba(245,237,230,0.75)" }} />
        </button>
      )}

      {/* Dot pagination */}
      {snaps.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {snaps.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width:      i === selected ? "20px" : "6px",
                height:     "6px",
                background: i === selected
                  ? "linear-gradient(90deg, #b11226, #e8a0a8)"
                  : "rgba(255,255,255,0.20)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Adaptive layout container ─────────────────────────────────────────────────
/**
 *  1 plan  → centered, max-width 400 px
 *  2 plans → 2-column grid, centered
 *  3 plans → 3-column grid
 *  4+ plans → Embla carousel with prev/next arrows + dot pagination
 */
export function PlanCardsLayout({ count, children, className = "" }: PlanCardsLayoutProps) {
  // Shared padding: breathing room for shadows and hover transforms.
  // overflow: visible ensures no ancestor clips hover glows or rings.
  const gridPadding = "py-6 px-1";

  // ── 1 plan ────────────────────────────────────────────────────────────────
  if (count <= 1) {
    return (
      <div className={`flex justify-center ${gridPadding} ${className}`} style={{ overflow: "visible" }}>
        <div className="w-full" style={{ maxWidth: 400, overflow: "visible" }}>
          {children}
        </div>
      </div>
    );
  }

  // ── 2 plans ───────────────────────────────────────────────────────────────
  if (count === 2) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto w-full ${gridPadding} ${className}`}
        style={{ overflow: "visible" }}
      >
        {children}
      </div>
    );
  }

  // ── 3 plans ───────────────────────────────────────────────────────────────
  if (count === 3) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${gridPadding} ${className}`}
        style={{ overflow: "visible" }}
      >
        {children}
      </div>
    );
  }

  // ── 4+ plans — Embla carousel ─────────────────────────────────────────────
  return <CarouselFourPlus>{children}</CarouselFourPlus>;
}
