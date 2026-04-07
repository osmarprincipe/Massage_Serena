"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const steps = ["Verify", "Profile", "Password", "Done"];

export default function CompleteRegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Invalid registration link");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...data }),
      });

      if (res.ok) {
        setStep(3);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        const err = await res.json();
        toast.error(err.error || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "#070507" }}>
      {/* Ambient glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div style={{ position: "absolute", top: "-15%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(161,18,47,0.15) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-8%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(161,18,47,0.08) 0%, transparent 65%)", borderRadius: "50%" }} />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl" style={{ background: "linear-gradient(135deg, #a1122f, #c6293e)", boxShadow: "0 0 22px rgba(161,18,47,0.42)" }}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold font-display" style={{ color: "#f5ede6" }}>Serene Studio</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 animate-fade-in"
          style={{
            background: "rgba(9,5,7,0.90)",
            backdropFilter: "blur(44px)",
            WebkitBackdropFilter: "blur(44px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.72), 0 0 0 1px rgba(161,18,47,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}>
          {step < 3 ? (
            <>
              {/* Header */}
              <div className="text-center mb-7">
                <h2 className="text-[22px] font-bold font-display mb-1.5" style={{ color: "#f5ede6", letterSpacing: "-0.020em" }}>
                  Complete your account
                </h2>
                <p className="text-sm" style={{ color: "#7a7068" }}>
                  Set up your profile to access your membership.
                </p>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 mb-7">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-500"
                    style={{
                      background: i < step
                        ? "linear-gradient(90deg, #a1122f, #c6293e)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label style={{ color: "#cbbfb6", fontSize: "12px", letterSpacing: "0.03em", textTransform: "uppercase", fontWeight: 600 }}>Full Name</Label>
                  <Input placeholder="Your full name" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: "#cbbfb6", fontSize: "12px", letterSpacing: "0.03em", textTransform: "uppercase", fontWeight: 600 }}>
                    Phone <span style={{ color: "#8a7f78", fontWeight: 400 }}>(optional)</span>
                  </Label>
                  <Input placeholder="+1 (555) 000-0000" {...register("phone")} />
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: "#cbbfb6", fontSize: "12px", letterSpacing: "0.03em", textTransform: "uppercase", fontWeight: 600 }}>Password</Label>
                  <Input type="password" placeholder="Create a strong password" {...register("password")} />
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label style={{ color: "#cbbfb6", fontSize: "12px", letterSpacing: "0.03em", textTransform: "uppercase", fontWeight: 600 }}>Confirm Password</Label>
                  <Input type="password" placeholder="Repeat your password" {...register("confirmPassword")} />
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{
                    background: "linear-gradient(160deg, #a1122f 0%, #7a0c1c 60%, #560818 100%)",
                    color: "#f5ede6",
                    boxShadow: "0 4px 20px rgba(161,18,47,0.40), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLElement).style.filter = "brightness(1.18)"; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ""; }}
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>Create Account <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-6 space-y-5">
              <div className="flex items-center justify-center">
                <div className="p-5 rounded-full" style={{ background: "rgba(10,80,45,0.30)", border: "1px solid rgba(74,222,128,0.20)" }}>
                  <CheckCircle className="h-10 w-10" style={{ color: "#4ade80" }} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display mb-2" style={{ color: "#f5ede6" }}>
                  Account created!
                </h3>
                <p className="text-sm" style={{ color: "#8a7f78" }}>
                  Your membership is now active. Redirecting to login...
                </p>
              </div>
              <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full animate-[progress_2s_ease-in-out]" style={{ width: "100%", background: "linear-gradient(90deg, #a1122f, #c6a15b)" }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: "#8a7f78" }}>
          Already have an account?{" "}
          <a href="/login" className="font-medium transition-colors hover:underline" style={{ color: "#c6a15b" }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
