"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  duration: z.coerce.number().int().min(15, "Min 15 minutes"),
  price: z.coerce.number().min(0, "Price must be positive"),
});

type FormData = z.infer<typeof schema>;

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  service?: any | null;
  onSaved: () => void;
}

export function ServiceDialog({ open, onClose, service, onSaved }: ServiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!service;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { duration: 60, price: 0 },
  });

  useEffect(() => {
    if (open) {
      reset(isEdit ? {
        name: service.name,
        description: service.description || "",
        duration: service.duration,
        price: service.price,
      } : { duration: 60, price: 0 });
    }
  }, [open, service, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const url = isEdit ? `/api/services/${service.id}` : "/api/services";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(isEdit ? "Service updated" : "Service created");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Service" : "New Service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Service Name *</Label>
              <Input placeholder="e.g. Swedish Relaxation" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Describe this service..." rows={3} {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Duration (min) *</Label>
                <Input type="number" min={15} step={15} {...register("duration")} />
                {errors.duration && <p className="text-xs text-destructive">{errors.duration.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Price (USD) *</Label>
                <Input type="number" min={0} step={0.01} {...register("price")} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
