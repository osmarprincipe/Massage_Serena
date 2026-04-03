"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { Crown, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MembershipDialogProps {
  open: boolean;
  onClose: () => void;
  user?: any | null;
  onSaved: () => void;
}

export function MembershipDialog({ open, onClose, user, onSaved }: MembershipDialogProps) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (open) fetchPlans();
  }, [open]);

  const fetchPlans = async () => {
    const res = await fetch("/api/memberships");
    const data = await res.json();
    setPlans(data.data || []);
  };

  const handleAssign = async () => {
    if (!selectedPlan || !user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          planId: selectedPlan,
          startDate,
          endDate: endDate || undefined,
          status: "ACTIVE",
        }),
      });

      if (res.ok) {
        toast.success("Membership assigned");
        onSaved();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to assign membership");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const currentMembership = user?.memberships?.[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Membership</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-5">
          {/* Current status */}
          {currentMembership && (
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Current Membership</p>
                <MembershipBadge level={currentMembership.plan.name} />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(currentMembership.plan.price)}/{currentMembership.plan.billingCycle.toLowerCase()}
              </p>
            </div>
          )}

          {/* Plan selection */}
          <div className="space-y-3">
            <Label>Select Plan</Label>
            <div className="grid gap-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${
                      plan.level === 3 ? "bg-gold-100" : plan.level === 2 ? "bg-mocha-100" : "bg-muted"
                    }`}>
                      <Crown className={`h-4 w-4 ${
                        plan.level === 3 ? "text-gold-600" : plan.level === 2 ? "text-mocha-600" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(plan.price)}/{plan.billingCycle.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  {selectedPlan === plan.id && (
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedPlan} loading={loading}>
            Assign Membership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
