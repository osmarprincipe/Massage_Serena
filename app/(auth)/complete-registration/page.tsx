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
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-mocha-100/30 blur-3xl" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-mocha-500 to-gold-500 shadow-soft">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-semibold font-display">Serene Studio</span>
        </div>

        {/* Card */}
        <div className="bg-card rounded-3xl border border-border shadow-premium p-8">
          {step < 3 ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold font-display text-foreground mb-2">
                  Complete your account
                </h2>
                <p className="text-sm text-muted-foreground">
                  Welcome! Set up your profile to access your membership.
                </p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-8">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                      i < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="Your full name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>
                    Phone{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <Input placeholder="+1 (555) 000-0000" {...register("phone")} />
                </div>

                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    placeholder="Create a strong password"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Repeat your password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full h-11 mt-2" loading={loading}>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-6 space-y-5">
              <div className="flex items-center justify-center">
                <div className="p-5 rounded-full bg-emerald-50">
                  <CheckCircle className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display text-foreground mb-2">
                  Account created!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your membership is now active. Redirecting to login...
                </p>
              </div>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-[progress_2s_ease-in-out]" style={{ width: "100%" }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
