/**
 * Level-based plan styling system.
 *
 * ALL visual tier logic lives here. No component should check plan.name to decide style.
 * Pass planLevel + maxLevel (when available) — tier is computed automatically.
 *
 * Tier logic:
 *   ratio = planLevel / maxLevel
 *   ratio >= 1.0  → "gold"    (top tier)
 *   ratio >= 0.60 → "crimson" (high tier)
 *   ratio >= 0.30 → "mid"     (mid tier)
 *   else          → "neutral"
 *
 * When maxLevel is unavailable (isolated badge), absolute thresholds apply:
 *   level >= 3 → gold | level >= 2 → crimson | level >= 1 → mid | else → neutral
 */

import { Star, Crown, Sparkles, type LucideIcon } from "lucide-react";
import type React from "react";

export type PlanTier = "gold" | "crimson" | "mid" | "neutral";

export function getPlanTier(planLevel: number, maxLevel?: number): PlanTier {
  if (maxLevel !== undefined && maxLevel > 0) {
    const ratio = planLevel / maxLevel;
    if (ratio >= 1)   return "gold";
    if (ratio >= 0.6) return "crimson";
    if (ratio >= 0.3) return "mid";
    return "neutral";
  }
  if (planLevel >= 3) return "gold";
  if (planLevel >= 2) return "crimson";
  if (planLevel >= 1) return "mid";
  return "neutral";
}

export function getTierIcon(tier: PlanTier): LucideIcon {
  if (tier === "gold")    return Sparkles;
  if (tier === "crimson") return Crown;
  return Star;
}

/** Badge pill style */
export const tierBadgeStyles: Record<PlanTier, React.CSSProperties> = {
  gold: {
    background: "linear-gradient(135deg, rgba(180,140,20,0.26), rgba(212,175,55,0.16))",
    color: "#d4af37",
    border: "1px solid rgba(212,175,55,0.32)",
    boxShadow: "0 0 10px rgba(212,175,55,0.12)",
  },
  crimson: {
    background: "linear-gradient(135deg, rgba(122,12,28,0.32), rgba(90,8,20,0.22))",
    color: "#f0b8c0",
    border: "1px solid rgba(177,18,38,0.30)",
  },
  mid: {
    background: "rgba(50,28,32,0.90)",
    color: "#d4a0a8",
    border: "1px solid rgba(177,18,38,0.14)",
  },
  neutral: {
    background: "rgba(28,22,20,0.90)",
    color: "#cbbfb6",
    border: "1px solid rgba(138,127,120,0.20)",
  },
};

/** Icon/accent container style */
export const tierAccentStyles: Record<PlanTier, React.CSSProperties> = {
  gold:    { background: "rgba(180,140,20,0.22)", color: "#d4af37" },
  crimson: { background: "rgba(122,12,28,0.30)",  color: "#e8a0a8" },
  mid:     { background: "rgba(80,20,28,0.25)",   color: "#d4a0a8" },
  neutral: { background: "rgba(40,35,32,0.90)",   color: "#cbbfb6" },
};

/** Plan card background + border */
export const tierCardStyles: Record<PlanTier, React.CSSProperties> = {
  gold:    { background: "transparent", border: "1px solid rgba(212,175,55,0.22)",  boxShadow: "0 0 0 0 transparent" },
  crimson: { background: "transparent", border: "1px solid rgba(177,18,38,0.22)",   boxShadow: "0 0 0 0 transparent" },
  mid:     { background: "transparent", border: "1px solid rgba(177,18,38,0.12)",   boxShadow: "0 0 0 0 transparent" },
  neutral: { background: "transparent", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 0 0 0 transparent" },
};

/** Selected state ring + glow (payment page card selection) */
export const tierSelectedStyles: Record<PlanTier, React.CSSProperties> = {
  gold:    { border: "1px solid rgba(212,175,55,0.65)",  boxShadow: "0 0 0 3px rgba(212,175,55,0.14), 0 16px 48px rgba(0,0,0,0.70), 0 0 32px rgba(212,175,55,0.12)" },
  crimson: { border: "1px solid rgba(177,18,38,0.55)",   boxShadow: "0 0 0 3px rgba(177,18,38,0.10), 0 16px 48px rgba(0,0,0,0.70), 0 0 28px rgba(177,18,38,0.12)" },
  mid:     { border: "1px solid rgba(177,18,38,0.35)",   boxShadow: "0 0 0 3px rgba(177,18,38,0.06), 0 16px 48px rgba(0,0,0,0.70)" },
  neutral: { border: "1px solid rgba(255,255,255,0.20)", boxShadow: "0 0 0 3px rgba(255,255,255,0.05), 0 16px 48px rgba(0,0,0,0.70)" },
};

/** Active plan (current membership) shadow */
export const tierBoxShadowActive: Record<PlanTier, string> = {
  gold:    "0 8px 48px rgba(212,175,55,0.15), 0 2px 8px rgba(0,0,0,0.50)",
  crimson: "0 8px 48px rgba(122,12,28,0.20), 0 2px 8px rgba(0,0,0,0.50)",
  mid:     "0 8px 48px rgba(122,12,28,0.12), 0 2px 8px rgba(0,0,0,0.50)",
  neutral: "0 8px 48px rgba(0,0,0,0.25),     0 2px 8px rgba(0,0,0,0.50)",
};

/** Ambient glow dot behind active plan card */
export const tierGlowColor: Record<PlanTier, string> = {
  gold:    "rgba(212,175,55,0.08)",
  crimson: "rgba(177,18,38,0.10)",
  mid:     "rgba(177,18,38,0.06)",
  neutral: "rgba(122,12,28,0.06)",
};

/** Breakdown bar gradient (admin dashboard) */
export const tierBarColor: Record<PlanTier, string> = {
  gold:    "linear-gradient(90deg, #d4af37, rgba(212,175,55,0.55))",
  crimson: "linear-gradient(90deg, #b11226, rgba(177,18,38,0.60))",
  mid:     "linear-gradient(90deg, rgba(177,18,38,0.70), rgba(177,18,38,0.35))",
  neutral: "rgba(138,127,120,0.55)",
};
