"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, X, CheckCircle2, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  billingCycle: z.enum(["MONTHLY", "WEEKLY"]),
  level: z.coerce.number().int().min(1, "Level must be at least 1"),
  description: z.string().optional(),
  isPopular: z.boolean(),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface PlanDialogProps {
  open: boolean;
  onClose: () => void;
  /** null → create mode; plan object → edit mode */
  plan: any | null;
  onSaved: (updatedPlan?: any) => void;
}

export function PlanDialog({ open, onClose, plan, onSaved }: PlanDialogProps) {
  const isCreate = !plan;
  const [loading, setLoading] = useState(false);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [localStripePriceId, setLocalStripePriceId] = useState<string | null>(null);
  const [localStripeProductId, setLocalStripeProductId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { billingCycle: "MONTHLY", isPopular: false, isActive: true, level: 1 },
    });

  useEffect(() => {
    if (!open) return;

    if (isCreate) {
      reset({ billingCycle: "MONTHLY", isPopular: false, isActive: true, level: 1, name: "", price: 0, description: "" });
      setFeatures([]);
      setLocalStripePriceId(null);
      setLocalStripeProductId(null);
    } else {
      reset({
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        level: plan.level,
        description: plan.description || "",
        isPopular: plan.isPopular ?? false,
        isActive: plan.isActive ?? true,
      });
      try { setFeatures(JSON.parse(plan.features || "[]")); }
      catch { setFeatures([]); }
      setLocalStripePriceId(plan.stripePriceId ?? null);
      setLocalStripeProductId(plan.stripeProductId ?? null);
    }
    setNewFeature("");
  }, [open, plan, isCreate, reset]);

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setFeatures((prev) => [...prev, trimmed]);
    setNewFeature("");
  };

  const removeFeature = (i: number) => setFeatures((prev) => prev.filter((_, idx) => idx !== i));
  const updateFeature = (i: number, value: string) =>
    setFeatures((prev) => prev.map((item, idx) => (idx === i ? value : item)));

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = isCreate ? "/api/memberships/plans" : `/api/memberships/${plan.id}`;
      const method = isCreate ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, features }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || (isCreate ? "Failed to create plan" : "Failed to update plan"));
        return;
      }

      const updatedPlan: any = json.data ?? {};
      const stripeIds: any = json.stripeIds ?? {};
      const newPriceId = updatedPlan.stripePriceId || stripeIds.stripePriceId || null;
      const newProductId = updatedPlan.stripeProductId || stripeIds.stripeProductId || null;
      setLocalStripePriceId(newPriceId);
      setLocalStripeProductId(newProductId);

      if (json.stripeSyncError) {
        toast.warning(`Plan saved, but Stripe sync failed: ${json.stripeSyncError}`);
      } else {
        toast.success(
          isCreate
            ? newPriceId ? "Plan created and synced with Stripe" : "Plan created"
            : newPriceId ? "Plan updated and synced with Stripe" : "Plan updated"
        );
      }

      onSaved({ ...updatedPlan, stripePriceId: newPriceId, stripeProductId: newProductId });
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? "New Plan" : `Edit Plan — ${plan?.name}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <Label>Plan Name *</Label>
              <Input placeholder="e.g. Premium" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            {/* Price + Billing + Level */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Price (USD) *</Label>
                <Input type="number" min={0} step={0.01} placeholder="99.00" {...register("price")} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Billing Period</Label>
                <Select
                  value={watch("billingCycle")}
                  onValueChange={(v) => setValue("billingCycle", v as "MONTHLY" | "WEEKLY")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Level *</Label>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="1"
                  {...register("level")}
                />
                {errors.level && <p className="text-xs text-destructive">{errors.level.message}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Short description of this plan..." rows={3} {...register("description")} />
            </div>

            {/* Stripe sync status */}
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm ${
              localStripePriceId
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              {localStripePriceId
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <AlertCircle className="h-4 w-4 shrink-0" />
              }
              <div className="min-w-0">
                <p className="font-medium text-xs">
                  {localStripePriceId ? "Connected to Stripe" : "Not yet synced with Stripe"}
                </p>
                <p className="text-xs opacity-70 truncate mt-0.5">
                  {localStripePriceId
                    ? `Price: ${localStripePriceId}`
                    : "Stripe product & price will be created automatically when you save."}
                </p>
              </div>
            </div>

            {/* Benefits list */}
            <div className="space-y-3">
              <Label>Included Benefits</Label>
              <div className="space-y-2">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={f} onChange={(e) => updateFeature(i, e.target.value)} className="flex-1" />
                    <button
                      type="button"
                      onClick={() => removeFeature(i)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add a benefit..."
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-0 rounded-xl border border-border bg-muted/30 divide-y divide-border/60">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">Most Popular</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Shows a "Most Popular" badge on this plan</p>
                </div>
                <Switch checked={watch("isPopular")} onCheckedChange={(v) => setValue("isPopular", v)} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Inactive plans are hidden from the payment page</p>
                </div>
                <Switch checked={watch("isActive")} onCheckedChange={(v) => setValue("isActive", v)} />
              </div>
            </div>

          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {isCreate ? "Create Plan" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
