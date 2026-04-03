"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Booking, Client, Service } from "@/types";
import { UserPlus, Users } from "lucide-react";

const bookingSchema = z.object({
  clientMode: z.enum(["existing", "new"]),
  clientId: z.string().optional(),
  newClientName: z.string().optional(),
  newClientEmail: z.string().email().optional().or(z.literal("")),
  newClientPhone: z.string().optional(),
  serviceId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  duration: z.coerce.number().int().min(15, "Min 15 minutes"),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

type FormData = z.infer<typeof bookingSchema>;

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  booking?: Booking | null;
  onSaved: () => void;
}

export function BookingDialog({ open, onClose, booking, onSaved }: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const isEdit = !!booking;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientMode: "existing",
      status: "PENDING",
      duration: 60,
    },
  });

  const clientMode = watch("clientMode");

  useEffect(() => {
    if (open) {
      fetchClients();
      fetchServices();

      if (booking) {
        const d = new Date(booking.date);
        reset({
          clientMode: "existing",
          clientId: booking.clientId,
          serviceId: booking.serviceId || undefined,
          date: d.toISOString().split("T")[0],
          time: d.toTimeString().slice(0, 5),
          duration: booking.duration,
          notes: booking.notes || "",
          status: booking.status as any,
        });
      } else {
        reset({
          clientMode: "existing",
          status: "PENDING",
          duration: 60,
          date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, booking, reset]);

  const fetchClients = async () => {
    const res = await fetch("/api/clients?limit=100");
    const data = await res.json();
    setClients(data.data || []);
  };

  const fetchServices = async () => {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.data || []);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const dateTime = new Date(`${data.date}T${data.time}`);

      const payload: any = {
        serviceId: data.serviceId || undefined,
        date: dateTime.toISOString(),
        duration: data.duration,
        notes: data.notes || undefined,
        status: data.status,
      };

      if (data.clientMode === "existing") {
        if (!data.clientId) {
          toast.error("Please select a client");
          return;
        }
        payload.clientId = data.clientId;
      } else {
        if (!data.newClientName) {
          toast.error("Client name is required");
          return;
        }
        payload.newClient = {
          name: data.newClientName,
          email: data.newClientEmail || undefined,
          phone: data.newClientPhone || undefined,
        };
      }

      const url = isEdit ? `/api/bookings/${booking!.id}` : "/api/bookings";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(isEdit ? "Booking updated" : "Booking created");
        onSaved();
      } else {
        const err = await res.json();
        toast.error(err.error || "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Booking" : "New Booking"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-6">
            {/* Client Selection */}
            {!isEdit && (
              <div className="space-y-3">
                <Label>Client</Label>
                <Tabs
                  value={clientMode}
                  onValueChange={(v) => setValue("clientMode", v as "existing" | "new")}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="existing" className="flex-1 gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Existing Client
                    </TabsTrigger>
                    <TabsTrigger value="new" className="flex-1 gap-2">
                      <UserPlus className="h-3.5 w-3.5" />
                      New Client
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="existing" className="mt-3">
                    <Select
                      value={watch("clientId")}
                      onValueChange={(v) => setValue("clientId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                            {c.email && (
                              <span className="text-muted-foreground ml-1.5">
                                · {c.email}
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="new" className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Full Name *</Label>
                        <Input placeholder="Client name" {...register("newClientName")} />
                        {errors.newClientName && (
                          <p className="text-xs text-destructive">{errors.newClientName.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input placeholder="+1 (555) 000-0000" {...register("newClientPhone")} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="client@example.com"
                        {...register("newClientEmail")}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {isEdit && (
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  Client: <span className="font-medium text-foreground">{booking?.client?.name}</span>
                </p>
              </div>
            )}

            {/* Service */}
            <div className="space-y-1.5">
              <Label>Service</Label>
              <Select
                value={watch("serviceId") || "none"}
                onValueChange={(v) => setValue("serviceId", v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific service</SelectItem>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.duration}min · ${s.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input type="date" {...register("date")} />
                {errors.date && (
                  <p className="text-xs text-destructive">{errors.date.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Time *</Label>
                <Input type="time" {...register("time")} />
                {errors.time && (
                  <p className="text-xs text-destructive">{errors.time.message}</p>
                )}
              </div>
            </div>

            {/* Duration & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={15}
                  step={15}
                  {...register("duration", { valueAsNumber: true })}
                />
                {errors.duration && (
                  <p className="text-xs text-destructive">{errors.duration.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any special instructions or notes..."
                rows={3}
                {...register("notes")}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Save Changes" : "Create Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
