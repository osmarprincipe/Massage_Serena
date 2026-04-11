"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import type React from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles, Check, ArrowRight, Shield,
  Lock, ChevronDown, BadgeCheck, Zap, Mail, UserCheck,
  CreditCard, CalendarCheck, Loader2, Star, X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  getPlanTier, getTierIcon, tierAccentStyles,
} from "@/lib/plan-style";
import type { PlanTier } from "@/lib/plan-style";
import { PlanCardsLayout } from "@/components/memberships/PlanCardsLayout";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  level: number;
  price: number;
  billingCycle: string;
  description: string;
  features: string;
  isPopular: boolean;
}

type FlowStep = "plan" | "confirm";

// ─── Payment-page-only card styles (glassmorphism) ───────────────────────────
// These are intentionally scoped to the payment page to not affect admin / member pages.

const paymentCardBase: Record<PlanTier, React.CSSProperties> = {
  gold: {
    background: "rgba(20, 8, 5, 0.62)",
    border: "1px solid rgba(212,175,55,0.28)",
    boxShadow: "0 8px 48px rgba(0,0,0,0.58), inset 0 1px 0 rgba(212,175,55,0.10)",
  },
  crimson: {
    background: "rgba(14, 5, 8, 0.68)",
    border: "1px solid rgba(177,18,38,0.35)",
    boxShadow: "0 8px 48px rgba(0,0,0,0.58), inset 0 1px 0 rgba(177,18,38,0.10)",
  },
  mid: {
    background: "rgba(14, 5, 8, 0.62)",
    border: "1px solid rgba(177,18,38,0.20)",
    boxShadow: "0 8px 48px rgba(0,0,0,0.58), inset 0 1px 0 rgba(177,18,38,0.06)",
  },
  neutral: {
    background: "rgba(14, 7, 9, 0.58)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 8px 48px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.05)",
  },
};

const paymentCardPopular: React.CSSProperties = {
  border: "1px solid rgba(177,18,38,0.55)",
  boxShadow: "0 0 60px rgba(177,18,38,0.20), 0 16px 56px rgba(0,0,0,0.65), inset 0 1px 0 rgba(177,18,38,0.14)",
};

const paymentCardSelected: Record<PlanTier, React.CSSProperties> = {
  gold: {
    border: "1px solid rgba(212,175,55,0.70)",
    boxShadow: "0 0 0 3px rgba(212,175,55,0.16), 0 16px 64px rgba(0,0,0,0.72), 0 0 44px rgba(212,175,55,0.20)",
    transform: "scale(1.02)",
  },
  crimson: {
    border: "1px solid rgba(177,18,38,0.70)",
    boxShadow: "0 0 0 3px rgba(177,18,38,0.16), 0 16px 64px rgba(0,0,0,0.72), 0 0 44px rgba(177,18,38,0.24)",
    transform: "scale(1.02)",
  },
  mid: {
    border: "1px solid rgba(177,18,38,0.50)",
    boxShadow: "0 0 0 3px rgba(177,18,38,0.10), 0 16px 64px rgba(0,0,0,0.72), 0 0 28px rgba(177,18,38,0.16)",
    transform: "scale(1.02)",
  },
  neutral: {
    border: "1px solid rgba(255,255,255,0.28)",
    boxShadow: "0 0 0 3px rgba(255,255,255,0.07), 0 16px 64px rgba(0,0,0,0.72)",
    transform: "scale(1.02)",
  },
};

// ─── Static content ───────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  { icon: Star,         step: "1", title: "Choose a plan",        desc: "Select the membership that best fits your wellness goals." },
  { icon: UserCheck,    step: "2", title: "Create your account",   desc: "Create a free account to continue — takes only a moment." },
  { icon: CreditCard,   step: "3", title: "Complete payment",      desc: "Secure checkout — your membership is confirmed instantly." },
  { icon: CalendarCheck,step: "4", title: "Access your benefits",  desc: "Your member area unlocks immediately after payment." },
];

const TRUST_POINTS = [
  { icon: Shield,     label: "SSL Secured" },
  { icon: BadgeCheck, label: "Premium Access Included" },
  { icon: Mail,       label: "Confirmation Email Sent" },
  { icon: Zap,        label: "Instant Membership Activation" },
];

const FAQ_ITEMS = [
  {
    q: "Can I upgrade my plan later?",
    a: "Yes. Once your account is active you can upgrade or change your membership at any time from your member dashboard.",
  },
  {
    q: "Do I need an account before purchasing?",
    a: "Yes — you need a free account to purchase a membership. It only takes a moment to create one.",
  },
  {
    q: "What happens after payment?",
    a: "Your membership is activated immediately. You can log in and start enjoying your member benefits right away.",
  },
  {
    q: "Are there any long-term contracts?",
    a: "No contracts. Memberships are billed monthly and can be managed directly from your account at any time.",
  },
];

// ─── Cinematic background ─────────────────────────────────────────────────────

function CinematicBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#070305" }}
      aria-hidden
    >
      {/* Primary nebula bloom — left-center */}
      <div
        style={{
          position: "absolute",
          top: "5%", left: "-18%",
          width: "85%", height: "95%",
          background:
            "radial-gradient(ellipse at center, rgba(140,8,25,0.72) 0%, rgba(100,5,18,0.48) 28%, rgba(60,3,12,0.22) 54%, transparent 74%)",
          filter: "blur(60px)",
          transform: "rotate(-8deg)",
        }}
      />
      {/* Secondary bloom — upper right */}
      <div
        style={{
          position: "absolute",
          top: "-8%", right: "-8%",
          width: "62%", height: "72%",
          background:
            "radial-gradient(ellipse at center, rgba(100,5,18,0.48) 0%, rgba(65,3,12,0.28) 38%, transparent 64%)",
          filter: "blur(65px)",
        }}
      />
      {/* Lower atmospheric warmth */}
      <div
        style={{
          position: "absolute",
          bottom: "-18%", left: "10%",
          width: "80%", height: "65%",
          background:
            "radial-gradient(ellipse at bottom center, rgba(110,8,22,0.38) 0%, rgba(65,4,14,0.18) 45%, transparent 68%)",
          filter: "blur(75px)",
        }}
      />
      {/* Subtle gold warmth accent */}
      <div
        style={{
          position: "absolute",
          top: "22%", left: "38%",
          width: "26%", height: "32%",
          background:
            "radial-gradient(circle, rgba(180,130,20,0.09) 0%, transparent 68%)",
          filter: "blur(35px)",
        }}
      />
      {/* Vignette — edge darkening */}
      <div
        style={{
          position: "absolute", inset: 0,
          background:
            "radial-gradient(ellipse 115% 105% at 50% 50%, transparent 22%, rgba(4,1,2,0.55) 68%, rgba(4,1,2,0.90) 100%)",
        }}
      />
      {/* Top fade */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "200px",
          background: "linear-gradient(to bottom, rgba(5,2,3,0.90) 0%, transparent 100%)",
        }}
      />
      {/* Bottom fade — keeps lower sections immersive */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "300px",
          background: "linear-gradient(to top, rgba(5,2,3,0.75) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="flex items-center gap-4 max-w-lg mx-auto">
      <div
        className="flex-1 h-px"
        style={{ background: "linear-gradient(to right, transparent, rgba(177,18,38,0.28))" }}
      />
      <span style={{ color: "rgba(177,18,38,0.40)", fontSize: "10px", letterSpacing: "0.15em" }}>✦</span>
      <div
        className="flex-1 h-px"
        style={{ background: "linear-gradient(to left, transparent, rgba(177,18,38,0.28))" }}
      />
    </div>
  );
}

// ─── Inner page content (uses useSearchParams — must be inside Suspense) ──────

function PaymentContent() {
  const { data: session, status: authStatus } = useSession();
  const searchParams  = useSearchParams();
  const router        = useRouter();

  const [plans, setPlans]               = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const maxLevel = plans.length > 0 ? Math.max(...plans.map((p) => p.level)) : 1;
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [step, setStep]                 = useState<FlowStep>("plan");
  const [loading, setLoading]           = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [openFaq, setOpenFaq]           = useState<number | null>(null);
  // Card whose full benefit overlay is open (null = none)
  const [overlayCard, setOverlayCard]   = useState<string | null>(null);

  // Prevents auto-confirm effect from re-running after the user presses "← Back"
  const hasAutoConfirmedRef = useRef(false);

  // Load plans
  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setPlans(Array.isArray(d.data) ? d.data : []))
      .catch((err) => { console.error("[payment] failed to load plans:", err); setPlans([]); })
      .finally(() => setPlansLoading(false));
  }, []);

  // Auto-select plan from URL ?planId= (or sessionStorage fallback)
  // and auto-advance to confirm step when the user returns after auth.
  useEffect(() => {
    if (plans.length === 0) return;
    if (hasAutoConfirmedRef.current) return;

    let planId = searchParams.get("planId");
    if (!planId) {
      try { planId = sessionStorage.getItem("pendingPlanId"); } catch { /* ignore */ }
    }
    if (!planId) return;

    const match = plans.find((p) => p.id === planId);
    if (!match) return;

    setSelectedPlan(match);

    if (authStatus === "authenticated") {
      try { sessionStorage.removeItem("pendingPlanId"); } catch { /* ignore */ }
      setStep("confirm");
      hasAutoConfirmedRef.current = true;
    }
  }, [plans, searchParams, authStatus]);

  const handleContinue = () => {
    if (!selectedPlan) return;

    if (authStatus === "unauthenticated") {
      try { sessionStorage.setItem("pendingPlanId", selectedPlan.id); } catch { /* ignore */ }
      const params = new URLSearchParams({
        callbackUrl: `/payment?planId=${selectedPlan.id}`,
        plan: selectedPlan.name,
      });
      router.push(`/signup?${params}`);
      return;
    }
    if (authStatus === "loading") return;
    setStep("confirm");
  };

  const handleStripeCheckout = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/create-membership-checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planId: selectedPlan.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error ?? "Failed to create checkout session. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // ── CTA button label ────────────────────────────────────────────────────────
  let ctaLabel: React.ReactNode = "Select a plan to continue";
  if (authStatus === "loading") {
    ctaLabel = <><Loader2 className="h-4 w-4 animate-spin" /> Checking session…</>;
  } else if (selectedPlan && authStatus === "unauthenticated") {
    ctaLabel = <>Create account &amp; continue <ArrowRight className="h-4 w-4" /></>;
  } else if (selectedPlan) {
    ctaLabel = <>{`Continue with ${selectedPlan.name}`} <ArrowRight className="h-4 w-4" /></>;
  }

  // ── CTA button style ────────────────────────────────────────────────────────
  const ctaActive: React.CSSProperties = {
    background:
      "linear-gradient(135deg, #6e0a19 0%, #b11226 40%, #cc2038 70%, #8a0c1e 100%)",
    boxShadow:
      "0 0 55px rgba(177,18,38,0.42), 0 8px 36px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.10)",
    color: "#f5ede6",
    letterSpacing: "0.012em",
  };
  const ctaDisabled: React.CSSProperties = {
    background: "rgba(255,255,255,0.06)",
    border:     "1px solid rgba(255,255,255,0.09)",
    color:      "rgba(203,191,182,0.38)",
    cursor:     "not-allowed",
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <CinematicBackground />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b"
        style={{ background: "rgba(7,3,5,0.90)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl"
              style={{
                background:  "linear-gradient(135deg, #a1122f, #c6293e)",
                boxShadow:   "0 0 18px rgba(161,18,47,0.40)",
              }}
            >
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold font-display" style={{ color: "#f5ede6" }}>
              Serene Studio
            </span>
          </Link>

          {authStatus === "unauthenticated" && (
            <Link
              href="/login"
              className="text-sm transition-colors"
              style={{ color: "rgba(138,127,120,0.80)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#c6a15b")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(138,127,120,0.80)")}
            >
              Already a member? Sign in
            </Link>
          )}
          {authStatus === "authenticated" && session?.user?.email && (
            <span className="text-sm" style={{ color: "rgba(138,127,120,0.80)" }}>
              {session.user.email}
            </span>
          )}
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Step: Plan Selection ───────────────────────────────────────── */}
        {step === "plan" && (
          <div className="animate-fade-in">

            {/* Hero heading */}
            <section className="text-center pt-16 pb-6 max-w-2xl mx-auto">
              {/* Decorative top line */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div
                  className="flex-1 h-px"
                  style={{
                    background: "linear-gradient(to right, transparent, rgba(177,18,38,0.36))",
                  }}
                />
                <Sparkles
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "rgba(212,175,55,0.55)" }}
                />
                <div
                  className="flex-1 h-px"
                  style={{
                    background: "linear-gradient(to left, transparent, rgba(177,18,38,0.36))",
                  }}
                />
              </div>

              <h1
                className="text-5xl sm:text-6xl font-bold font-display tracking-tight mb-5"
                style={{
                  color:      "#f5ede6",
                  textShadow: "0 0 90px rgba(177,18,38,0.22), 0 2px 24px rgba(0,0,0,0.85)",
                  lineHeight: "1.10",
                }}
              >
                Unlock your private<br />experience
              </h1>

              <p
                className="text-base sm:text-lg leading-relaxed"
                style={{ color: "rgba(203,191,182,0.65)" }}
              >
                Exclusive access, priority booking, and premium control.
              </p>
            </section>

            {/* Plan cards */}
            <section>
              <PlanCardsLayout count={plansLoading ? 3 : plans.length}>

                {/* Skeleton — matches real card min-height */}
                {plansLoading && [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="skeleton rounded-2xl"
                    style={{ height: "460px" }}
                  />
                ))}

                {/* Real cards */}
                {plans.map((plan) => {
                  const VISIBLE_LIMIT = 6;

                  const tier       = getPlanTier(plan.level, maxLevel);
                  const Icon       = getTierIcon(tier);
                  const isSelected = selectedPlan?.id === plan.id;
                  const isPopular  = plan.isPopular;
                  const features: string[] = (() => {
                    try { return JSON.parse(plan.features || "[]"); } catch { return []; }
                  })();
                  const iconStyle   = tierAccentStyles[tier];
                  const hasMore     = features.length > VISIBLE_LIMIT;
                  const hiddenCount = Math.max(0, features.length - VISIBLE_LIMIT);
                  const isOverlayOpen = overlayCard === plan.id;

                  const cardStyle: React.CSSProperties = isSelected
                    ? { ...paymentCardBase[tier], ...paymentCardSelected[tier] }
                    : isPopular
                      ? { ...paymentCardBase[tier], ...paymentCardPopular }
                      : paymentCardBase[tier];

                  return (
                    // Outer wrapper — paddingTop gives the badge space to float above on ALL cards
                    // (even non-popular) so carousel item heights are identical.
                    <div key={plan.id} className="relative" style={{ paddingTop: "14px" }}>

                      {/* Most Popular badge — above the card, never clipped */}
                      {isPopular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{ zIndex: 2 }}>
                          <span
                            className="px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap tracking-wide"
                            style={{
                              background:    "linear-gradient(135deg, #7a0c1c 0%, #c6293e 100%)",
                              color:         "#fce8eb",
                              boxShadow:     "0 2px 14px rgba(177,18,38,0.45), 0 0 0 1px rgba(177,18,38,0.30)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            Most Popular
                          </span>
                        </div>
                      )}

                      {/* Inner card — strict fixed height, overflow hidden so overlay is clipped to card bounds */}
                      <div
                        onClick={() => setSelectedPlan(plan)}
                        className="relative rounded-2xl p-6 cursor-pointer flex flex-col plan-card-glass transition-all duration-300"
                        style={{
                          ...cardStyle,
                          height: "480px",
                          overflow: "hidden",
                          transform: isSelected
                            ? "scale(1.02)"
                            : isPopular
                              ? "translateY(-5px)"
                              : "translateY(0)",
                        }}
                        onMouseEnter={e => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.transform =
                              isPopular ? "translateY(-8px)" : "translateY(-3px)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLElement).style.transform =
                              isPopular ? "translateY(-5px)" : "translateY(0)";
                          }
                        }}
                      >
                        {/* Selected checkmark */}
                        {isSelected && (
                          <div
                            className="absolute top-3.5 right-3.5 h-6 w-6 rounded-full flex items-center justify-center"
                            style={{
                              background: "linear-gradient(135deg, #9a7a1a, #c6a15b)",
                              boxShadow:  "0 2px 10px rgba(198,161,91,0.45)",
                            }}
                          >
                            <Check className="h-3.5 w-3.5" style={{ color: "#1e1210" }} />
                          </div>
                        )}

                        {/* ── Zone 1: Icon (shrink-0) ── */}
                        <div
                          className="shrink-0 p-3 rounded-xl inline-flex mb-4"
                          style={{ ...iconStyle, boxShadow: "0 2px 12px rgba(0,0,0,0.30)" }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* ── Zone 2: Plan name (shrink-0, single line) ── */}
                        <h3
                          className="shrink-0 text-lg font-bold font-display mb-1.5 line-clamp-1"
                          style={{ color: "#f5ede6", letterSpacing: "-0.015em" }}
                        >
                          {plan.name}
                        </h3>

                        {/* ── Zone 3: Description (shrink-0, always 2 lines height) ── */}
                        <p
                          className="shrink-0 text-sm mb-5 leading-relaxed line-clamp-2"
                          style={{ color: "rgba(203,191,182,0.62)", minHeight: "44px" }}
                        >
                          {plan.description}
                        </p>

                        {/* ── Zone 4: Price (shrink-0) ── */}
                        <div className="shrink-0 flex items-baseline gap-1.5 mb-5">
                          <span
                            className="text-4xl font-bold font-display tabular-nums"
                            style={{ color: "#f5ede6", letterSpacing: "-0.025em" }}
                          >
                            {formatCurrency(plan.price)}
                          </span>
                          <span className="text-sm" style={{ color: "rgba(138,127,120,0.80)" }}>
                            /{plan.billingCycle.toLowerCase()}
                          </span>
                        </div>

                        {/* ── Zone 5: Divider (shrink-0) ── */}
                        <div
                          className="shrink-0 h-px mb-4"
                          style={{
                            background: isSelected || isPopular
                              ? "linear-gradient(to right, rgba(177,18,38,0.30), transparent)"
                              : "rgba(255,255,255,0.07)",
                          }}
                        />

                        {/* ── Zone 6: Benefits (shrink-0, fixed 160px, always 6 visible) ── */}
                        <div className="shrink-0" style={{ height: "160px", overflow: "hidden" }}>
                          <ul className="space-y-2">
                            {features.slice(0, VISIBLE_LIMIT).map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2.5 text-sm"
                                style={{ color: "rgba(245,237,230,0.78)" }}
                              >
                                <div
                                  className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                                  style={{ background: "rgba(10,80,45,0.32)" }}
                                >
                                  <Check className="h-2.5 w-2.5" style={{ color: "#4ade80" }} />
                                </div>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* ── Zone 7: Utility row (flex-1, always at bottom) ── */}
                        <div className="flex-1 flex items-end">
                          {hasMore && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setOverlayCard(plan.id);
                              }}
                              className="flex items-center gap-1 text-xs transition-colors duration-150"
                              style={{ color: "rgba(198,161,91,0.65)" }}
                              onMouseEnter={e => {
                                e.stopPropagation();
                                (e.currentTarget as HTMLElement).style.color = "#c6a15b";
                              }}
                              onMouseLeave={e => {
                                e.stopPropagation();
                                (e.currentTarget as HTMLElement).style.color = "rgba(198,161,91,0.65)";
                              }}
                              aria-label={`Show all ${features.length} benefits for ${plan.name}`}
                            >
                              <ChevronDown className="h-3 w-3" />
                              +{hiddenCount} more
                            </button>
                          )}
                        </div>

                        {/* ── Absolute overlay — slides up, fills card, never resizes it ── */}
                        {isOverlayOpen && (
                          <div
                            className="benefit-overlay absolute inset-0 rounded-2xl flex flex-col"
                            style={{
                              background:    "rgba(8,3,5,0.97)",
                              backdropFilter: "blur(24px)",
                              WebkitBackdropFilter: "blur(24px)",
                              zIndex: 10,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            {/* Overlay header */}
                            <div
                              className="shrink-0 flex items-center justify-between px-5 py-4 border-b"
                              style={{ borderColor: "rgba(255,255,255,0.07)" }}
                            >
                              <div>
                                <p
                                  className="text-xs font-semibold tracking-widest uppercase"
                                  style={{ color: "rgba(177,18,38,0.65)", fontSize: "9px", letterSpacing: "0.14em" }}
                                >
                                  All benefits
                                </p>
                                <p
                                  className="text-sm font-bold font-display mt-0.5"
                                  style={{ color: "#f5ede6" }}
                                >
                                  {plan.name}
                                </p>
                              </div>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setOverlayCard(null);
                                }}
                                className="h-8 w-8 rounded-full flex items-center justify-center transition-colors duration-150"
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border:     "1px solid rgba(255,255,255,0.10)",
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(177,18,38,0.22)";
                                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(177,18,38,0.35)";
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)";
                                }}
                                aria-label="Close benefits panel"
                              >
                                <X className="h-3.5 w-3.5" style={{ color: "rgba(245,237,230,0.65)" }} />
                              </button>
                            </div>

                            {/* Scrollable benefits list */}
                            <div className="flex-1 overflow-y-auto px-5 py-4">
                              <ul className="space-y-3">
                                {features.map((f, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-2.5 text-sm"
                                    style={{ color: "rgba(245,237,230,0.82)" }}
                                  >
                                    <div
                                      className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                                      style={{ background: "rgba(10,80,45,0.32)" }}
                                    >
                                      <Check className="h-2.5 w-2.5" style={{ color: "#4ade80" }} />
                                    </div>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* "Select this plan" CTA inside overlay */}
                            <div
                              className="shrink-0 px-5 py-4 border-t"
                              style={{ borderColor: "rgba(255,255,255,0.07)" }}
                            >
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedPlan(plan);
                                  setOverlayCard(null);
                                }}
                                className="w-full h-10 rounded-xl text-sm font-semibold transition-all duration-200"
                                style={{
                                  background: isSelected
                                    ? "rgba(212,175,55,0.12)"
                                    : "linear-gradient(135deg, #6e0a19 0%, #b11226 60%, #8a0c1e 100%)",
                                  color:  isSelected ? "#d4af37" : "#fce8eb",
                                  border: isSelected ? "1px solid rgba(212,175,55,0.30)" : "none",
                                }}
                              >
                                {isSelected ? "Selected ✓" : "Select this plan"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </PlanCardsLayout>
            </section>

            {/* ── CTA ───────────────────────────────────────────────────── */}
            <section className="flex flex-col items-center gap-4 pt-4 pb-20">
              <button
                disabled={!selectedPlan || authStatus === "loading"}
                onClick={handleContinue}
                className="relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 h-14 rounded-2xl text-base font-semibold transition-all duration-300 active:scale-[0.97]"
                style={selectedPlan && authStatus !== "loading" ? ctaActive : ctaDisabled}
                onMouseEnter={e => {
                  if (selectedPlan && authStatus !== "loading") {
                    (e.currentTarget as HTMLElement).style.filter = "brightness(1.18)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={e => {
                  if (selectedPlan && authStatus !== "loading") {
                    (e.currentTarget as HTMLElement).style.filter = "brightness(1)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }
                }}
              >
                {ctaLabel}
              </button>

              {/* Hint / sign-in sub-text */}
              {!selectedPlan && (
                <p
                  className="text-xs text-center"
                  style={{ color: "rgba(138,127,120,0.65)" }}
                >
                  Choose one of the plans above to proceed
                </p>
              )}
              {selectedPlan && authStatus === "unauthenticated" && (
                <p
                  className="text-xs text-center"
                  style={{ color: "rgba(138,127,120,0.65)" }}
                >
                  Already a member?{" "}
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(
                      `/payment?planId=${selectedPlan.id}`
                    )}&plan=${encodeURIComponent(selectedPlan.name)}`}
                    className="underline underline-offset-2 transition-colors"
                    style={{ color: "rgba(198,161,91,0.80)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#c6a15b")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(198,161,91,0.80)")}
                  >
                    Sign in instead
                  </Link>
                </p>
              )}
            </section>

            {/* Divider */}
            <SectionDivider />

            {/* ── How It Works ──────────────────────────────────────────── */}
            <section className="py-16 max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2
                  className="text-2xl font-bold font-display"
                  style={{ color: "#f5ede6" }}
                >
                  How it works
                </h2>
                <p
                  className="text-sm mt-2"
                  style={{ color: "rgba(203,191,182,0.50)" }}
                >
                  Get started in just a few steps
                </p>
              </div>

              <div
                className="rounded-2xl p-6 sm:p-8 plan-card-glass"
                style={{
                  background: "rgba(10, 4, 7, 0.52)",
                  border:     "1px solid rgba(255,255,255,0.07)",
                  boxShadow:  "0 8px 48px rgba(0,0,0,0.42)",
                }}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
                  {/* Connecting line (desktop) */}
                  <div
                    className="hidden md:block absolute"
                    style={{
                      top: "32px",
                      left: "calc(12.5% + 12px)",
                      right: "calc(12.5% + 12px)",
                      height: "1px",
                      background:
                        "linear-gradient(to right, rgba(177,18,38,0.28), rgba(212,175,55,0.20), rgba(177,18,38,0.28))",
                    }}
                  />

                  {HOW_IT_WORKS.map((item, i) => (
                    <div
                      key={i}
                      className="relative flex flex-col items-center text-center gap-2.5"
                    >
                      {/* Step circle */}
                      <div
                        className="relative z-10 h-16 w-16 rounded-full flex flex-col items-center justify-center gap-0.5"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(122,12,28,0.50), rgba(177,18,38,0.28))",
                          border:    "1px solid rgba(177,18,38,0.30)",
                          boxShadow: "0 4px 22px rgba(177,18,38,0.14), 0 0 0 4px rgba(7,3,5,0.80)",
                        }}
                      >
                        <item.icon
                          className="h-5 w-5"
                          style={{ color: "#e8a0a8" }}
                        />
                      </div>

                      <p
                        className="text-xs font-bold tracking-widest uppercase"
                        style={{ color: "rgba(212,175,55,0.55)", fontSize: "9px" }}
                      >
                        Step {item.step}
                      </p>

                      <div>
                        <p
                          className="text-sm font-semibold font-display"
                          style={{ color: "#f5ede6" }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-xs mt-1 leading-relaxed"
                          style={{ color: "rgba(203,191,182,0.50)" }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Divider */}
            <SectionDivider />

            {/* ── Trust bar ─────────────────────────────────────────────── */}
            <section className="py-12 max-w-3xl mx-auto">
              <div
                className="rounded-xl px-6 py-5 plan-card-glass"
                style={{
                  background: "rgba(10, 4, 7, 0.45)",
                  border:     "1px solid rgba(255,255,255,0.06)",
                  boxShadow:  "0 4px 28px rgba(0,0,0,0.35)",
                }}
              >
                <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                  {TRUST_POINTS.map(({ icon: TIcon, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg shrink-0"
                        style={{
                          background: "rgba(177,18,38,0.20)",
                          boxShadow:  "0 1px 8px rgba(177,18,38,0.10)",
                        }}
                      >
                        <TIcon className="h-3.5 w-3.5" style={{ color: "#e8a0a8" }} />
                      </div>
                      <span
                        className="text-xs whitespace-nowrap"
                        style={{ color: "rgba(203,191,182,0.58)" }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Divider */}
            <SectionDivider />

            {/* ── FAQ ───────────────────────────────────────────────────── */}
            <section className="py-14 pb-24 max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2
                  className="text-2xl font-bold font-display"
                  style={{ color: "#f5ede6" }}
                >
                  Frequently asked questions
                </h2>
              </div>

              <div className="space-y-2">
                {FAQ_ITEMS.map((item, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden plan-card-glass"
                      style={{
                        background:   isOpen ? "rgba(20, 6, 10, 0.72)" : "rgba(12, 4, 8, 0.52)",
                        border:       isOpen
                          ? "1px solid rgba(177,18,38,0.28)"
                          : "1px solid rgba(255,255,255,0.07)",
                        transition:   "background 0.2s ease, border-color 0.2s ease",
                        boxShadow:    isOpen ? "0 4px 24px rgba(177,18,38,0.08)" : "none",
                      }}
                    >
                      <button
                        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 transition-all duration-150"
                        style={{ background: "transparent" }}
                        onMouseEnter={e => {
                          if (!isOpen) (e.currentTarget.style.background = "rgba(255,255,255,0.03)");
                        }}
                        onMouseLeave={e => {
                          if (!isOpen) (e.currentTarget.style.background = "transparent");
                        }}
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: isOpen ? "#f5ede6" : "rgba(245,237,230,0.85)" }}
                        >
                          {item.q}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          style={{ color: isOpen ? "#e8a0a8" : "rgba(138,127,120,0.60)" }}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5">
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "rgba(203,191,182,0.62)" }}
                          >
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* ── Step: Confirm ─────────────────────────────────────────────── */}
        {step === "confirm" && selectedPlan && (() => {
          const tier = getPlanTier(selectedPlan.level, maxLevel);
          return (
            <div className="max-w-md mx-auto pt-12 pb-20 space-y-6 animate-fade-in">

              {/* Back */}
              <button
                onClick={() => setStep("plan")}
                className="flex items-center gap-1 text-sm transition-colors"
                style={{ color: "rgba(203,191,182,0.50)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f5ede6")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(203,191,182,0.50)")}
              >
                ← Back to plans
              </button>

              <div>
                <h2
                  className="text-2xl font-bold font-display"
                  style={{ color: "#f5ede6" }}
                >
                  Confirm your order
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(203,191,182,0.55)" }}
                >
                  Review your selection before proceeding to payment.
                </p>
              </div>

              {/* Plan summary card */}
              <div
                className="p-5 rounded-2xl plan-card-glass space-y-3"
                style={{
                  background: "rgba(14, 5, 8, 0.68)",
                  border:     `1px solid ${tier === "gold"
                    ? "rgba(212,175,55,0.28)"
                    : "rgba(177,18,38,0.28)"}`,
                  boxShadow:  "0 8px 40px rgba(0,0,0,0.55)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="font-semibold font-display"
                      style={{ color: "#f5ede6" }}
                    >
                      {selectedPlan.name} Membership
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(138,127,120,0.80)" }}
                    >
                      Recurring subscription
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className="font-bold font-display text-lg tabular-nums"
                      style={{ color: "#f5ede6" }}
                    >
                      {formatCurrency(selectedPlan.price)}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(138,127,120,0.80)" }}
                    >
                      /{selectedPlan.billingCycle.toLowerCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setStep("plan")}
                  className="text-xs underline underline-offset-2 transition-colors"
                  style={{ color: "rgba(198,161,91,0.70)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#c6a15b")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(198,161,91,0.70)")}
                >
                  Change plan
                </button>
              </div>

              {/* Billing account */}
              {session?.user && (
                <div
                  className="p-4 rounded-xl plan-card-glass space-y-1"
                  style={{
                    background: "rgba(10, 4, 7, 0.50)",
                    border:     "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <p
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "rgba(138,127,120,0.55)", fontSize: "9px" }}
                  >
                    Billing account
                  </p>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#f5ede6" }}
                  >
                    {session.user.name || "—"}
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "rgba(203,191,182,0.60)" }}
                  >
                    {session.user.email}
                  </p>
                </div>
              )}

              {/* Error */}
              {checkoutError && (
                <p
                  className="text-sm rounded-xl px-4 py-3"
                  style={{
                    color:      "#f0b8c0",
                    background: "rgba(177,18,38,0.12)",
                    border:     "1px solid rgba(177,18,38,0.28)",
                  }}
                >
                  {checkoutError}
                </p>
              )}

              {/* Checkout button */}
              <button
                disabled={loading}
                onClick={handleStripeCheckout}
                className="relative w-full h-12 rounded-xl inline-flex items-center justify-center gap-2.5 text-sm font-semibold transition-all duration-250 active:scale-[0.98] disabled:cursor-not-allowed"
                style={loading ? {
                  background: "rgba(122,12,28,0.40)",
                  color:      "rgba(245,237,230,0.50)",
                } : {
                  background:
                    "linear-gradient(135deg, #6e0a19 0%, #b11226 45%, #cc2038 100%)",
                  boxShadow:
                    "0 0 50px rgba(177,18,38,0.38), 0 6px 28px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.09)",
                  color:         "#f5ede6",
                  letterSpacing: "0.012em",
                }}
                onMouseEnter={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLElement).style.filter = "brightness(1.15)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={e => {
                  if (!loading) {
                    (e.currentTarget as HTMLElement).style.filter = "brightness(1)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  }
                }}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to Stripe…</>
                ) : (
                  <><Lock className="h-4 w-4" /> Proceed to Secure Payment <ArrowRight className="h-4 w-4" /></>
                )}
              </button>

              {/* SSL notice */}
              <div
                className="flex items-center justify-center gap-2 text-xs"
                style={{ color: "rgba(138,127,120,0.55)" }}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Secure checkout powered by Stripe · SSL encrypted</span>
              </div>

            </div>
          );
        })()}

      </main>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "#070305" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "rgba(177,18,38,0.60)" }} />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
