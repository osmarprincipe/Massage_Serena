"use client";

import { useEffect, useState } from "react";
import type React from "react";
import {
  ShoppingBag, Video, Music, FileText, Image as ImageIcon,
  Calendar, ArrowRight, Receipt,
} from "lucide-react";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const mediaIcons: Record<string, any> = {
  VIDEO: Video, AUDIO: Music, PDF: FileText, IMAGE: ImageIcon, TEXT: FileText,
};

// Dark luxury palette — matches the cinematic member area
const mediaColors: Record<string, React.CSSProperties> = {
  VIDEO: { background: "rgba(122,12,28,0.30)",  color: "#f0b8c0" },
  AUDIO: { background: "rgba(100,30,80,0.30)",  color: "#d4a0cc" },
  PDF:   { background: "rgba(120,80,10,0.30)",  color: "#d4a055" },
  IMAGE: { background: "rgba(180,140,20,0.22)", color: "#d4af37" },
  TEXT:  { background: "rgba(40,35,32,0.85)",   color: "#8a7f78" },
};

export default function MyPurchasesPage() {
  const [data, setData] = useState<{ purchases: any[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app/purchases")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(() => toast.error("Failed to load purchases"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
      </div>
    );
  }

  const { purchases = [], total = 0 } = data || {};

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          My Purchases
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Content you&apos;ve purchased individually
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-2xl border p-5 plan-card-glass"
          style={{
            background: "rgba(14,8,11,0.82)",
            borderColor: "rgba(255,255,255,0.07)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ background: "rgba(122,12,28,0.22)", color: "#e8a0a8" }}>
              <ShoppingBag className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Purchases</p>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">{purchases.length}</p>
        </div>
        <div
          className="rounded-2xl border p-5 plan-card-glass"
          style={{
            background: "rgba(14,8,11,0.82)",
            borderColor: "rgba(255,255,255,0.07)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl" style={{ background: "rgba(180,140,20,0.18)", color: "#d4af37" }}>
              <Receipt className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Spent</p>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Purchases List */}
      {purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-5 rounded-2xl bg-muted/50 mb-4">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No purchases yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Individual content purchases will appear here. Browse your content library to find items available to buy.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Purchase History
          </h2>
          <div
            className="rounded-2xl border overflow-hidden plan-card-glass"
            style={{ background: "rgba(12,7,9,0.84)", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {purchases.map((purchase: any) => {
                const Icon = mediaIcons[purchase.content?.mediaType] || FileText;
                return (
                  <div
                    key={purchase.id}
                    className="flex items-center gap-4 px-5 py-4 transition-colors group"
                    style={{ borderColor: "rgba(255,255,255,0.05)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Thumbnail / icon */}
                    <div
                      className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0"
                      style={{ background: "rgba(40,20,15,0.65)" }}
                    >
                      {purchase.content?.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={purchase.content.thumbnailUrl}
                          alt={purchase.content.title}
                          className="w-full h-full object-cover brightness-90"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon className="h-5 w-5" style={{ color: "rgba(203,191,182,0.50)" }} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {purchase.content?.title || "Unknown content"}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={mediaColors[purchase.content?.mediaType] ?? { background: "rgba(40,35,32,0.85)", color: "#8a7f78" }}
                        >
                          {purchase.content?.mediaType || "—"}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(purchase.purchasedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Price + action */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(purchase.pricePaid)}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{ border: "1px solid rgba(255,255,255,0.10)", color: "rgba(245,237,230,0.70)" }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                          (e.currentTarget as HTMLElement).style.color = "#f5ede6";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                          (e.currentTarget as HTMLElement).style.color = "rgba(245,237,230,0.70)";
                        }}
                      >
                        Open <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
