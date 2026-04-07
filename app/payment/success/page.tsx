"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Check, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Status = "loading" | "success" | "error";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<Status>(sessionId ? "loading" : "success");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!sessionId) return;

    fetch("/api/stripe/fulfill-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Could not activate your membership.");
          setStatus("error");
        } else {
          setStatus("success");
        }
      })
      .catch(() => {
        setErrorMsg("Network error — please contact support.");
        setStatus("error");
      });
  }, [sessionId]);

  return (
    <div className="min-h-screen" style={{ background: "#0f0b0a" }}>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(122,12,28,0.18) 0%, transparent 70%)" }} />
      </div>

      <header className="border-b sticky top-0 z-10"
        style={{ background: "rgba(15,11,10,0.90)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 w-fit">
            <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #7a0c1c, #b11226)" }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold font-display" style={{ color: "#f5ede6" }}>Serene Studio</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="max-w-md mx-auto text-center space-y-6">

          {status === "loading" && (
            <>
              <div className="flex justify-center">
                <div className="p-6 rounded-full" style={{ background: "rgba(122,12,28,0.15)", border: "1px solid rgba(177,18,38,0.25)" }}>
                  <Loader2 className="h-12 w-12 animate-spin" style={{ color: "#b11226" }} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display mb-2" style={{ color: "#f5ede6" }}>
                  Activating your membership…
                </h2>
                <p style={{ color: "#8a7f78" }}>Just a moment while we set everything up.</p>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <div className="p-6 rounded-full" style={{ background: "rgba(200,50,50,0.12)", border: "1px solid rgba(200,50,50,0.25)" }}>
                  <AlertCircle className="h-12 w-12" style={{ color: "#e06060" }} />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display mb-2" style={{ color: "#f5ede6" }}>
                  Something went wrong
                </h2>
                <p style={{ color: "#8a7f78" }}>{errorMsg}</p>
                <p className="text-sm mt-2" style={{ color: "#6b5040" }}>
                  Your payment was received. Please contact support and we&apos;ll sort it out immediately.
                </p>
              </div>
              <Link href="/app/dashboard">
                <Button size="lg" className="w-full h-12">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center">
                <div className="p-6 rounded-full" style={{ background: "rgba(10,80,45,0.18)", border: "1px solid rgba(74,222,128,0.25)" }}>
                  <Check className="h-12 w-12" style={{ color: "#4ade80" }} />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold font-display mb-2" style={{ color: "#f5ede6" }}>
                  Payment Complete!
                </h2>
                <p style={{ color: "#8a7f78" }} className="leading-relaxed">
                  Your membership is now active. Head to your dashboard to start enjoying your member benefits.
                </p>
              </div>

              <div className="p-5 rounded-2xl text-left space-y-3"
                style={{ background: "rgba(24,19,18,0.80)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm font-semibold" style={{ color: "#f5ede6" }}>What&apos;s next?</p>
                {[
                  "Your membership is active immediately",
                  "Access all premium member content",
                  "Priority booking is now available",
                  "Check your email for a payment receipt",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm" style={{ color: "#8a7f78" }}>
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(10,80,45,0.30)" }}>
                      <Check className="h-3 w-3" style={{ color: "#4ade80" }} />
                    </div>
                    {item}
                  </div>
                ))}
              </div>

              <Link href="/app/dashboard">
                <Button size="lg" className="w-full h-12">
                  Go to My Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </>
          )}

        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}
