"use client";

import { useEffect, useState } from "react";
import type React from "react";
import {
  Check, ArrowRight, Calendar,
  AlertCircle, Clock, RefreshCw,
} from "lucide-react";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  getPlanTier, getTierIcon,
  tierCardStyles, tierAccentStyles, tierBoxShadowActive, tierGlowColor,
} from "@/lib/plan-style";
import { PlanCardsLayout } from "@/components/memberships/PlanCardsLayout";
import Link from "next/link";
import { toast } from "sonner";

export default function MyMembershipPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app/membership")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(() => toast.error("Failed to load membership"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const { activeMembership, allPlans, history } = data || {};
  const maxLevel: number = Math.max(0, ...(allPlans || []).map((p: any) => p.level ?? 0));

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          My Membership
        </h1>
        <p className="text-muted-foreground/75 text-sm mt-1.5 leading-relaxed">
          Your current plan and available upgrades
        </p>
      </div>

      {/* Current Plan */}
      {activeMembership ? (
        <div
          className="relative overflow-hidden rounded-2xl p-6 transition-all duration-[350ms] ease-out hover:-translate-y-0.5"
          style={{
            ...tierCardStyles[getPlanTier(activeMembership.plan.level, maxLevel)],
            boxShadow: tierBoxShadowActive[getPlanTier(activeMembership.plan.level, maxLevel)],
          }}
        >
          {/* Ambient glows */}
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full blur-3xl pointer-events-none"
            style={{ background: tierGlowColor[getPlanTier(activeMembership.plan.level, maxLevel)] }} />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full blur-2xl pointer-events-none"
            style={{ background: "rgba(122,12,28,0.08)" }} />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-[10px] text-muted-foreground/70 uppercase tracking-[0.12em] mb-2">Current Plan</p>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold font-display text-foreground tracking-tight">
                    {activeMembership.plan.name}
                  </h2>
                  <MembershipBadge planLevel={activeMembership.plan.level} planName={activeMembership.plan.name} maxLevel={maxLevel} size="md" />
                </div>
                <p className="text-muted-foreground/80 text-sm mt-1.5">
                  {formatCurrency(activeMembership.plan.price)} /{activeMembership.plan.billingCycle.toLowerCase()}
                </p>
              </div>
              <StatusBadge status={activeMembership.status} />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-3.5 rounded-xl border backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.10em]">Started</span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(activeMembership.startDate)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase tracking-[0.10em]">
                    {activeMembership.endDate ? "Ends" : "Billing"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {activeMembership.endDate
                    ? formatDate(activeMembership.endDate)
                    : activeMembership.plan.billingCycle.charAt(0) + activeMembership.plan.billingCycle.slice(1).toLowerCase()}
                </p>
              </div>
            </div>

            {/* Features */}
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.10em] mb-3">
                Included in your plan
              </p>
              <ul className="space-y-2.5">
                {(JSON.parse(activeMembership.plan.features) as string[]).map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "rgba(245,237,230,0.80)" }}>
                    <div className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(10,80,45,0.35)" }}>
                      <Check className="h-2.5 w-2.5" style={{ color: "#4ade80" }} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-10 text-center space-y-4"
          style={{ background: "#181312", border: "1px dashed rgba(255,255,255,0.10)" }}>
          <div className="p-4 rounded-full inline-flex mx-auto" style={{ background: "rgba(255,255,255,0.05)" }}>
            <AlertCircle className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1 tracking-tight">No active membership</h3>
            <p className="text-sm text-muted-foreground">
              Choose a plan below to unlock content and member benefits.
            </p>
          </div>
          <Link
            href="/payment"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-[250ms] ease-out hover:brightness-[1.22] active:scale-[0.98]"
            style={{
              background: "linear-gradient(160deg, #7a0c1c 0%, #5c0815 55%, #3d0510 100%)",
              color: "#f5ede6",
              boxShadow: "0 2px 12px rgba(122,12,28,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            Browse Plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Available Plans */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold font-display text-foreground">
          {activeMembership ? "Other Plans" : "Available Plans"}
        </h2>
        <PlanCardsLayout count={(allPlans || []).length}>
          {(allPlans || []).map((plan: any) => {
            const tier = getPlanTier(plan.level, maxLevel);
            const Icon = getTierIcon(tier);
            const isActive = activeMembership?.planId === plan.id;
            const features = JSON.parse(plan.features) as string[];
            const cardStyle = tierCardStyles[tier];
            const iconStyle = tierAccentStyles[tier];

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-5 transition-all duration-[350ms] ease-out ${isActive ? "-translate-y-1" : "hover:-translate-y-1.5"}`}
                style={{
                  ...cardStyle,
                  boxShadow: isActive
                    ? "0 8px 32px rgba(122,12,28,0.22), 0 2px 8px rgba(0,0,0,0.50)"
                    : "0 4px 20px rgba(0,0,0,0.45)",
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.20)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.45)"; }}
              >
                {isActive && (
                  <div className="absolute -top-2.5 left-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.08em]"
                      style={{ background: "#7a0c1c", color: "#f5ede6" }}>
                      Current
                    </span>
                  </div>
                )}

                <div className="p-2.5 rounded-xl inline-flex mb-3.5" style={iconStyle}>
                  <Icon className="h-4 w-4" />
                </div>

                <h3 className="font-bold font-display text-foreground mb-0.5 tracking-tight">{plan.name}</h3>
                <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed line-clamp-2">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-xl font-bold font-display text-foreground tracking-tight">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-[11px] text-muted-foreground">/{plan.billingCycle.toLowerCase()}</span>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {features.slice(0, 3).map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] leading-relaxed" style={{ color: "rgba(245,237,230,0.60)" }}>
                      <Check className="h-3 w-3 shrink-0" style={{ color: "rgba(74,222,128,0.75)" }} />
                      {f}
                    </li>
                  ))}
                  {features.length > 3 && (
                    <li className="text-[11px] text-muted-foreground pl-5">+{features.length - 3} more</li>
                  )}
                </ul>

                {!isActive && (
                  <Link
                    href={`/payment?planId=${plan.id}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-[250ms] ease-out active:scale-[0.98] hover:brightness-[1.22]"
                    style={{
                      background: "linear-gradient(160deg, #7a0c1c 0%, #5c0815 55%, #3d0510 100%)",
                      color: "#f5ede6",
                      boxShadow: "0 2px 8px rgba(122,12,28,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}
                  >
                    {activeMembership
                      ? plan.level > activeMembership.plan.level
                        ? "Upgrade"
                        : "Downgrade"
                      : "Select Plan"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </PlanCardsLayout>
      </div>

      {/* History */}
      {history && history.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold font-display text-foreground tracking-tight">History</h2>
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.50)" }}>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between px-5 py-4 transition-colors duration-200"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(122,12,28,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground tracking-tight">{h.plan.name}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{formatDate(h.startDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground tracking-tight">
                      {formatCurrency(h.plan.price)}
                    </span>
                    <StatusBadge status={h.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
