"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Sparkles, Check, ArrowRight, Shield, Crown, Star,
  Lock, ChevronDown, BadgeCheck, Zap, Mail, UserCheck,
  CreditCard, CalendarCheck, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

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

const planGradients = {
  Normal: "from-stone-100 to-stone-50 border-stone-200",
  VIP: "from-mocha-50 to-sand-100 border-mocha-200",
  Premium: "from-gold-50 via-sand-50 to-white border-gold-300",
};

const planSelectedRings = {
  Normal: "ring-stone-400",
  VIP: "ring-mocha-500",
  Premium: "ring-gold-500",
};

const planCheckColors = {
  Normal: "bg-stone-500",
  VIP: "bg-mocha-600",
  Premium: "bg-gold-500",
};

const planIcons = { Normal: Star, VIP: Crown, Premium: Sparkles };

const HOW_IT_WORKS = [
  { icon: Star, step: "1", title: "Choose a plan", desc: "Select the membership that best fits your wellness goals." },
  { icon: UserCheck, step: "2", title: "Sign in or create account", desc: "Log in or create a free account to continue." },
  { icon: CreditCard, step: "3", title: "Complete payment", desc: "Secure checkout — your membership is confirmed instantly." },
  { icon: CalendarCheck, step: "4", title: "Access your membership", desc: "Your member area is unlocked immediately after payment." },
];

const TRUST_POINTS = [
  { icon: Shield, label: "SSL Secured" },
  { icon: BadgeCheck, label: "Premium Access Included" },
  { icon: Mail, label: "Confirmation Email Sent" },
  { icon: Zap, label: "Instant Membership Activation" },
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

// ─── Inner page content — uses useSearchParams, must be inside Suspense ──────

function PaymentContent() {
  const { data: session, status: authStatus } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<FlowStep>("plan");
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Load plans
  useEffect(() => {
    fetch("/api/public/plans")
      .then((r) => r.ok ? r.json() : Promise.reject(r.status))
      .then((d) => setPlans(Array.isArray(d.data) ? d.data : []))
      .catch((err) => { console.error("[payment] failed to load plans:", err); setPlans([]); })
      .finally(() => setPlansLoading(false));
  }, []);

  // Auto-select plan from URL ?planId=
  useEffect(() => {
    if (plans.length === 0) return;
    const planId = searchParams.get("planId");
    if (!planId) return;
    const match = plans.find((p) => p.id === planId);
    if (match) {
      setSelectedPlan(match);
      // If user is already logged in and arrived via the auth redirect, go straight to confirm
      if (authStatus === "authenticated") {
        setStep("confirm");
      }
    }
  }, [plans, searchParams, authStatus]);

  const handleContinue = () => {
    if (!selectedPlan) return;

    if (authStatus === "unauthenticated") {
      // Redirect to login, preserving the selected plan
      const callbackUrl = `/payment?planId=${selectedPlan.id}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    if (authStatus === "loading") return;

    // Authenticated — show confirmation step
    setStep("confirm");
  };

  const handleStripeCheckout = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/create-membership-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id }),
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

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gold-100/40 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-mocha-100/30 blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-mocha-500 to-gold-500 shadow-soft">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold font-display text-foreground">Serene Studio</span>
          </Link>
          {authStatus === "unauthenticated" && (
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Already a member? Sign in
            </Link>
          )}
          {authStatus === "authenticated" && session?.user?.email && (
            <span className="text-sm text-muted-foreground">{session.user.email}</span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* ── Step: Plan Selection ─────────────────────────────────────────── */}
        {step === "plan" && (
          <div className="space-y-10 animate-fade-in">

            <div className="text-center space-y-3 max-w-xl mx-auto">
              <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">
                Choose your membership
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                Select the plan that fits your wellness journey. Every membership gives you
                access to premium content, priority booking, and exclusive member benefits.
              </p>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plansLoading && [0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-muted/30 h-72 animate-pulse" />
              ))}
              {plans.map((plan) => {
                const Icon = planIcons[plan.name as keyof typeof planIcons] || Star;
                const isSelected = selectedPlan?.id === plan.id;
                const features: string[] = (() => { try { return JSON.parse(plan.features || "[]"); } catch { return []; } })();
                const ring = planSelectedRings[plan.name as keyof typeof planSelectedRings] || "ring-primary";
                const checkBg = planCheckColors[plan.name as keyof typeof planCheckColors] || "bg-primary";

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative rounded-2xl border-2 bg-gradient-to-br p-6 cursor-pointer transition-all duration-300 ${
                      planGradients[plan.name as keyof typeof planGradients] || "from-card to-muted border-border"
                    } ${
                      isSelected
                        ? `ring-2 ${ring} ring-offset-2 scale-[1.02]`
                        : "hover:scale-[1.01] hover:shadow-card"
                    }`}
                    style={{ boxShadow: isSelected ? "var(--shadow-card-hover)" : undefined }}
                  >
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gold-400 to-gold-600 text-white shadow-sm whitespace-nowrap">
                          Best Value
                        </span>
                      </div>
                    )}

                    {isSelected && (
                      <div className={`absolute top-3 right-3 h-6 w-6 rounded-full ${checkBg} flex items-center justify-center shadow-soft`}>
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                    )}

                    <div className={`p-3 rounded-xl inline-flex mb-4 ${
                      plan.level === 3 ? "bg-gold-100" : plan.level === 2 ? "bg-mocha-100" : "bg-stone-100"
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        plan.level === 3 ? "text-gold-600" : plan.level === 2 ? "text-mocha-600" : "text-stone-600"
                      }`} />
                    </div>

                    <h3 className="text-lg font-bold font-display text-foreground mb-1">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{plan.description}</p>

                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-bold font-display text-foreground">
                        {formatCurrency(plan.price)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{plan.billingCycle.toLowerCase()}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="h-2.5 w-2.5 text-emerald-600" />
                          </div>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                disabled={!selectedPlan || authStatus === "loading"}
                onClick={handleContinue}
                className="px-10 h-12 text-base"
              >
                {authStatus === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Checking session…</>
                ) : !selectedPlan ? (
                  "Select a plan to continue"
                ) : authStatus === "unauthenticated" ? (
                  <><Lock className="h-4 w-4" /> Sign in to continue</>
                ) : (
                  <>{`Continue with ${selectedPlan.name}`}<ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
              {!selectedPlan && (
                <p className="text-xs text-muted-foreground">Choose one of the plans above to proceed</p>
              )}
              {selectedPlan && authStatus === "unauthenticated" && (
                <p className="text-xs text-muted-foreground">
                  You&apos;ll be asked to sign in or create a free account first
                </p>
              )}
            </div>

            {/* ── How it Works ── */}
            <section className="max-w-3xl mx-auto space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold font-display text-foreground">How it works</h2>
                <p className="text-sm text-muted-foreground mt-1">Get started in just a few steps</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {HOW_IT_WORKS.map((item, i) => (
                  <div key={i} className="relative flex flex-col items-center text-center gap-3 p-4">
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="hidden md:block absolute top-7 left-[calc(50%+20px)] right-0 h-px bg-border" />
                    )}
                    <div className="relative z-10 h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center shadow-soft">
                      <span className="text-sm font-bold font-display text-primary">{item.step}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Trust row ── */}
            <section className="max-w-3xl mx-auto">
              <div className="rounded-2xl border border-border bg-card/60 px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {TRUST_POINTS.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-primary/8 text-primary shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs text-muted-foreground leading-snug">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── FAQ ── */}
            <section className="max-w-2xl mx-auto space-y-4 pb-4">
              <div className="text-center">
                <h2 className="text-xl font-semibold font-display text-foreground">Frequently asked questions</h2>
              </div>
              <div className="space-y-2">
                {FAQ_ITEMS.map((item, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-5 py-4 text-left gap-4 hover:bg-muted/30 transition-colors"
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                      >
                        <span className="text-sm font-medium text-foreground">{item.q}</span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* ── Step: Confirm (logged-in users only) ─────────────────────────── */}
        {step === "confirm" && selectedPlan && (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in">
            <button
              onClick={() => setStep("plan")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to plans
            </button>

            <div>
              <h2 className="text-2xl font-bold font-display text-foreground">Confirm your order</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Review your selection before proceeding to payment.
              </p>
            </div>

            {/* Plan summary */}
            <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{selectedPlan.name} Membership</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Recurring subscription</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{formatCurrency(selectedPlan.price)}</p>
                  <p className="text-xs text-muted-foreground">/{selectedPlan.billingCycle.toLowerCase()}</p>
                </div>
              </div>
              <button onClick={() => setStep("plan")} className="text-xs text-primary hover:underline">
                Change plan
              </button>
            </div>

            {/* Account info */}
            {session?.user && (
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Billing account</p>
                <p className="text-sm font-medium text-foreground">{session.user.name || "—"}</p>
                <p className="text-sm text-muted-foreground">{session.user.email}</p>
              </div>
            )}

            {checkoutError && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
                {checkoutError}
              </p>
            )}

            <Button
              className="w-full h-11"
              disabled={loading}
              onClick={handleStripeCheckout}
              loading={loading}
            >
              <Lock className="h-4 w-4" />
              {loading ? "Redirecting to Stripe…" : "Proceed to Payment"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              <span>Secure checkout powered by Stripe · SSL encrypted</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
