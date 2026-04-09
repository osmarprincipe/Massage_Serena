"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PlanCardsLayoutProps {
  count: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Adaptive layout container for membership plan cards.
 *
 *  1 plan  → centered, max-width 400 px
 *  2 plans → 2-column grid, centered
 *  3 plans → 3-column grid
 *  4+ plans → horizontal scroll carousel with prev/next arrows (desktop)
 */
export function PlanCardsLayout({ count, children, className = "" }: PlanCardsLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    if (count < 4) return;
    // Small timeout so the DOM has rendered children before measuring
    const id = setTimeout(updateScrollState, 50);
    const el = scrollRef.current;
    if (!el) return () => clearTimeout(id);
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      clearTimeout(id);
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [count, updateScrollState]);

  const scrollBy = (dir: 1 | -1) => {
    // 300px card + 20px gap
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  // Shared padding gives every grid variant room for shadows / transforms.
  // overflow: visible ensures no ancestor clip cuts off hover glows or rings.
  const gridPadding = "py-5 px-1";

  // ── 1 plan — single card centred ─────────────────────────────────────────
  if (count <= 1) {
    return (
      <div className={`flex justify-center ${gridPadding} ${className}`} style={{ overflow: "visible" }}>
        <div className="w-full" style={{ maxWidth: 400, overflow: "visible" }}>
          {children}
        </div>
      </div>
    );
  }

  // ── 2 plans — balanced two-column ────────────────────────────────────────
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

  // ── 3 plans — standard single row ────────────────────────────────────────
  if (count === 3) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-6 ${gridPadding} ${className}`}
        style={{ overflow: "visible" }}
      >
        {children}
      </div>
    );
  }

  // ── 4+ plans — horizontal scroll carousel ────────────────────────────────
  //
  // Padding inside the scroll track is the key: `overflow-x: auto` clips at
  // the element's edge, but content inside the PADDING BOX is still painted.
  // 28px top/bottom gives room for box-shadows and translate(-4px) lifts.
  // 12px horizontal padding lets first/last card's side-shadows breathe.
  // The outer wrapper uses negative margin to absorb the visual extra space
  // so the section spacing in the parent page stays unchanged.
  return (
    <div className={`relative ${className}`} style={{ margin: "-28px -12px" }}>
      {/* Left arrow — centred over the card area (accounting for padding) */}
      <button
        onClick={() => scrollBy(-1)}
        aria-label="Previous plans"
        className="hidden lg:flex absolute z-10 h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
        style={{
          top: "50%",
          left: 0,
          transform: "translate(-50%, -50%)",
          background: "rgba(18,13,12,0.92)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.50)",
          opacity: canScrollLeft ? 1 : 0,
          pointerEvents: canScrollLeft ? "auto" : "none",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(198,161,91,0.30)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)";
        }}
      >
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Scroll track — padding is the shadow/transform breathing room */}
      <div
        ref={scrollRef}
        className="plan-carousel-track flex gap-6 overflow-x-auto no-scrollbar"
        style={{
          scrollSnapType: "x mandatory",
          padding: "28px 12px",
        }}
      >
        {children}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scrollBy(1)}
        aria-label="Next plans"
        className="hidden lg:flex absolute z-10 h-9 w-9 items-center justify-center rounded-full transition-all duration-200"
        style={{
          top: "50%",
          right: 0,
          transform: "translate(50%, -50%)",
          background: "rgba(18,13,12,0.92)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.50)",
          opacity: canScrollRight ? 1 : 0,
          pointerEvents: canScrollRight ? "auto" : "none",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(198,161,91,0.30)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)";
        }}
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
