"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

// ─── Inner form — uses useSearchParams, must be inside Suspense ───────────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@serene.studio", password: "admin123" },
  });

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

  return (
    <div className="w-full max-w-[400px] space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5 lg:hidden mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-mocha-500 to-gold-500 shadow-soft">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold font-display">Serene Studio</span>
        </div>
        <h2 className="text-3xl font-bold font-display tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-muted-foreground text-sm">
          Sign in to your studio dashboard
        </p>
      </div>

      {/* Demo credentials hint */}
      <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Demo:</span>{" "}
          admin@serene.studio / admin123
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
            className={errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={cn("pr-11", errors.password ? "border-destructive" : "")}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base gap-2"
          loading={loading}
        >
          Sign in
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        New client?{" "}
        <a href={signupUrl} className="text-primary hover:underline font-medium">
          Create an account
        </a>
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left — Branding Panel */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-gradient-to-br from-mocha-800 via-mocha-700 to-mocha-900 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-[500px] h-[500px] rounded-full bg-mocha-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gold-400/5 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Sparkles className="h-5 w-5 text-gold-300" />
            </div>
            <span className="text-lg font-semibold text-white/90 font-display tracking-tight">
              Serene Studio
            </span>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-5xl font-bold text-white font-display leading-tight tracking-tight">
                Wellness,
                <br />
                <span className="text-gold-300">beautifully</span>
                <br />
                managed.
              </p>
              <p className="text-base text-mocha-100/70 leading-relaxed max-w-sm">
                The premium platform for luxury massage therapy studios.
                Elevate your practice, delight your clients.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["Booking Management", "Member Content", "Client CRM", "Analytics"].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-sm text-mocha-100/80 italic leading-relaxed">
              &ldquo;Serene Studio transformed how I manage my practice. The platform feels as
              luxurious as the experiences I create for my clients.&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gold-300 to-mocha-400 flex items-center justify-center text-xs font-semibold text-white">
                MR
              </div>
              <div>
                <p className="text-xs font-semibold text-white/90">Marie Rousseau</p>
                <p className="text-[10px] text-mocha-200/60">Owner, Atelier Wellness Paris</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
