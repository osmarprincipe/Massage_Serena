"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { Crown, Star, Sparkles, Users, Check, Edit2, Plus, Archive } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { PlanDialog } from "@/components/memberships/PlanDialog";

const planIcons: Record<string, any> = { Normal: Star, VIP: Crown, Premium: Sparkles };
const planCardStyles: Record<string, React.CSSProperties> = {
  Normal:  { background: "#181312", border: "1px solid rgba(255,255,255,0.07)" },
  VIP:     { background: "linear-gradient(145deg, #1e0a10 0%, #181312 100%)", border: "1px solid rgba(122,12,28,0.25)" },
  Premium: { background: "linear-gradient(145deg, #1a1508 0%, #181312 100%)", border: "1px solid rgba(212,175,55,0.20)" },
};
const planAccentStyles: Record<string, React.CSSProperties> = {
  Normal:  { background: "rgba(40,35,32,0.90)", color: "#cbbfb6" },
  VIP:     { background: "rgba(122,12,28,0.30)", color: "#e8a0a8" },
  Premium: { background: "rgba(180,140,20,0.20)", color: "#d4af37" },
};

export default function MembershipsPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(undefined as any);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch("/api/memberships").then((r) => r.json()),
        fetch("/api/memberships/recent").then((r) => r.json()),
      ]);
      setPlans(plansRes.data || []);
      setSubscriptions(subsRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Edit ──────────────────────────────────────────────────────────────────
  const handleEdit = (plan: any) => {
    setEditingPlan(plan);
    setDialogOpen(true);
  };

  // ── New plan ──────────────────────────────────────────────────────────────
  const handleNew = () => {
    setEditingPlan(null);
    setDialogOpen(true);
  };

  // ── Save (create or edit) ─────────────────────────────────────────────────
  const handleSaved = (updatedPlan?: any) => {
    if (updatedPlan?.id) {
      setPlans((prev) => {
        const exists = prev.some((p) => p.id === updatedPlan.id);
        if (exists) {
          return prev.map((p) => (p.id === updatedPlan.id ? { ...p, ...updatedPlan } : p));
        }
        // New plan — append and re-sort by level
        return [...prev, updatedPlan].sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
      });
    }
    setDialogOpen(false);
    setEditingPlan(undefined as any);
    fetchData();
  };

  // ── Archive ───────────────────────────────────────────────────────────────
  const handleArchive = async (plan: any) => {
    const confirmed = window.confirm(
      `Archive "${plan.name}"?\n\n` +
        `The plan will be removed from sale but existing memberships will remain intact.`
    );
    if (!confirmed) return;

    setArchivingId(plan.id);
    try {
      const res = await fetch(`/api/memberships/${plan.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to archive plan");
        return;
      }
      if (json.deleted) {
        setPlans((prev) => prev.filter((p) => p.id !== plan.id));
        toast.success(`"${plan.name}" deleted`);
      } else {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, isActive: false } : p))
        );
        toast.success(`"${plan.name}" archived — existing memberships are preserved`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setArchivingId(null);
    }
  };

  return (
    <div className="max-w-7xl space-y-8">
      <div className="flex items-start justify-between">
        <SectionHeader
          title="Memberships"
          description="Manage subscription plans and view active members"
          icon={Crown}
        />
        <Button onClick={handleNew} className="shrink-0">
          <Plus className="h-4 w-4" />
          New Plan
        </Button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading
          ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-80 rounded-2xl" />)
          : plans.map((plan) => {
              const Icon = planIcons[plan.name] || Crown;
              const features = (() => {
                try { return JSON.parse(plan.features || "[]") as string[]; }
                catch { return [] as string[]; }
              })();
              const activeMembers: any[] = plan.userMemberships || [];
              const totalCount: number = plan._count?.userMemberships ?? activeMembers.length;
              const cardStyle = planCardStyles[plan.name] || { background: "#181312", border: "1px solid rgba(255,255,255,0.07)" };
              const accentStyle = planAccentStyles[plan.name] || { background: "rgba(40,35,32,0.90)", color: "#cbbfb6" };
              const isArchiving = archivingId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-6 transition-all duration-[350ms] ease-out hover:-translate-y-1 ${!plan.isActive ? "opacity-60" : ""}`}
                  style={{ ...cardStyle, boxShadow: "0 4px 24px rgba(0,0,0,0.50)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.22)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.50)";
                  }}
                >
                  {/* Most Popular badge */}
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap"
                        style={{ background: "linear-gradient(135deg, #9a7a1a 0%, #d4af37 100%)", color: "#0f0b0a", boxShadow: "0 2px 10px rgba(212,175,55,0.30)" }}>
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Top-right: inactive pill + edit + archive */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {!plan.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-muted-foreground"
                        style={{ background: "rgba(40,35,32,0.90)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        Inactive
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(plan)}
                      className="h-7 w-7 backdrop-blur-sm border transition-all duration-200 text-muted-foreground hover:text-foreground"
                      style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }}
                      title="Edit plan"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleArchive(plan)}
                      disabled={isArchiving}
                      className="h-7 w-7 backdrop-blur-sm border transition-all duration-200 text-muted-foreground hover:text-destructive"
                      style={{ background: "rgba(255,255,255,0.07)", borderColor: "rgba(255,255,255,0.12)" }}
                      title="Archive plan"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Icon & badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl" style={accentStyle}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <MembershipBadge level={plan.name} size="md" />
                  </div>

                  {/* Price */}
                  <div className="mb-5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold font-display text-foreground tracking-tight">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-[11px] text-muted-foreground/75">
                        /{plan.billingCycle.toLowerCase()}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-[12px] text-muted-foreground/80 mt-2 leading-relaxed">
                        {plan.description}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <div className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(10,80,45,0.35)" }}>
                          <Check className="h-2.5 w-2.5" style={{ color: "#4ade80" }} />
                        </div>
                        <span className="leading-relaxed" style={{ color: "rgba(245,237,230,0.70)" }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Active members */}
                  <div className="pt-4 border-t border-border/40">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/75 mb-3">
                      <Users className="h-3.5 w-3.5" />
                      <span>{totalCount} active member{totalCount !== 1 ? "s" : ""}</span>
                    </div>
                    {activeMembers.length > 0 && (
                      <div className="flex -space-x-2">
                        {activeMembers.slice(0, 4).map((um: any) => (
                          <div
                            key={um.user.email}
                            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold border-2"
                            style={{ background: "rgba(122,12,28,0.35)", color: "#e8a0a8", borderColor: "#0f0b0a" }}
                            title={um.user.name || um.user.email}
                          >
                            {getInitials(um.user.name || um.user.email)}
                          </div>
                        ))}
                        {totalCount > 4 && (
                          <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium border-2 text-muted-foreground"
                            style={{ background: "rgba(255,255,255,0.06)", borderColor: "#0f0b0a" }}>
                            +{totalCount - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Recent Subscriptions */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.50)" }}>
        <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="font-semibold font-display text-foreground">Recent Subscriptions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest membership changes</p>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))
          ) : subscriptions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No subscriptions yet
            </div>
          ) : (
            subscriptions.map((sub: any) => (
              <div
                key={sub.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors"
                style={{ background: "transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(122,12,28,0.07)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{ background: "rgba(122,12,28,0.35)", color: "#e8a0a8" }}>
                  {getInitials(sub.user.name || sub.user.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {sub.user.name || sub.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                </div>
                <MembershipBadge level={sub.plan.name} size="sm" />
                <StatusBadge status={sub.status} />
                <span className="text-sm font-medium text-foreground hidden md:block">
                  {formatCurrency(sub.plan.price)}
                </span>
                <span className="text-xs text-muted-foreground hidden lg:block">
                  {formatDate(sub.startDate)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit dialog */}
      {dialogOpen && (
        <PlanDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditingPlan(undefined as any); }}
          plan={editingPlan ?? null}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
