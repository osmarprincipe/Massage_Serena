"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, CheckCircle, Circle, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/shared/LoadingSkeleton";
import { formatDate, formatTime, formatDuration, formatCurrency, formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const statusOrder: Record<string, number> = {
  CONFIRMED: 0, PENDING: 1, COMPLETED: 2, CANCELLED: 3, NO_SHOW: 4,
};

function BookingCard({ booking, isPast }: { booking: any; isPast?: boolean }) {
  const d = new Date(booking.date);
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const day = d.getDate();

  return (
    <div className={`flex gap-4 p-5 rounded-2xl border bg-card transition-all duration-200 ${
      isPast ? "opacity-75 hover:opacity-100" : "hover:shadow-card"
    }`}>
      {/* Date block */}
      <div className="shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-mocha-50 to-sand-100 border border-mocha-100 text-center">
        <span className="text-[10px] font-bold text-mocha-500 uppercase tracking-wider leading-none">
          {month}
        </span>
        <span className="text-xl font-bold font-display text-mocha-800 leading-tight">{day}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="font-semibold text-foreground">
            {booking.service?.name || "Session"}
          </p>
          <StatusBadge status={booking.status} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(booking.date)}
          </span>
          <span className="flex items-center gap-1">
            <Circle className="h-2.5 w-2.5" />
            {formatDuration(booking.duration)}
          </span>
          {booking.service?.price && (
            <span className="font-medium text-foreground">
              {formatCurrency(booking.service.price)}
            </span>
          )}
        </div>
        {booking.notes && (
          <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic line-clamp-2">
            "{booking.notes}"
          </p>
        )}
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const [data, setData] = useState<{ upcoming: any[]; past: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/app/bookings")
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full rounded-xl" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  const { upcoming = [], past = [] } = data || {};

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-foreground">
          My Bookings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your upcoming and past sessions
        </p>
      </div>

      {/* Next session highlight */}
      {upcoming[0] && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-mocha-700 to-mocha-900 p-5 text-white">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gold-400/10 blur-2xl" />
          <div className="relative z-10">
            <p className="text-mocha-200/70 text-xs uppercase tracking-widest mb-2">Next Session</p>
            <p className="text-xl font-bold font-display mb-1">
              {upcoming[0].service?.name || "Session"}
            </p>
            <p className="text-mocha-100/80 text-sm">
              {formatRelativeDate(upcoming[0].date)} · {formatDuration(upcoming[0].duration)}
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">
            Upcoming
            {upcoming.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="flex-1">
            Past
            {past.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                {past.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="p-4 rounded-2xl bg-muted/50 mb-3">
                <Calendar className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No upcoming bookings</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Contact the studio to book your next session.
              </p>
            </div>
          ) : (
            upcoming.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {past.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="p-4 rounded-2xl bg-muted/50 mb-3">
                <CheckCircle className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No past sessions yet</h3>
              <p className="text-sm text-muted-foreground">Your booking history will appear here.</p>
            </div>
          ) : (
            past.map((b) => <BookingCard key={b.id} booking={b} isPast />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
