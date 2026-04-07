"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Sparkles, ArrowRight, Calendar, Video, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import Image from "next/image";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const features = [
  { label: "Booking Management", icon: Calendar },
  { label: "Member Content", icon: Video },
  { label: "Client CRM", icon: Users },
  { label: "Analytics", icon: BarChart3 },
];

// ─── Inner form — uses useSearchParams, must be inside Suspense ───────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@serene.studio", password: "admin123" },
  });

  const emailReg = register("email");
  const passwordReg = register("password");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back to Serene Studio");
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const signupUrl = `/signup${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  const inputStyle = (field: string, hasError: boolean) => ({
    width: "100%",
    height: "46px",
    padding: field === "password" ? "0 46px 0 14px" : "0 14px",
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
    <div className="w-full space-y-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 lg:hidden mb-2">
        <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #a1122f, #c6293e)", boxShadow: "0 0 18px rgba(161,18,47,0.40)" }}>
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-semibold font-display" style={{ color: "#f5ede6" }}>
          Serene Studio
        </span>
      </div>

      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-[22px] font-bold font-display tracking-tight" style={{ color: "#f5ede6" }}>
          Welcome back
        </h2>
        <p className="text-sm" style={{ color: "#7a7068" }}>
          Sign in to your studio dashboard
        </p>
        <div style={{ height: "1px", marginTop: "10px", background: "linear-gradient(to right, rgba(198,161,91,0.22), rgba(255,255,255,0.04) 60%, transparent)" }} />
      </div>

      {/* Demo credentials hint */}
      <div
        className="px-4 py-3 rounded-xl flex items-center gap-2.5"
        style={{ background: "rgba(198,161,91,0.055)", border: "1px solid rgba(198,161,91,0.13)" }}
      >
        <div className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#c6a15b" }} />
        <p className="text-xs" style={{ color: "#8a7f78" }}>
          <span className="font-semibold" style={{ color: "#cbbfb6" }}>Demo:</span>{" "}
          admin@serene.studio / admin123
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label
            htmlFor="email"
            style={{ color: "#9a9088", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}
          >
            Email address
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
          {errors.email && (
            <p className="text-xs" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              style={{ color: "#9a9088", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}
            >
              Password
            </Label>
            <button
              type="button"
              className="text-xs transition-colors duration-150"
              style={{ color: "#5e5650" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#c6a15b")}
              onMouseLeave={e => (e.currentTarget.style.color = "#5e5650")}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              {...passwordReg}
              onFocus={() => setFocusedField("password")}
              onBlur={(e) => { passwordReg.onBlur(e); setFocusedField(null); }}
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
          {errors.password && (
            <p className="text-xs" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.password.message}</p>
          )}
        </div>

        {/* CTA */}
        <div className="pt-1.5">
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
              <>Sign in <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
      </form>

      <p className="text-center text-xs pt-1" style={{ color: "#5e5650" }}>
        New client?{" "}
        <a
          href={signupUrl}
          className="font-semibold transition-colors duration-150"
          style={{ color: "#c6a15b" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#e4c478")}
          onMouseLeave={e => (e.currentTarget.style.color = "#c6a15b")}
        >
          Create an account
        </a>
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: "#070507" }}>

      {/* ── Background system ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Silhouette photo — extended inset absorbs blur edge artifact */}
        <div style={{ position: "absolute", inset: "-3%", filter: "blur(1.2px)" }}>
          <Image
            src="/uploads/pexels-beyond-this-65211058-8393716.jpg"
            alt=""
            fill
            priority
            style={{
              objectFit: "cover",
              objectPosition: "58% center",
              opacity: 0.58,
            }}
          />
        </div>

        {/* ① Left-to-right darkness — keeps text panel readable */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(100deg, rgba(7,5,7,0.97) 0%, rgba(7,5,7,0.93) 18%, rgba(7,5,7,0.82) 34%, rgba(7,5,7,0.58) 50%, rgba(7,5,7,0.28) 68%, rgba(7,5,7,0.12) 84%, rgba(7,5,7,0.06) 100%)",
        }} />

        {/* ② Bottom vignette — grounds the image */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(7,5,7,0.90) 0%, rgba(7,5,7,0.45) 18%, transparent 38%)",
        }} />

        {/* ③ Top vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(7,5,7,0.60) 0%, transparent 22%)",
        }} />

        {/* ④ Crimson depth haze — blends image red with brand palette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 55% 75% at 72% 48%, rgba(70,8,16,0.40) 0%, rgba(50,5,10,0.18) 50%, transparent 75%)",
        }} />

        {/* ⑤ Gold warmth near login card */}
        <div style={{
          position: "absolute", top: "25%", right: "4%",
          width: "340px", height: "340px",
          background: "radial-gradient(circle, rgba(198,161,91,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        {/* ⑥ Grain texture */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.028,
          mixBlendMode: "overlay",
        }} />
      </div>

      {/* Vertical separator */}
      <div className="hidden lg:block absolute" style={{
        left: "56%",
        top: "8%",
        bottom: "8%",
        width: "1px",
        background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.055) 25%, rgba(198,161,91,0.12) 50%, rgba(255,255,255,0.055) 75%, transparent)",
      }} />

      {/* ── Left — Branding Panel ── */}
      <div className="hidden lg:flex lg:w-[56%] relative flex-col justify-between p-14 xl:p-16">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-xl transition-all duration-200"
            style={{ background: "linear-gradient(135deg, #a1122f, #c6293e)", boxShadow: "0 0 22px rgba(161,18,47,0.38)" }}
          >
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-semibold font-display tracking-tight" style={{ color: "#f5ede6" }}>
              Serene Studio
            </span>
            <div style={{ height: "1.5px", marginTop: "3px", background: "linear-gradient(to right, rgba(198,161,91,0.42), transparent)" }} />
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-8">
          <div className="space-y-6">
            {/* Eyebrow */}
            <div className="flex items-center gap-3">
              <div style={{ width: "22px", height: "1.5px", background: "linear-gradient(to right, #c6a15b, rgba(198,161,91,0.25))" }} />
              <span style={{ fontSize: "11px", letterSpacing: "0.13em", textTransform: "uppercase", color: "rgba(198,161,91,0.65)", fontWeight: 600 }}>
                Premium Studio Platform
              </span>
            </div>

            <h1
              className="font-display font-bold leading-[1.06] tracking-[-0.03em]"
              style={{ fontSize: "clamp(3rem, 4.8vw, 4.5rem)", color: "#f5ede6" }}
            >
              Where luxury
              <br />
              <span style={{
                background: "linear-gradient(130deg, #c6a15b 0%, #f0d98a 48%, #c6a15b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                meets control.
              </span>
            </h1>

            <p className="text-[15px] leading-[1.80] max-w-[360px]" style={{ color: "rgba(203,191,182,0.66)" }}>
              The all-in-one platform for premium wellness studios. Turn your expertise into a high-value brand.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {features.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium tracking-wide cursor-default transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.045)",
                  color: "rgba(245,237,230,0.60)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(198,161,91,0.08)";
                  el.style.borderColor = "rgba(198,161,91,0.22)";
                  el.style.color = "rgba(245,237,230,0.90)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(255,255,255,0.045)";
                  el.style.borderColor = "rgba(255,255,255,0.08)";
                  el.style.color = "rgba(245,237,230,0.60)";
                }}
              >
                <Icon className="h-3 w-3 flex-shrink-0" style={{ color: "#c6a15b" }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div
          className="relative p-6 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.028)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Left accent */}
          <div
            className="absolute left-0 top-5 bottom-5 rounded-full"
            style={{ width: "2px", background: "linear-gradient(to bottom, rgba(198,161,91,0.65), rgba(198,161,91,0.18))" }}
          />

          {/* Decorative quote mark */}
          <div
            className="absolute top-2 right-5 font-display select-none"
            style={{ fontSize: "80px", lineHeight: 1, color: "rgba(198,161,91,0.07)", fontWeight: 800 }}
          >
            &ldquo;
          </div>

          <div className="pl-5 relative">
            {/* Stars */}
            <div className="flex gap-0.5 mb-3.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} viewBox="0 0 12 12" className="h-3 w-3" fill="#c6a15b">
                  <polygon points="6,0.5 7.9,4.2 12,4.9 9,7.9 9.6,12 6,10.2 2.4,12 3,7.9 0,4.9 4.1,4.2" />
                </svg>
              ))}
            </div>

            <p className="text-sm leading-[1.85]" style={{ color: "rgba(203,191,182,0.73)", fontStyle: "italic" }}>
              &ldquo;Serene Studio transformed how I manage my practice. The platform feels as
              luxurious as the experiences I create for my clients.&rdquo;
            </p>

            <div className="flex items-center gap-3 mt-4">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #a1122f, #c6a15b)",
                  color: "#f5ede6",
                  boxShadow: "0 0 14px rgba(161,18,47,0.28)",
                  letterSpacing: "0.05em",
                }}
              >
                MR
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#e4dbd4" }}>Marie Rousseau</p>
                <p className="mt-0.5" style={{ fontSize: "10px", color: "#5e5650" }}>Owner, Atelier Wellness Paris</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right — Login Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div
          className="w-full max-w-[400px] rounded-2xl p-8 sm:p-10"
          style={{
            background: "rgba(9,5,7,0.90)",
            backdropFilter: "blur(44px)",
            WebkitBackdropFilter: "blur(44px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.72), 0 0 0 1px rgba(161,18,47,0.07), 0 0 70px rgba(161,18,47,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

    </div>
  );
}
