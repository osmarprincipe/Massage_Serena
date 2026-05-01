"use client";

import { useEffect, useState, useCallback } from "react";
import type React from "react";
import {
  PlaySquare, Lock, Unlock, Video, Music, FileText, Image as ImageIcon,
  ShoppingCart, Check, Crown, ArrowRight, Sparkles, X, ChevronLeft, ChevronRight,
  ExternalLink,
} from "lucide-react";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { ContentCardSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

const mediaIcons: Record<string, any> = {
  VIDEO: Video,
  AUDIO: Music,
  PDF: FileText,
  IMAGE: ImageIcon,
  TEXT: FileText,
};
const mediaColors: Record<string, React.CSSProperties> = {
  VIDEO: { background: "rgba(122,12,28,0.30)", color: "#e8a0a8" },
  AUDIO: { background: "rgba(100,30,80,0.30)", color: "#d4a0cc" },
  PDF:   { background: "rgba(120,80,10,0.30)", color: "#d4a055" },
  IMAGE: { background: "rgba(180,140,20,0.22)", color: "#d4af37" },
  TEXT:  { background: "rgba(40,35,32,0.85)",  color: "#8a7f78" },
};

interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  mediaType: string;
  contentUrl: string | null;
  thumbnailUrl: string | null;
  separatePurchaseEnabled: boolean;
  separatePurchasePrice: number | null;
  membershipAccess: { plan: { name: string; level: number } }[];
  isAccessible: boolean;
  isPurchased: boolean;
  includedInMembership: boolean;
  accessType: "MEMBERSHIP" | "PURCHASED" | "LOCKED";
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: ContentItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];
  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    // Prevent body scroll while open
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,5,5,0.96)", backdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-10 p-2 rounded-xl transition-colors"
        style={{ background: "rgba(255,255,255,0.08)", color: "#f5ede6" }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(122,12,28,0.40)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.08)", color: "#f5ede6" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-xl transition-all"
          style={{ background: "rgba(255,255,255,0.08)", color: "#f5ede6" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Image */}
      <div
        className="relative flex flex-col items-center gap-4 max-w-5xl w-full px-16"
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={item.id}
          src={item.contentUrl!}
          alt={item.title}
          className="max-h-[78vh] w-auto max-w-full rounded-xl object-contain"
          style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.80)" }}
        />

        {/* Caption */}
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold" style={{ color: "#f5ede6" }}>{item.title}</p>
          {item.description && (
            <p className="text-xs" style={{ color: "#8a7f78" }}>{item.description}</p>
          )}
          {items.length > 1 && (
            <p className="text-[11px]" style={{ color: "#6b5040" }}>
              {index + 1} / {items.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ContentCard({
  item,
  showBuyButton,
  onBuy,
  buyLoading,
  onOpen,
}: {
  item: ContentItem;
  showBuyButton?: boolean;
  onBuy?: (contentId: string) => void;
  buyLoading?: boolean;
  onOpen?: (item: ContentItem) => void;
}) {
  const Icon = mediaIcons[item.mediaType] || FileText;
  const isLocked = item.accessType === "LOCKED";
  const canOpen = !isLocked && !!onOpen;

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-[350ms] ease-out ${
        isLocked ? "opacity-90 hover:opacity-100" : "hover:-translate-y-1 cursor-pointer"
      }`}
      style={{
        background: "#181312",
        border: `1px solid ${isLocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.50)",
      }}
      onClick={() => canOpen && onOpen(item)}
      onMouseEnter={e => {
        if (!isLocked) (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.20)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(122,12,28,0.28)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.50)";
        (e.currentTarget as HTMLElement).style.borderColor = isLocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.06)";
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden" style={{ background: "linear-gradient(145deg, #1e0a10, #211916)" }}>
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className={`w-full h-full object-cover transition-transform duration-[450ms] ease-out group-hover:scale-105 ${
              isLocked ? "brightness-[0.65] saturate-50" : "brightness-95 contrast-[1.04]"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center transition-transform duration-[450ms] ease-out group-hover:scale-105">
            <Icon className="h-12 w-12" style={{ color: isLocked ? "rgba(138,127,120,0.40)" : "rgba(138,127,120,0.65)" }} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/[0.06] via-transparent to-amber-950/[0.20] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/[0.08] to-transparent transition-opacity duration-[350ms] ease-out group-hover:from-black/75" />

        {/* Media type badge */}
        <span
          className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-sm"
          style={mediaColors[item.mediaType] || { background: "rgba(40,35,32,0.90)", color: "#8a7f78" }}
        >
          {item.mediaType}
        </span>

        {/* Lock / unlock indicator */}
        <div className="absolute top-3 right-3">
          {isLocked ? (
            <div className="p-1.5 rounded-lg backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.50)", color: "rgba(255,255,255,0.75)" }}>
              <Lock className="h-3 w-3" />
            </div>
          ) : (
            <div
              className="p-1.5 rounded-lg backdrop-blur-sm transition-all duration-[350ms] ease-out group-hover:scale-110"
              style={{ background: item.isPurchased ? "rgba(59,130,246,0.75)" : "rgba(16,185,129,0.75)", color: "#fff" }}
            >
              <Unlock className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="p-3 rounded-2xl backdrop-blur-sm border border-white/10 transition-all duration-[350ms] ease-out group-hover:scale-105"
              style={{ background: "rgba(0,0,0,0.45)" }}
            >
              <Lock className="h-6 w-6 text-white/90" />
            </div>
          </div>
        )}

        {/* "Open" CTA — fade-up on hover, dark luxury style */}
        {canOpen && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[320ms] ease-out pointer-events-none">
            <div
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold"
              style={{
                background: "rgba(12,8,9,0.78)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#f5ede6",
              }}
            >
              {item.mediaType === "IMAGE" ? (
                <>View image <ArrowRight className="h-3 w-3" /></>
              ) : (
                <>Open content <ExternalLink className="h-3 w-3" /></>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 pt-3.5 space-y-3">
        {/* Access badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isLocked && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={
                item.isPurchased
                  ? { background: "rgba(59,130,246,0.15)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.25)" }
                  : { background: "rgba(16,185,129,0.15)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.25)" }
              }
            >
              <Check className="h-2.5 w-2.5" />
              {item.isPurchased ? "Purchased" : "Included"}
            </span>
          )}
          {item.membershipAccess.slice(0, 2).map((a) => (
            <MembershipBadge key={a.plan.name} planLevel={a.plan.level} planName={a.plan.name} size="sm" showIcon={false} />
          ))}
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 tracking-tight">{item.title}</h3>
          {item.description && (
            <p className="text-[11px] text-muted-foreground/80 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* Buy CTA */}
        {isLocked && item.separatePurchaseEnabled && item.separatePurchasePrice && showBuyButton && (
          <button
            onClick={e => { e.stopPropagation(); onBuy?.(item.id); }}
            disabled={buyLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-[250ms] ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-[1.18]"
            style={{
              background: "linear-gradient(160deg, #7a0c1c 0%, #5c0815 55%, #3d0510 100%)",
              color: "#f5ede6",
              boxShadow: "0 2px 10px rgba(122,12,28,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {buyLoading ? "Redirecting…" : `Buy for ${formatCurrency(item.separatePurchasePrice)}`}
          </button>
        )}

        {isLocked && !item.separatePurchaseEnabled && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
            <Crown className="h-3.5 w-3.5 text-amber-500/70" />
            <span>Requires a higher membership</span>
          </div>
        )}

        {/* Mobile open button */}
        {canOpen && (
          <button
            onClick={e => { e.stopPropagation(); onOpen(item); }}
            className="flex sm:hidden items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 ease-out"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#cbbfb6",
            }}
          >
            {item.mediaType === "IMAGE" ? "View image" : "Open content"}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold font-display text-foreground tracking-tight">{children}</h2>
      <span className="px-2 py-0.5 rounded-full bg-muted/70 text-[11px] font-medium text-muted-foreground/80">
        {count}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyContentPage() {
  const [data, setData] = useState<{
    included: ContentItem[];
    purchased: ContentItem[];
    locked: ContentItem[];
    activeMembership: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingContentId, setBuyingContentId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ items: ContentItem[]; index: number } | null>(null);

  // All accessible items (for lightbox navigation pool)
  const accessible = [...(data?.included ?? []), ...(data?.purchased ?? [])];
  // Image-only items that can be lightboxed
  const imageItems = accessible.filter((i) => i.mediaType === "IMAGE" && i.contentUrl);

  const handleOpen = useCallback((item: ContentItem) => {
    if (item.mediaType === "IMAGE" && item.contentUrl) {
      const index = imageItems.findIndex((i) => i.id === item.id);
      setLightbox({ items: imageItems, index: Math.max(0, index) });
    } else if (item.contentUrl) {
      window.open(item.contentUrl, "_blank", "noopener,noreferrer");
    }
  }, [imageItems]);

  const closeLightbox = useCallback(() => setLightbox(null), []);
  const prevImage = useCallback(() => setLightbox((lb) => lb && lb.index > 0 ? { ...lb, index: lb.index - 1 } : lb), []);
  const nextImage = useCallback(() => setLightbox((lb) => lb && lb.index < lb.items.length - 1 ? { ...lb, index: lb.index + 1 } : lb), []);

  const handleBuy = async (contentId: string) => {
    setBuyingContentId(contentId);
    try {
      const res = await fetch("/api/stripe/create-content-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Could not start checkout. Please try again.");
        return;
      }
      window.location.href = json.url;
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBuyingContentId(null);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const justPurchased = params.get("purchased") === "1";

    const fetchData = () =>
      fetch("/api/app/content")
        .then((r) => r.json())
        .then((d) => setData(d.data))
        .catch(() => toast.error("Failed to load content"))
        .finally(() => setLoading(false));

    if (justPurchased && sessionId) {
      fetch("/api/stripe/fulfill-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
        .then((r) => r.json())
        .then((d) => { if (d.success) toast.success("Content unlocked!"); })
        .catch(() => {})
        .finally(() => fetchData());
    } else {
      fetchData();
    }
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <ContentCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const { included = [], purchased = [], locked = [], activeMembership } = data || {};
  const hasAny = accessible.length + locked.length > 0;

  return (
    <>
      {lightbox && (
        <Lightbox
          items={lightbox.items}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}

      <div className="px-6 py-10 max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">My Content</h1>
            <p className="text-muted-foreground/75 text-sm mt-1.5 leading-relaxed">
              Your wellness library — everything you can access and more to explore
            </p>
          </div>
          {activeMembership && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/60 backdrop-blur-sm transition-all duration-200 hover:bg-muted/70">
              <MembershipBadge planLevel={activeMembership.plan.level} planName={activeMembership.plan.name} size="sm" />
              <span className="text-[11px] text-muted-foreground/75 hidden sm:inline">membership</span>
            </div>
          )}
        </div>

        {!hasAny && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 rounded-2xl bg-muted/40 mb-4">
              <PlaySquare className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-foreground mb-2 tracking-tight">No content available yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Content will appear here once it&apos;s published and assigned to your membership.
            </p>
          </div>
        )}

        {accessible.length > 0 && (
          <section className="space-y-4">
            <SectionTitle count={accessible.length}>Available to You</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {accessible.map((item) => (
                <ContentCard key={item.id} item={item} onOpen={handleOpen} />
              ))}
            </div>
          </section>
        )}

        {locked.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionTitle count={locked.length}>Unlock More</SectionTitle>
              {!activeMembership && (
                <Link
                  href="/app/membership"
                  className="flex items-center gap-1.5 text-sm font-medium hover:underline"
                  style={{ color: "#e8a0a8" }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Upgrade to access more
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {locked.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  showBuyButton
                  onBuy={handleBuy}
                  buyLoading={buyingContentId === item.id}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
