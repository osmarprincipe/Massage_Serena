"use client";

import { useState, Suspense, useRef, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

// ─── Login Form ────────────────────────────────────────────────────────────────

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

  const inputStyle = (field: string, hasError: boolean): React.CSSProperties => ({
    width: "100%",
    height: "58px",
    padding: field === "password" ? "0 56px 0 20px" : "0 20px",
    borderRadius: "16px",
    background: focusedField === field ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.38)",
    border: hasError
      ? "1px solid rgba(200,50,50,0.45)"
      : focusedField === field
        ? "1px solid rgba(170,55,40,0.42)"
        : "1px solid rgba(255,255,255,0.06)",
    color: "#f0e6e0",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.22s ease",
    boxShadow: focusedField === field
      ? "0 0 0 3px rgba(140,20,30,0.10), inset 0 1px 0 rgba(255,255,255,0.03)"
      : "inset 0 1px 0 rgba(255,255,255,0.02)",
    letterSpacing: "0.01em",
  });

  return (
    <div className="w-full">

      {/* Mobile logo */}
      <div className="flex items-center gap-3 lg:hidden mb-8">
        <div
          className="rounded-full flex items-center justify-center shrink-0"
          style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #a1122f, #c6293e)", boxShadow: "0 0 18px rgba(161,18,47,0.50)" }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className="text-[18px] font-bold font-display tracking-tight" style={{ color: "#f5ede6" }}>
          Serene Studio
        </span>
      </div>

      {/* Header */}
      <div className="mb-10">
        <h2
          className="font-display font-bold"
          style={{ fontSize: "32px", letterSpacing: "-0.025em", color: "#f8eeea", lineHeight: 1.10 }}
        >
          Welcome back
        </h2>
        <p className="mt-2.5 text-[14px]" style={{ color: "rgba(190,168,158,0.42)", lineHeight: 1.5 }}>
          Sign in to your studio dashboard
        </p>
        <div style={{ height: "1px", marginTop: "24px", background: "linear-gradient(to right, rgba(255,200,150,0.07) 0%, transparent 100%)" }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        <div className="space-y-2">
          <Label
            htmlFor="email"
            style={{ color: "rgba(203,191,182,0.50)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, display: "block" }}
          >
            Email address
          </Label>
          <input
            id="email"
            type="email"
            placeholder="admin@serene.studio"
            autoComplete="email"
            {...emailReg}
            onFocus={() => setFocusedField("email")}
            onBlur={(e) => { emailReg.onBlur(e); setFocusedField(null); }}
            style={inputStyle("email", !!errors.email)}
          />
          {errors.email && (
            <p className="text-xs mt-1.5" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            style={{ color: "rgba(203,191,182,0.50)", fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, display: "block" }}
          >
            Password
          </Label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              {...passwordReg}
              onFocus={() => setFocusedField("password")}
              onBlur={(e) => { passwordReg.onBlur(e); setFocusedField(null); }}
              style={inputStyle("password", !!errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-opacity duration-150"
              style={{ color: "rgba(203,191,182,0.40)", opacity: 0.7 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs mt-1.5" style={{ color: "rgba(248,113,113,0.90)" }}>{errors.password.message}</p>
          )}
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[16px] text-[14.5px] font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.984] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              height: "58px",
              background: "linear-gradient(165deg, #b5182e 0%, #8a0d1c 50%, #600811 100%)",
              color: "#f8eeea",
              letterSpacing: "0.035em",
              boxShadow: "0 6px 32px rgba(140,14,28,0.45), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 44px rgba(140,14,28,0.58), inset 0 1px 0 rgba(255,255,255,0.12)";
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.filter = "";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 32px rgba(140,14,28,0.45), inset 0 1px 0 rgba(255,255,255,0.10)";
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

      <p className="mt-9 text-center text-[13px]" style={{ color: "rgba(190,168,158,0.36)" }}>
        New client?{" "}
        <a
          href={signupUrl}
          className="font-semibold transition-colors duration-150"
          style={{ color: "#c9a44e" }}
          onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = "#e8c06a")}
          onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = "#c9a44e")}
        >
          Create an account
        </a>
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 35, active: false });

  const onCardMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect();
    if (!r) return;
    setSpot({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
      active: true,
    });
  }, []);

  const onCardLeave = useCallback(() => {
    setSpot(s => ({ ...s, active: false }));
  }, []);

  return (
    <div
      className="relative min-h-dvh flex overflow-hidden"
      style={{ background: "#08020a" }}
    >

      {/* ══ FULLPAGE VIDEO BACKGROUND ═════════════════════════════════════════ */}
      <div className="absolute inset-0" aria-hidden="true">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "38% center",
          }}
        >
          <source
            src="/uploads/loopvideo.mp4"
            type="video/mp4"
          />
        </video>

        {/* Radial edge darkening */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse 78% 78% at 40% 50%, transparent 25%, rgba(4,1,6,0.55) 65%, rgba(4,1,6,0.90) 100%)",
        }} />

        {/* Left edge */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(4,1,6,0.80) 0%, rgba(4,1,6,0.20) 18%, transparent 38%)",
        }} />

        {/* Bottom — headline readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(4,1,6,0.90) 0%, rgba(4,1,6,0.45) 20%, transparent 40%)",
        }} />

        {/* Top — logo readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(4,1,6,0.72) 0%, transparent 22%)",
        }} />

        {/* Right — card readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to left, rgba(4,1,6,0.94) 0%, rgba(4,1,6,0.72) 26%, rgba(4,1,6,0.22) 48%, transparent 60%)",
        }} />

        {/* Grain */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.90' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.028,
          mixBlendMode: "overlay",
        }} />
      </div>

      {/* ══ LOGO — top left ═══════════════════════════════════════════════════ */}
      <div
        className="absolute hidden lg:flex flex-col"
        style={{ top: "3rem", left: "3.5rem", zIndex: 10 }}
        aria-label="Serene Studio"
      >
        <div className="flex items-center gap-4">
          <div
            className="rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              width: "52px",
              height: "52px",
              background: "linear-gradient(140deg, #b01830 0%, #7a0c1c 100%)",
              boxShadow: "0 0 32px rgba(177,18,38,0.55)",
            }}
          >
            <Sparkles className="text-white" style={{ width: "21px", height: "21px" }} />
          </div>
          <span
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "25px", color: "#f5ede6", letterSpacing: "-0.022em" }}
          >
            Serene Studio
          </span>
        </div>

        {/* Gold line + label */}
        <div className="flex items-center gap-3 mt-3.5 pl-1">
          <div style={{ width: "30px", height: "1.5px", background: "#c6a15b", opacity: 0.70, flexShrink: 0 }} />
          <span
            style={{
              fontSize: "9.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(198,161,91,0.65)",
              fontWeight: 700,
            }}
          >
            Premium Studio Platform
          </span>
        </div>
      </div>

      {/* ══ HEADLINE — lower left ═════════════════════════════════════════════ */}
      <div
        className="absolute hidden lg:block"
        style={{ bottom: "6rem", left: "3.5rem", zIndex: 10, maxWidth: "480px" }}
      >
        <h1
          className="font-display font-bold"
          style={{
            fontSize: "clamp(2.8rem, 4.0vw, 4.4rem)",
            lineHeight: 1.08,
            letterSpacing: "-0.036em",
          }}
        >
          <span style={{ color: "#f0e8e0", display: "block" }}>Where luxury</span>
          <span
            style={{
              display: "block",
              marginTop: "0.06em",
              color: "#d4a84b",
            }}
          >
            meets control.
          </span>
        </h1>
      </div>

      {/* ══ LOGIN CARD — right, vertically centered ═══════════════════════════ */}
      <div
        className="relative z-10 flex items-center justify-end w-full min-h-dvh"
        style={{ padding: "2.5rem 4.5rem 2.5rem 0" }}
      >
        <div className="w-full lg:w-auto flex lg:justify-end justify-center px-5 lg:px-0">
          {/* Card wrapper — handles mouse tracking for spotlight */}
          <div
            ref={cardRef}
            onMouseMove={onCardMove}
            onMouseLeave={onCardLeave}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "500px",
              padding: "56px 52px",
              /* Warm near-black tinted surface — picks up red/orange environment */
              background: "linear-gradient(160deg, rgba(22,6,9,0.78) 0%, rgba(10,2,5,0.80) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "24px",
              /* Very thin warm-tinted border — almost invisible */
              border: "1px solid rgba(210,90,60,0.10)",
              boxShadow: [
                /* Ambient depth */
                "0 32px 90px rgba(0,0,0,0.68)",
                /* Outer warm edge glow — faint, cinematic */
                "0 0 0 1px rgba(140,20,15,0.08)",
                /* Top inner highlight — glass catching light */
                "inset 0 1px 0 rgba(255,195,150,0.07)",
                /* Internal warm depth */
                "inset 0 0 80px rgba(100,8,14,0.08)",
              ].join(", "),
              overflow: "hidden",
            }}
          >
            {/* ── Ambient static surface glow (idle beauty layer) ── */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0,
                borderRadius: "24px",
                background: "radial-gradient(70% 35% at 50% 0%, rgba(155,30,20,0.09) 0%, transparent 100%)",
                pointerEvents: "none",
              }}
            />

            {/* ── Spotlight hover glow (follows cursor) ── */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0,
                borderRadius: "24px",
                opacity: spot.active ? 1 : 0,
                transition: "opacity 0.55s ease",
                background: `radial-gradient(340px circle at ${spot.x}% ${spot.y}%, rgba(175,38,22,0.10), rgba(120,15,8,0.04) 50%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />

            {/* ── Border highlight that brightens on hover ── */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0,
                borderRadius: "24px",
                opacity: spot.active ? 1 : 0,
                transition: "opacity 0.55s ease",
                background: `radial-gradient(260px circle at ${spot.x}% ${spot.y}%, rgba(220,100,60,0.06), transparent 60%)`,
                pointerEvents: "none",
              }}
            />

            {/* Form content — sits above glow layers */}
            <div style={{ position: "relative", zIndex: 1 }}>
              <Suspense>
                <LoginForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
