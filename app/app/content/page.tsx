"use client";

import { useEffect, useState } from "react";
import type React from "react";
import {
  PlaySquare, Lock, Unlock, Video, Music, FileText, Image as ImageIcon,
  ShoppingCart, Check, Crown, ArrowRight, Sparkles,
} from "lucide-react";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { ContentCardSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

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
  thumbnailUrl: string | null;
  separatePurchaseEnabled: boolean;
  separatePurchasePrice: number | null;
  membershipAccess: { plan: { name: string } }[];
  isAccessible: boolean;
  isPurchased: boolean;
  includedInMembership: boolean;
  accessType: "MEMBERSHIP" | "PURCHASED" | "LOCKED";
}

function ContentCard({
  item,
  showBuyButton,
  onBuy,
  buyLoading,
}: {
  item: ContentItem;
  showBuyButton?: boolean;
  onBuy?: (contentId: string) => void;
  buyLoading?: boolean;
}) {
  const Icon = mediaIcons[item.mediaType] || FileText;
  const isLocked = item.accessType === "LOCKED";

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-[350ms] ease-out ${isLocked ? "opacity-90 hover:opacity-100" : "hover:-translate-y-1"}`}
      style={{ background: "#181312", border: `1px solid ${isLocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.06)"}`, boxShadow: "0 4px 20px rgba(0,0,0,0.50)" }}
      onMouseEnter={e => { if (!isLocked) (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.20)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(122,12,28,0.28)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.50)"; (e.currentTarget as HTMLElement).style.borderColor = isLocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.06)"; }}
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

        {/* Warm skin-tone tint — cinematic feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/[0.06] via-transparent to-amber-950/[0.20] pointer-events-none" />

        {/* Deep bottom gradient — always on, deepens on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/[0.08] to-transparent transition-opacity duration-[350ms] ease-out group-hover:from-black/75" />

        {/* Media type badge */}
        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-sm"
          style={mediaColors[item.mediaType] || { background: "rgba(40,35,32,0.90)", color: "#8a7f78" }}>
          {item.mediaType}
        </span>

        {/* Access indicator */}
        <div className="absolute top-3 right-3">
          {isLocked ? (
            <div className="p-1.5 rounded-lg bg-black/50 text-white/90 backdrop-blur-sm">
              <Lock className="h-3 w-3" />
            </div>
          ) : (
            <div className={`p-1.5 rounded-lg text-white backdrop-blur-sm transition-all duration-[350ms] ease-out group-hover:scale-110 ${
              item.isPurchased ? "bg-blue-500/85" : "bg-emerald-500/85"
            }`}>
              <Unlock className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="p-3 rounded-2xl bg-black/45 backdrop-blur-sm border border-white/10 transition-all duration-[350ms] ease-out group-hover:scale-105 group-hover:bg-black/55">
              <Lock className="h-6 w-6 text-white/90" />
            </div>
          </div>
        )}

        {/* "Open" CTA — smooth fade-up on hover */}
        {!isLocked && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-[350ms] ease-out">
            <button className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/88 backdrop-blur-md text-foreground text-xs font-semibold hover:bg-white/95 transition-colors shadow-soft">
              Open Content
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 pt-3.5 space-y-3">
        {/* Access source badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isLocked && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
              item.isPurchased
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              <Check className="h-2.5 w-2.5" />
              {item.isPurchased ? "Purchased" : "Included"}
            </span>
          )}
          {item.membershipAccess.slice(0, 2).map((a) => (
            <MembershipBadge key={a.plan.name} level={a.plan.name} size="sm" showIcon={false} />
          ))}
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 tracking-tight">{item.title}</h3>
          {item.description && (
            <p className="text-[11px] text-muted-foreground/80 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
          )}
        </div>

        {/* Buy CTA for locked purchasable content */}
        {isLocked && item.separatePurchaseEnabled && item.separatePurchasePrice && showBuyButton && (
          <button
            onClick={() => onBuy?.(item.id)}
            disabled={buyLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-[250ms] ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-[1.20]"
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

        {/* Static fallback open button — mobile only */}
        {!isLocked && (
          <button className="flex sm:hidden items-center justify-center gap-2 w-full py-2 rounded-xl border border-border/70 text-xs font-semibold text-foreground/80 hover:bg-muted/60 transition-all duration-200 ease-out">
            Open Content
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

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

export default function MyContentPage() {
  const [data, setData] = useState<{
    included: ContentItem[];
    purchased: ContentItem[];
    locked: ContentItem[];
    activeMembership: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyingContentId, setBuyingContentId] = useState<string | null>(null);

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
    fetch("/api/app/content")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(() => toast.error("Failed to load content"))
      .finally(() => setLoading(false));
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
  const hasAny = included.length + purchased.length + locked.length > 0;

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
            My Content
          </h1>
          <p className="text-muted-foreground/75 text-sm mt-1.5 leading-relaxed">
            Your wellness library — included, purchased, and available to unlock
          </p>
        </div>
        {activeMembership && (
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border/60 backdrop-blur-sm transition-all duration-200 hover:bg-muted/70">
            <MembershipBadge level={activeMembership.plan.name} size="sm" />
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

      {/* Included in membership */}
      {included.length > 0 && (
        <section className="space-y-4">
          <SectionTitle count={included.length}>Included in your membership</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {included.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Purchased */}
      {purchased.length > 0 && (
        <section className="space-y-4">
          <SectionTitle count={purchased.length}>Purchased by you</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {purchased.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle count={locked.length}>Available to unlock</SectionTitle>
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
  );
}
