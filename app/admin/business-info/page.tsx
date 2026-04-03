"use client";

import { useState, useEffect } from "react";
import { Building2, MapPin, Phone, Mail, Clock, Plus, Edit2, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ServiceDialog } from "@/components/business/ServiceDialog";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { toast } from "sonner";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function BusinessPage() {
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [editService, setEditService] = useState<any | null>(null);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [deletingService, setDeletingService] = useState(false);

  const [form, setForm] = useState({
    businessName: "",
    address: "",
    phone: "",
    email: "",
    description: "",
    workingHours: DAYS.reduce((acc, d) => ({
      ...acc,
      [d]: d === "sunday" ? { open: null, close: null } : { open: "09:00", close: "18:00" },
    }), {} as Record<string, any>),
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [businessRes, servicesRes] = await Promise.all([
      fetch("/api/business"),
      fetch("/api/services"),
    ]);
    const businessData = await businessRes.json();
    const servicesData = await servicesRes.json();

    if (businessData.data) {
      const b = businessData.data;
      setForm({
        businessName: b.businessName || "",
        address: b.address || "",
        phone: b.phone || "",
        email: b.email || "",
        description: b.description || "",
        workingHours: b.workingHours ? JSON.parse(b.workingHours) : form.workingHours,
      });
    }
    setServices(servicesData.data || []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) toast.success("Business info saved");
      else toast.error("Failed to save");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteServiceId) return;
    setDeletingService(true);
    try {
      await fetch(`/api/services/${deleteServiceId}`, { method: "DELETE" });
      toast.success("Service deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete service");
    } finally {
      setDeletingService(false);
      setDeleteServiceId(null);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <SectionHeader
        title="Business Info"
        description="Configure your studio details"
        icon={Building2}
        actions={
          <Button onClick={handleSave} loading={saving}>
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      />

      {/* Business Details */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-primary/8 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <h2 className="font-semibold font-display text-foreground">Studio Details</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Business Name</Label>
            <Input
              placeholder="Your studio name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Address</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Studio address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="hello@studio.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe your studio and philosophy..."
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-card rounded-2xl border border-border shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-lg bg-primary/8 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <h2 className="font-semibold font-display text-foreground">Working Hours</h2>
        </div>

        <div className="space-y-2">
          {DAYS.map((day) => {
            const hours = form.workingHours[day] || { open: null, close: null };
            const isClosed = !hours.open;
            return (
              <div
                key={day}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors"
              >
                <span className="text-sm font-medium text-foreground w-24 capitalize">{day}</span>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={hours.open || ""}
                    disabled={isClosed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        workingHours: {
                          ...form.workingHours,
                          [day]: { ...hours, open: e.target.value },
                        },
                      })
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground text-sm">to</span>
                  <Input
                    type="time"
                    value={hours.close || ""}
                    disabled={isClosed}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        workingHours: {
                          ...form.workingHours,
                          [day]: { ...hours, close: e.target.value },
                        },
                      })
                    }
                    className="w-32"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      workingHours: {
                        ...form.workingHours,
                        [day]: isClosed
                          ? { open: "09:00", close: "18:00" }
                          : { open: null, close: null },
                      },
                    })
                  }
                  className={isClosed ? "text-muted-foreground" : "text-primary"}
                >
                  {isClosed ? "Closed" : "Open"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <div>
            <h2 className="font-semibold font-display text-foreground">Services</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{services.length} services defined</p>
          </div>
          <Button
            size="sm"
            onClick={() => { setEditService(null); setServiceDialog(true); }}
          >
            <Plus className="h-4 w-4" />
            Add Service
          </Button>
        </div>

        <div className="divide-y divide-border/40">
          {services.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No services yet. Add your first service.
            </div>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{service.name}</p>
                  {service.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{service.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-sm text-muted-foreground">{formatDuration(service.duration)}</span>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(service.price)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => { setEditService(service); setServiceDialog(true); }}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteServiceId(service.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ServiceDialog
        open={serviceDialog}
        onClose={() => { setServiceDialog(false); setEditService(null); }}
        service={editService}
        onSaved={() => { fetchData(); setServiceDialog(false); setEditService(null); }}
      />

      <ConfirmDialog
        open={!!deleteServiceId}
        onClose={() => setDeleteServiceId(null)}
        onConfirm={handleDeleteService}
        title="Delete Service"
        description="This service will be permanently deleted."
        confirmLabel="Delete"
        loading={deletingService}
      />
    </div>
  );
}
