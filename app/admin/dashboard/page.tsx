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
  CheckCircle,
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
    <div className="space-y-8 max-w-7xl">
      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{greeting},</p>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
            {session?.user?.name?.split(" ")[0] || "Studio Admin"} ✦
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Here&apos;s what&apos;s happening at Serene Studio today.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl border"
          style={{ background: "rgba(122,12,28,0.12)", borderColor: "rgba(177,18,38,0.20)" }}>
          <Sparkles className="h-4 w-4" style={{ color: "#d4af37" }} />
          <span className="text-sm font-medium text-foreground">
            {formatDate(new Date(), "EEEE, MMMM d")}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Bookings"
          value={data.todayBookings}
          subtitle="Scheduled sessions"
          icon={CalendarDays}
          trend={{ value: 12, label: "vs last week" }}
          variant="accent"
        />
        <StatCard
          title="Active Members"
          value={data.activeUsers}
          subtitle="Registered accounts"
          icon={UserCircle}
          trend={{ value: 8, label: "this month" }}
        />
        <StatCard
          title="Total Clients"
          value={data.totalClients}
          subtitle="Client profiles"
          icon={Users}
          trend={{ value: 5, label: "new this month" }}
        />
        <StatCard
          title="Active Memberships"
          value={data.activeMemberships}
          subtitle="Paid subscribers"
          icon={Crown}
          trend={{ value: 15, label: "vs last month" }}
          variant="premium"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Upcoming Bookings */}
        <div className="xl:col-span-2 rounded-2xl border overflow-hidden"
          style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.50)" }}>
          <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div>
              <h2 className="font-semibold font-display text-foreground">Upcoming Bookings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Next scheduled sessions</p>
            </div>
            <Link
              href="/admin/bookings"
              className="flex items-center gap-1.5 text-xs font-medium hover:underline"
              style={{ color: "#e8a0a8" }}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {data.upcomingBookings.length > 0 ? (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              {data.upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(122,12,28,0.07)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-xl shrink-0"
                    style={{ background: "rgba(122,12,28,0.20)", color: "#e8a0a8" }}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {booking.client.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {booking.service?.name || "Session"} · {formatRelativeDate(booking.date)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-2xl mb-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                <CalendarDays className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">No upcoming bookings</p>
            </div>
          )}

          {/* Recent Bookings Section */}
          {data.recentBookings.length > 0 && (
            <>
              <div className="px-6 py-3 border-y" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Activity
                </p>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {data.recentBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-4 px-6 py-3.5 transition-colors"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="flex items-center justify-center h-8 w-8 rounded-full shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{booking.client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.service?.name || "Session"} · {formatRelativeDate(booking.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {booking.service?.price && (
                        <span className="text-sm font-medium text-foreground">
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* Membership Summary */}
          <div className="rounded-2xl border overflow-hidden"
            style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.50)" }}>
            <div className="px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <h2 className="font-semibold font-display text-foreground">Membership Breakdown</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {data.activeMemberships} active subscribers
              </p>
            </div>
            <div className="p-6 space-y-4">
              {(["Normal", "VIP", "Premium"] as const).map((tier) => {
                const count = data.membershipBreakdown[tier] || 0;
                const pct =
                  data.activeMemberships > 0
                    ? Math.round((count / data.activeMemberships) * 100)
                    : 0;
                const barColors = {
                  Normal: "rgba(138,127,120,0.60)",
                  VIP: "rgba(177,18,38,0.70)",
                  Premium: "#d4af37",
                };
                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <MembershipBadge level={tier} size="sm" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{count}</span>
                        <span className="text-xs text-muted-foreground">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: barColors[tier] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-6 pb-5">
              <Link
                href="/admin/memberships"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "transparent" }}
                onMouseEnter={undefined}
              >
                Manage memberships
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border p-6"
            style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 24px rgba(0,0,0,0.50)" }}>
            <h2 className="font-semibold font-display text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "New Booking",    href: "/admin/bookings?new=true", icon: CalendarDays, iconStyle: { background: "rgba(122,12,28,0.25)", color: "#e8a0a8" } },
                { label: "Add Client",     href: "/admin/clients?new=true",  icon: Users,        iconStyle: { background: "rgba(10,80,45,0.25)", color: "#4ade80" } },
                { label: "Upload Content", href: "/admin/content?new=true",  icon: Sparkles,     iconStyle: { background: "rgba(180,140,20,0.20)", color: "#d4af37" } },
                { label: "View Members",   href: "/admin/users",             icon: Crown,        iconStyle: { background: "rgba(20,40,100,0.25)", color: "#7eb0f0" } },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="p-2 rounded-lg" style={action.iconStyle}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Studio Tip */}
          <div className="relative overflow-hidden rounded-2xl p-6"
            style={{ background: "linear-gradient(145deg, #1e0a10 0%, #150608 100%)", border: "1px solid rgba(122,12,28,0.30)", boxShadow: "0 4px 24px rgba(122,12,28,0.20)" }}>
            <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-3xl" style={{ background: "rgba(177,18,38,0.15)" }} />
            <div className="absolute -bottom-6 -left-6 h-16 w-16 rounded-full blur-2xl" style={{ background: "rgba(212,175,55,0.08)" }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" style={{ color: "#d4af37" }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#d4af37" }}>
                  Studio Tip
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(245,237,230,0.75)" }}>
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
