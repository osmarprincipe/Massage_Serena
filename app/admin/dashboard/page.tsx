import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  CalendarDays,
  Users,
  UserCircle,
  Crown,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { formatRelativeDate, formatCurrency, formatDate } from "@/lib/utils";
import { startOfDay, endOfDay } from "date-fns";
import Link from "next/link";

async function getDashboardData() {
  const today = new Date();
  const [
    todayBookings,
    activeUsers,
    totalClients,
    activeMemberships,
    recentBookings,
    upcomingBookings,
    membershipBreakdown,
  ] = await Promise.all([
    prisma.booking.count({ where: { date: { gte: startOfDay(today), lte: endOfDay(today) } } }),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.client.count(),
    prisma.userMembership.count({ where: { status: "ACTIVE" } }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: {
        client: { select: { name: true, email: true } },
        service: { select: { name: true, price: true } },
      },
    }),
    prisma.booking.findMany({
      where: { date: { gte: today }, status: { in: ["PENDING", "CONFIRMED"] } },
      take: 4,
      orderBy: { date: "asc" },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
    prisma.userMembership.groupBy({
      by: ["planId"],
      where: { status: "ACTIVE" },
      _count: true,
    }),
  ]);

  const plans = await prisma.membershipPlan.findMany({ select: { id: true, name: true } });
  const planMap = Object.fromEntries(plans.map((p) => [p.id, p.name]));
  const breakdown: Record<string, number> = { Normal: 0, VIP: 0, Premium: 0 };
  membershipBreakdown.forEach((m) => {
    const name = planMap[m.planId];
    if (name) breakdown[name] = m._count;
  });

  return {
    todayBookings,
    activeUsers,
    totalClients,
    activeMemberships,
    recentBookings,
    upcomingBookings,
    membershipBreakdown: breakdown,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-7 max-w-7xl animate-fade-in">

      {/* ── Welcome Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1" style={{ letterSpacing: "0.04em" }}>
            {greeting}
          </p>
          <h1 className="text-[28px] font-bold font-display tracking-tight text-foreground" style={{ letterSpacing: "-0.022em" }}>
            {session?.user?.name?.split(" ")[0] || "Studio Admin"}
            <span style={{ color: "rgba(212,175,55,0.70)", marginLeft: "6px" }}>✦</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1" style={{ opacity: 0.75 }}>
            Here&apos;s what&apos;s happening at Serene Studio today.
          </p>
        </div>
        <div
          className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border shrink-0"
          style={{ background: "rgba(122,12,28,0.10)", borderColor: "rgba(177,18,38,0.18)" }}
        >
          <Sparkles className="h-3.5 w-3.5" style={{ color: "#d4af37" }} />
          <span className="text-sm font-medium text-foreground" style={{ letterSpacing: "-0.01em" }}>
            {formatDate(new Date(), "EEEE, MMMM d")}
          </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Today's Bookings" value={data.todayBookings} subtitle="Scheduled sessions" icon={CalendarDays} trend={{ value: 12, label: "vs last week" }} variant="accent" />
        <StatCard title="Active Members" value={data.activeUsers} subtitle="Registered accounts" icon={UserCircle} trend={{ value: 8, label: "this month" }} />
        <StatCard title="Total Clients" value={data.totalClients} subtitle="Client profiles" icon={Users} trend={{ value: 5, label: "new this month" }} />
        <StatCard title="Active Memberships" value={data.activeMemberships} subtitle="Paid subscribers" icon={Crown} trend={{ value: 15, label: "vs last month" }} variant="premium" />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Upcoming + Recent Bookings */}
        <div
          className="xl:col-span-2 rounded-2xl border overflow-hidden"
          style={{ background: "linear-gradient(145deg, #181312 0%, #1e1614 100%)", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 28px rgba(0,0,0,0.55)" }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div>
              <h2 className="font-semibold font-display text-foreground" style={{ fontSize: "15px", letterSpacing: "-0.012em" }}>
                Upcoming Bookings
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5" style={{ opacity: 0.70 }}>
                Next scheduled sessions
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground"
              style={{ color: "#e8a0a8" }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {data.upcomingBookings.length > 0 ? (
            <div>
              {data.upcomingBookings.map((booking, i) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors duration-150 hover:bg-[rgba(122,12,28,0.06)]"
                  style={{ borderBottom: i < data.upcomingBookings.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl shrink-0" style={{ background: "rgba(122,12,28,0.20)", color: "#e8a0a8" }}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{booking.client.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5" style={{ opacity: 0.75 }}>
                      {booking.service?.name || "Session"} · {formatRelativeDate(booking.date)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3.5 rounded-2xl mb-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <CalendarDays className="h-6 w-6" style={{ color: "rgba(138,127,120,0.50)" }} />
              </div>
              <p className="text-sm text-muted-foreground" style={{ opacity: 0.70 }}>No upcoming bookings</p>
            </div>
          )}

          {/* Recent Activity */}
          {data.recentBookings.length > 0 && (
            <>
              <div className="px-6 py-3 border-y" style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.055)" }}>
                <p className="section-label" style={{ letterSpacing: "0.10em" }}>Recent Activity</p>
              </div>
              <div>
                {data.recentBookings.slice(0, 3).map((booking, i) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 px-6 py-3.5 transition-colors duration-150 hover:bg-[rgba(255,255,255,0.025)]"
                    style={{ borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.035)" : "none" }}
                  >
                    <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "rgba(138,127,120,0.60)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground truncate">{booking.client.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5" style={{ opacity: 0.65 }}>
                        {booking.service?.name || "Session"} · {formatRelativeDate(booking.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {booking.service?.price && (
                        <span className="text-[13px] font-semibold tabular-nums" style={{ color: "#cbbfb6" }}>
                          {formatCurrency(booking.service.price)}
                        </span>
                      )}
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Membership Mix */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "linear-gradient(145deg, #181312 0%, #1e1614 100%)", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 28px rgba(0,0,0,0.55)" }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h2 className="font-semibold font-display text-foreground" style={{ fontSize: "15px", letterSpacing: "-0.012em" }}>
                Membership Mix
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5" style={{ opacity: 0.65 }}>
                {data.activeMemberships} active subscribers
              </p>
            </div>

            <div className="p-5 space-y-4">
              {(["Normal", "VIP", "Premium"] as const).map((tier) => {
                const count = data.membershipBreakdown[tier] || 0;
                const pct = data.activeMemberships > 0
                  ? Math.round((count / data.activeMemberships) * 100)
                  : 0;
                const barColors = {
                  Normal:  "rgba(138,127,120,0.55)",
                  VIP:     "linear-gradient(90deg, #b11226, rgba(177,18,38,0.60))",
                  Premium: "linear-gradient(90deg, #d4af37, rgba(212,175,55,0.55))",
                };
                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <MembershipBadge level={tier} size="sm" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground tabular-nums" style={{ letterSpacing: "-0.01em" }}>
                          {count}
                        </span>
                        <span className="text-[11px] text-muted-foreground" style={{ opacity: 0.55 }}>({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: barColors[tier] }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 pb-5">
              <Link
                href="/admin/memberships"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border hover:bg-white/[0.05] hover:text-foreground hover:border-white/[0.12]"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#8a7f78" }}
              >
                Manage memberships
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className="rounded-2xl border p-5"
            style={{ background: "linear-gradient(145deg, #181312 0%, #1e1614 100%)", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 28px rgba(0,0,0,0.55)" }}
          >
            <h2 className="font-semibold font-display text-foreground mb-3.5" style={{ fontSize: "15px", letterSpacing: "-0.012em" }}>
              Quick Actions
            </h2>
            <div className="space-y-1">
              {[
                { label: "New Booking",    href: "/admin/bookings?new=true", iconStyle: { background: "rgba(122,12,28,0.25)", color: "#e8a0a8" },  icon: CalendarDays },
                { label: "Add Client",     href: "/admin/clients?new=true",  iconStyle: { background: "rgba(10,80,45,0.25)",  color: "#4ade80" },   icon: Users },
                { label: "Upload Content", href: "/admin/content?new=true",  iconStyle: { background: "rgba(180,140,20,0.22)",color: "#d4af37" },   icon: Sparkles },
                { label: "View Members",   href: "/admin/users",             iconStyle: { background: "rgba(20,40,100,0.28)", color: "#7eb0f0" },   icon: Crown },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group hover:bg-white/[0.048]"
                  >
                    <div className="p-2 rounded-lg shrink-0" style={action.iconStyle}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground flex-1" style={{ letterSpacing: "-0.008em" }}>
                      {action.label}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: "#8a7f78" }} />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Studio Tip */}
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{ background: "linear-gradient(145deg, #1e0a10 0%, #150608 100%)", border: "1px solid rgba(122,12,28,0.28)", boxShadow: "0 4px 24px rgba(122,12,28,0.18)" }}
          >
            <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(177,18,38,0.14)" }} />
            <div className="absolute -bottom-8 -left-8 h-20 w-20 rounded-full blur-2xl pointer-events-none" style={{ background: "rgba(212,175,55,0.07)" }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="h-3.5 w-3.5" style={{ color: "#d4af37" }} />
                <span className="text-[10px] font-bold uppercase tracking-[0.11em]" style={{ color: "rgba(212,175,55,0.80)" }}>
                  Studio Tip
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(245,237,230,0.72)" }}>
                Follow up with clients 24 hours before their session to reduce no-shows
                and build stronger relationships.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
