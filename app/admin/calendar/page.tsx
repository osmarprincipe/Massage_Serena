"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { BookingDialog } from "@/components/bookings/BookingDialog";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { toast } from "sonner";

interface CalendarBooking {
  id: string;
  date: string;
  duration: number;
  status: string;
  client: { name: string };
  service?: { name: string } | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const from = startOfMonth(currentDate).toISOString();
      const to = endOfMonth(currentDate).toISOString();
      const res = await fetch(`/api/bookings?from=${from}&to=${to}&limit=100`);
      const data = await res.json();
      setBookings(data.data || []);
    } catch {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentDate]);

  // Build calendar grid
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getBookingsForDay = (date: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.date), date));

  const statusDotColors: Record<string, string> = {
    PENDING: "bg-amber-400",
    CONFIRMED: "bg-emerald-400",
    COMPLETED: "bg-blue-400",
    CANCELLED: "bg-red-400",
    NO_SHOW: "bg-gray-400",
  };

  const dayBookings = selectedDate ? getBookingsForDay(selectedDate) : [];

  return (
    <div className="max-w-7xl space-y-6">
      <SectionHeader
        title="Calendar"
        description="Manage your schedule visually"
        icon={Calendar}
        actions={
          <Button onClick={() => { setSelectedBooking(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
            <h2 className="text-lg font-semibold font-display text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-border/60">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {days.map((date, i) => {
              const dayBookingsList = getBookingsForDay(date);
              const isCurrentMonth = isSameMonth(date, currentDate);
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[88px] p-2 border-b border-r border-border/30 cursor-pointer transition-colors duration-150 ${
                    !isCurrentMonth ? "bg-muted/20" : ""
                  } ${isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/20" : "hover:bg-muted/40"}`}
                >
                  <div
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${
                      isTodayDate
                        ? "bg-primary text-primary-foreground"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    {format(date, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookingsList.slice(0, 2).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center gap-1 rounded px-1 py-0.5 bg-muted/60 hover:bg-muted transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(booking);
                          setDialogOpen(true);
                        }}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDotColors[booking.status] || "bg-gray-400"}`} />
                        <span className="text-[10px] text-foreground truncate">
                          {booking.client.name.split(" ")[0]}
                        </span>
                      </div>
                    ))}
                    {dayBookingsList.length > 2 && (
                      <p className="text-[10px] text-muted-foreground px-1">
                        +{dayBookingsList.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
          <div className="px-5 py-4 border-b border-border/60">
            <h3 className="font-semibold font-display text-foreground">
              {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a day"}
            </h3>
            {selectedDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="p-4 space-y-3 overflow-y-auto max-h-[400px]">
            {!selectedDate ? (
              <div className="text-center py-10">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Click a day to see bookings</p>
              </div>
            ) : dayBookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">No bookings this day</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => { setSelectedBooking(null); setDialogOpen(true); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Booking
                </Button>
              </div>
            ) : (
              dayBookings
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((booking) => (
                  <div
                    key={booking.id}
                    className="p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                    onClick={() => { setSelectedBooking(booking); setDialogOpen(true); }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-foreground">{booking.client.name}</p>
                      <StatusBadge status={booking.status} />
                    </div>
                    {booking.service && (
                      <p className="text-xs text-muted-foreground mb-1">{booking.service.name}</p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(booking.date), "h:mm a")}</span>
                      <span>· {booking.duration}min</span>
                    </div>
                  </div>
                ))
            )}
          </div>

          {/* Legend */}
          <div className="px-5 py-4 border-t border-border/60">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Status Legend
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(statusDotColors).map(([status, color]) => (
                <div key={status} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${color}`} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {status.toLowerCase().replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BookingDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setSelectedBooking(null); }}
        booking={selectedBooking}
        onSaved={() => { fetchBookings(); setDialogOpen(false); setSelectedBooking(null); }}
      />
    </div>
  );
}
