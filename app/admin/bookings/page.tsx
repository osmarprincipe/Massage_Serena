"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search, Filter, Calendar, Edit2, Trash2, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { TableSkeleton } from "@/components/shared/LoadingSkeleton";
import { BookingDialog } from "@/components/bookings/BookingDialog";
import { formatRelativeDate, formatCurrency, formatDuration } from "@/lib/utils";
import { Booking } from "@/types";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/bookings?${params}`);
      const data = await res.json();
      setBookings(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchBookings, 300);
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setDialogOpen(true);
      router.replace("/admin/bookings");
    }
  }, [searchParams, router]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/bookings/${deleteId}`, { method: "DELETE" });
      toast.success("Booking deleted");
      fetchBookings();
    } catch {
      toast.error("Failed to delete booking");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const handleSaved = () => {
    fetchBookings();
    setDialogOpen(false);
    setEditBooking(null);
  };

  const statuses = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];

  return (
    <div className="max-w-7xl space-y-6">
      <SectionHeader
        title="Bookings"
        description={`${total} total appointments`}
        icon={Calendar}
        actions={
          <Button onClick={() => { setEditBooking(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "All Statuses" : s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No bookings found"
            description={search || statusFilter !== "ALL" ? "Try adjusting your filters" : "Create your first booking to get started"}
            action={search || statusFilter !== "ALL" ? undefined : { label: "New Booking", onClick: () => setDialogOpen(true) }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-6 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="hover:bg-muted/30 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-mocha-300 to-mocha-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {booking.client?.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{booking.client?.name}</p>
                          <p className="text-xs text-muted-foreground">{booking.client?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-foreground">
                        {booking.service?.name || (
                          <span className="text-muted-foreground italic">No service</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-foreground">{formatRelativeDate(booking.date)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDuration(booking.duration)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-foreground">
                        {booking.service?.price
                          ? formatCurrency(booking.service.price)
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => { setEditBooking(booking); setDialogOpen(true); }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteId(booking.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog */}
      <BookingDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditBooking(null); }}
        booking={editBooking}
        onSaved={handleSaved}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Booking"
        description="This action cannot be undone. The booking will be permanently deleted."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
