"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Mail, Phone, Calendar, Shield, KeyRound,
  CheckCircle, Edit2, Save, X,
} from "lucide-react";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatDate, getInitials } from "@/lib/utils";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Minimum 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function MyProfilePage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    fetch("/api/app/profile")
      .then((r) => r.json())
      .then((d) => {
        setUserData(d.data);
        profileForm.reset({ name: d.data?.name || "", phone: d.data?.phone || "" });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const onSaveProfile = async (data: ProfileForm) => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/app/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setUserData((prev: any) => ({ ...prev, ...updated.data }));
        toast.success("Profile updated");
        setEditingProfile(false);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setSavingPassword(true);
    try {
      const res = await fetch("/api/app/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      if (res.ok) {
        toast.success("Password changed successfully");
        passwordForm.reset();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to change password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const activeMembership = userData?.memberships?.[0];
  const displayName = userData?.name || userData?.client?.name || "Member";

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          My Profile
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your account details and preferences
        </p>
      </div>

      {/* Avatar + overview */}
      <div className="flex items-center gap-5 p-6 rounded-2xl border border-border bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-mocha-400 to-gold-500 flex items-center justify-center text-white text-2xl font-bold font-display shrink-0">
          {getInitials(displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold font-display text-foreground truncate">{displayName}</p>
          <p className="text-sm text-muted-foreground">{userData?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <StatusBadge status={userData?.status || "ACTIVE"} />
            {activeMembership && (
              <MembershipBadge level={activeMembership.plan.name} size="sm" />
            )}
            {userData?.emailVerified && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
              <User className="h-4 w-4" />
            </div>
            <h2 className="font-semibold font-display text-foreground">Personal Information</h2>
          </div>
          {!editingProfile ? (
            <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingProfile(false);
                  profileForm.reset({ name: userData?.name || "", phone: userData?.phone || "" });
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                loading={savingProfile}
                onClick={profileForm.handleSubmit(onSaveProfile)}
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {editingProfile ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input placeholder="Your full name" {...profileForm.register("name")} />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 (555) 000-0000" {...profileForm.register("phone")} />
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                <p className="text-xs text-muted-foreground">
                  Email address cannot be changed. Contact the studio for assistance.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <InfoRow icon={User} label="Full Name" value={userData?.name || "—"} />
              <InfoRow icon={Mail} label="Email" value={userData?.email} />
              <InfoRow icon={Phone} label="Phone" value={userData?.phone || "—"} />
              <InfoRow
                icon={Calendar}
                label="Member since"
                value={userData?.createdAt ? formatDate(userData.createdAt) : "—"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Linked Client */}
      {userData?.client && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <h2 className="font-semibold font-display text-foreground">Client Profile</h2>
          </div>
          <div className="space-y-3">
            <InfoRow icon={User} label="Client name" value={userData.client.name} />
            {userData.client.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-foreground bg-muted/40 rounded-xl px-4 py-3 leading-relaxed">
                  {userData.client.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Change Password */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-border/60">
          <div className="p-1.5 rounded-lg bg-primary/8 text-primary">
            <KeyRound className="h-4 w-4" />
          </div>
          <h2 className="font-semibold font-display text-foreground">Change Password</h2>
        </div>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Current Password</Label>
            <Input type="password" placeholder="Your current password" {...passwordForm.register("currentPassword")} />
            {passwordForm.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" placeholder="Min 8 characters" {...passwordForm.register("newPassword")} />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="Repeat password" {...passwordForm.register("confirmPassword")} />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          <Button type="submit" loading={savingPassword} variant="outline" className="w-full">
            <KeyRound className="h-4 w-4" />
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-muted/60 text-muted-foreground shrink-0">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
