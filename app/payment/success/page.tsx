"use client";

import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-gold-100/40 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-mocha-100/30 blur-3xl" />
      </div>

      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="p-2 rounded-xl bg-gradient-to-br from-mocha-500 to-gold-500 shadow-soft">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold font-display text-foreground">Serene Studio</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="max-w-md mx-auto text-center space-y-6">

          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-emerald-50 border border-emerald-100">
              <Check className="h-12 w-12 text-emerald-500" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">
              Payment Complete!
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your membership is now active. Head to your dashboard to start enjoying your member benefits.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-muted/40 border border-border text-left space-y-3">
            <p className="text-sm font-semibold text-foreground">What&apos;s next?</p>
            {[
              "Your membership is active immediately",
              "Access all premium member content",
              "Priority booking is now available",
              "Check your email for a payment receipt",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-emerald-600" />
                </div>
                {item}
              </div>
            ))}
          </div>

          <Link href="/app">
            <Button size="lg" className="w-full h-12">
              Go to My Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

        </div>
      </main>
    </div>
  );
}
