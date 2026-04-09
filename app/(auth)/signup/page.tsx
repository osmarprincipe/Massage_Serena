"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  // Plan name hint passed from the payment → login → signup chain.
  const pendingPlan = searchParams.get("plan") || null;
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const nameReg     = register("name");
  const emailReg    = register("email");
  const passReg     = register("password");
  const confirmReg  = register("confirmPassword");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to create account");
        return;
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Account created but sign-in failed. Please log in manually.");
        router.push("/login");
        return;
      }

      toast.success("Account created! Redirecting…");
      router.push(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginParams = new URLSearchParams();
  if (callbackUrl !== "/") loginParams.set("callbackUrl", callbackUrl);
  if (pendingPlan) loginParams.set("plan", pendingPlan);
  const loginQuery = loginParams.toString();
  const loginUrl = `/login${loginQuery ? `?${loginQuery}` : ""}`;

  const inputStyle = (field: string, hasError: boolean) => ({
    width: "100%",
    height: "44px",
    padding: (field === "password" || field === "confirmPassword") ? "0 46px 0 14px" : "0 14px",
    borderRadius: "12px",
    background: focusedField === field ? "rgba(255,255,255,0.065)" : "rgba(255,255,255,0.04)",
    border: hasError
      ? "1px solid rgba(220,38,38,0.55)"
      : focusedField === field
      ? "1px solid rgba(161,18,47,0.50)"
      : "1px solid rgba(255,255,255,0.09)",
    color: "#f5ede6",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.18s ease",
    boxShadow: focusedField === field
      ? "0 0 0 3px rgba(161,18,47,0.09), 0 1px 6px rgba(0,0,0,0.35)"
      : "0 1px 4px rgba(0,0,0,0.22)",
  } as React.CSSProperties);

  return (
    <div className="w-full space-y-5">
      {/* Purchase context banner — shown when arriving via the payment flow */}
      {pendingPlan && (
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
          style={{
            background: "rgba(122,12,28,0.16)",
            border: "1px solid rgba(177,18,38,0.22)",
          }}
        >
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#c6a15b" }} />
          <p className="text-[12px] leading-snug" style={{ color: "rgba(203,191,182,0.70)" }}>
            Create an account to continue with the{" "}
            <span className="font-semibold" style={{ color: "#c6a15b" }}>{pendingPlan}</span>
            {" "}membership
          </p>
        </div>
      )}

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #a1122f, #c6293e)", boxShadow: "0 0 18px rgba(161,18,47,0.40)" }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold font-display" style={{ color: "#f5ede6" }}>
          Serene Studio
        </span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h2
          className="text-[22px] font-bold font-display tracking-tight"
          style={{ color: "#f5ede6", letterSpacing: "-0.020em" }}
        >
          Create your account
        </h2>
        <p className="text-sm" style={{ color: "#7a7068" }}>
          Set up your member account in seconds
        </p>
        <div style={{ height: "1px", marginTop: "10px", background: "linear-gradient(to right, rgba(198,161,91,0.20), rgba(255,255,255,0.04) 60%, transparent)" }} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" style={{ color: "#9a9088", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
            Full Name
          </Label>
          <input
            id="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            {...nameReg}
            onFocus={() => setFocusedField("name")}
            onBlur={(e) => { nameReg.onBlur(e); setFocusedField(null); }}
            style={inputStyle("name", !!errors.name)}
          />
          {errors.name && <p className="text-xs" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" style={{ color: "#9a9088", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
            Email Address
          </Label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...emailReg}
            onFocus={() => setFocusedField("email")}
            onBlur={(e) => { emailReg.onBlur(e); setFocusedField(null); }}
            style={inputStyle("email", !!errors.email)}
          />
          {errors.email && <p className="text-xs" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" style={{ color: "#9a9088", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
            Password
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              {...passReg}
              onFocus={() => setFocusedField("password")}
              onBlur={(e) => { passReg.onBlur(e); setFocusedField(null); }}
              style={inputStyle("password", !!errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
              style={{ color: "#5e5650" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#cbbfb6")}
              onMouseLeave={e => (e.currentTarget.style.color = "#5e5650")}
            >
              {showPassword ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
            </button>
          </div>
          {errors.password && <p className="text-xs" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" style={{ color: "#9a9088", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
            Confirm Password
          </Label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              autoComplete="new-password"
              {...confirmReg}
              onFocus={() => setFocusedField("confirmPassword")}
              onBlur={(e) => { confirmReg.onBlur(e); setFocusedField(null); }}
              style={inputStyle("confirmPassword", !!errors.confirmPassword)}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
              style={{ color: "#5e5650" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#cbbfb6")}
              onMouseLeave={e => (e.currentTarget.style.color = "#5e5650")}
            >
              {showConfirm ? <EyeOff className="h-[15px] w-[15px]" /> : <Eye className="h-[15px] w-[15px]" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* CTA */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.985] disabled:opacity-55 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(160deg, #b3173a 0%, #8c1022 55%, #640a1a 100%)",
              color: "#f5ede6",
              letterSpacing: "0.015em",
              boxShadow: "0 4px 22px rgba(161,18,47,0.32), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.18)",
            }}
            onMouseEnter={e => {
              if (!loading) {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-1px)";
                el.style.boxShadow = "0 8px 30px rgba(161,18,47,0.45), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.18)";
                el.style.background = "linear-gradient(160deg, #c61d40 0%, #9e122a 55%, #74101e 100%)";
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "";
              el.style.boxShadow = "0 4px 22px rgba(161,18,47,0.32), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.18)";
              el.style.background = "linear-gradient(160deg, #b3173a 0%, #8c1022 55%, #640a1a 100%)";
            }}
          >
            {loading ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </form>

      <p className="text-center text-xs pt-1" style={{ color: "#5e5650" }}>
        Already have an account?{" "}
        <a
          href={loginUrl}
          className="font-semibold transition-colors duration-150"
          style={{ color: "#c6a15b" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#e4c478")}
          onMouseLeave={e => (e.currentTarget.style.color = "#c6a15b")}
        >
          Sign in
        </a>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-10 relative overflow-hidden" style={{ background: "#070507" }}>

      {/* Background image — same as login, faded further */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", inset: "-3%", filter: "blur(1.5px)" }}>
          <Image
            src="/uploads/pexels-beyond-this-65211058-8393716.jpg"
            alt=""
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "60% center", opacity: 0.28 }}
          />
        </div>
        {/* Strong overlay — this is a form-focused page */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(7,5,7,0.82)" }} />
        {/* Ambient glows */}
        <div style={{ position: "absolute", top: "-15%", right: "-8%", width: "560px", height: "560px", background: "radial-gradient(circle, rgba(161,18,47,0.14) 0%, transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-15%", left: "-5%", width: "480px", height: "480px", background: "radial-gradient(circle, rgba(161,18,47,0.08) 0%, transparent 65%)", borderRadius: "50%" }} />
        {/* Grain */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.022, mixBlendMode: "overlay",
        }} />
      </div>

      {/* Card */}
      <div
        className="w-full max-w-[420px] rounded-2xl p-8 sm:p-10 animate-fade-in relative z-10"
        style={{
          background: "rgba(9,5,7,0.90)",
          backdropFilter: "blur(44px)",
          WebkitBackdropFilter: "blur(44px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 40px 100px rgba(0,0,0,0.72), 0 0 0 1px rgba(161,18,47,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <Suspense>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
