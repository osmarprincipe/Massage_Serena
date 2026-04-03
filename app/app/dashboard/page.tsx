import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  Crown,
  Calendar,
  PlaySquare,
  ArrowRight,
  Lock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { MembershipBadge } from "@/components/shared/MembershipBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatRelativeDate, formatCurrency, getInitials } from "@/lib/utils";
import Link from "next/link";

async function getUserDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      client: {
        include: {
          bookings: {
            where: { date: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } },
            orderBy: { date: "asc" },
            take: 1,
            include: { service: true },
          },
        },
      },
      memberships: {
        where: { status: "ACTIVE" },
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      purchases: {
        include: { content: true },
        orderBy: { purchasedAt: "desc" },
        take: 3,
      },
    },
  });

  const activeMembership = user?.memberships[0] ?? null;
  const nextBooking = user?.client?.bookings[0] ?? null;

  let membershipContent: any[] = [];
  if (activeMembership) {
    membershipContent = await prisma.content.findMany({
      where: { status: "PUBLISHED", membershipAccess: { some: { planId: activeMembership.planId } } },
      take: 3,
      orderBy: { publishDate: "desc" },
    });
  }

  const purchasedIds = (user?.purchases ?? []).map((p) => p.contentId);
  const contentIds = membershipContent.map((c) => c.id);
  const lockedTeaser = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      separatePurchaseEnabled: true,
      id: { notIn: [...purchasedIds, ...contentIds] },
    },
    take: 2,
    orderBy: { publishDate: "desc" },
  });

  return { user, activeMembership, nextBooking, membershipContent, lockedTeaser };
}

const mediaTypeColors: Record<string, React.CSSProperties> = {
  VIDEO: { background: "rgba(122,12,28,0.30)", color: "#e8a0a8" },
  AUDIO: { background: "rgba(100,30,80,0.30)", color: "#d4a0cc" },
  PDF:   { background: "rgba(120,80,10,0.30)", color: "#d4a055" },
  IMAGE: { background: "rgba(180,140,20,0.22)", color: "#d4af37" },
  TEXT:  { background: "rgba(40,35,32,0.80)",   color: "#8a7f78" },
};

export default async function UserDashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id;
  const { user, activeMembership, nextBooking, membershipContent, lockedTeaser } =
    await getUserDashboardData(userId);

  const displayName = user?.name || user?.client?.name || user?.email?.split("@")[0] || "Member";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-white"
        style={{
          background: "linear-gradient(145deg, #1e0a10 0%, #0f0b0a 60%, #150608 100%)",
          border: "1px solid rgba(122,12,28,0.30)",
          boxShadow: "0 8px 48px rgba(122,12,28,0.25), 0 2px 8px rgba(0,0,0,0.50)",
        }}>
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full blur-3xl" style={{ background: "rgba(177,18,38,0.12)" }} />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full blur-2xl" style={{ background: "rgba(212,175,55,0.06)" }} />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm mb-1" style={{ color: "rgba(245,237,230,0.55)" }}>{greeting},</p>
            <h1 className="text-3xl font-bold font-display tracking-tight mb-3" style={{ color: "#f5ede6" }}>
              {displayName.split(" ")[0]} ✦
            </h1>
            {activeMembership ? (
              <div className="flex items-center gap-2.5">
                <MembershipBadge level={activeMembership.plan.name} size="md" />
                <span className="text-sm" style={{ color: "rgba(245,237,230,0.55)" }}>
                  Member since {formatDate(activeMembership.startDate, "MMMM yyyy")}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: "rgba(245,237,230,0.50)" }}>No active membership</span>
                <Link href="/payment" className="text-sm font-medium hover:underline" style={{ color: "#d4af37" }}>
                  Get started →
                </Link>
              </div>
            )}
          </div>
          <div className="shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center text-xl font-bold font-display border"
            style={{ background: "rgba(122,12,28,0.30)", borderColor: "rgba(177,18,38,0.25)", color: "#e8a0a8" }}>
            {getInitials(displayName)}
          </div>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Membership Card */}
        <Link href="/app/membership" className="group block">
          <div className="h-full rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.50)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(212,175,55,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.50)")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: "rgba(180,140,20,0.18)", color: "#d4af37" }}>
                <Crown className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Membership</p>
            {activeMembership ? (
              <>
                <p className="text-lg font-bold font-display text-foreground">{activeMembership.plan.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeMembership.endDate
                    ? `Renews ${formatDate(activeMembership.endDate)}`
                    : "Active"}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-display text-foreground">No Plan</p>
                <p className="text-xs mt-1" style={{ color: "#e8a0a8" }}>Upgrade now →</p>
              </>
            )}
          </div>
        </Link>

        {/* Next Booking */}
        <Link href="/app/bookings" className="group block">
          <div className="h-full rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.50)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.50)")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: "rgba(122,12,28,0.22)", color: "#e8a0a8" }}>
                <Calendar className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next Booking</p>
            {nextBooking ? (
              <>
                <p className="text-lg font-bold font-display text-foreground">
                  {nextBooking.service?.name || "Session"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeDate(nextBooking.date)}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-display text-foreground">None</p>
                <p className="text-xs text-muted-foreground mt-1">No upcoming sessions</p>
              </>
            )}
          </div>
        </Link>

        {/* Content */}
        <Link href="/app/content" className="group block">
          <div className="h-full rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.50)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.15)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.50)")}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: "rgba(40,35,32,0.80)", color: "#cbbfb6" }}>
                <PlaySquare className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Content</p>
            <p className="text-lg font-bold font-display text-foreground">{membershipContent.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {membershipContent.length === 1 ? "item" : "items"} available
            </p>
          </div>
        </Link>
      </div>

      {/* Available Content */}
      {membershipContent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display text-foreground">Available to You</h2>
            <Link
              href="/app/content"
              className="text-sm font-medium hover:underline flex items-center gap-1"
              style={{ color: "#e8a0a8" }}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {membershipContent.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)", boxShadow: "0 4px 20px rgba(0,0,0,0.50)" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 16px 48px rgba(0,0,0,0.65), 0 4px 16px rgba(122,12,28,0.18)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.50)")}
              >
                <div className="relative h-36 overflow-hidden" style={{ background: "linear-gradient(145deg, #1e0a10, #211916)" }}>
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover brightness-75 contrast-110 saturate-90 group-hover:scale-105 transition-transform duration-[450ms]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlaySquare className="h-10 w-10" style={{ color: "#8a7f78" }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/[0.08] to-transparent" />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-sm"
                    style={mediaTypeColors[item.mediaType] || { background: "rgba(40,35,32,0.90)", color: "#8a7f78" }}>
                    {item.mediaType}
                  </span>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-semibold"
                    style={{ background: "rgba(10,80,45,0.85)", color: "#4ade80" }}>
                    Included
                  </div>
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Premium Teaser */}
      {lockedTeaser.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display text-foreground">Unlock More</h2>
            <Link href="/app/content" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: "#e8a0a8" }}>
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lockedTeaser.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl border overflow-hidden"
                style={{ background: "#181312", borderColor: "rgba(255,255,255,0.06)" }}
              >
                <div className="relative h-32" style={{ background: "linear-gradient(145deg, #1e0a10, #211916)" }}>
                  {item.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-40 brightness-50" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(15,11,10,0.50)", backdropFilter: "blur(2px)" }}>
                    <div className="p-3 rounded-full border" style={{ background: "rgba(122,12,28,0.30)", borderColor: "rgba(177,18,38,0.35)" }}>
                      <Lock className="h-5 w-5" style={{ color: "#e8a0a8" }} />
                    </div>
                  </div>
                </div>
                <div className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                  </div>
                  {item.separatePurchasePrice && (
                    <Link
                      href="/app/content"
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg,#7a0c1c,#b11226)", color: "#f5ede6" }}
                    >
                      {formatCurrency(item.separatePurchasePrice)}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade CTA */}
      {activeMembership && activeMembership.plan.level < 3 && (
        <div className="relative overflow-hidden rounded-2xl p-6"
          style={{ background: "linear-gradient(145deg, #1a1508 0%, #110f04 100%)", border: "1px solid rgba(212,175,55,0.20)", boxShadow: "0 4px 24px rgba(212,175,55,0.08)" }}>
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full blur-2xl" style={{ background: "rgba(212,175,55,0.12)" }} />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}>
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Unlock more with {activeMembership.plan.level === 1 ? "VIP" : "Premium"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get access to exclusive content and priority booking
                </p>
              </div>
            </div>
            <Link
              href="/app/membership"
              className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #9a7a1a 0%, #d4af37 100%)", color: "#0f0b0a", boxShadow: "0 2px 12px rgba(212,175,55,0.30)" }}
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
