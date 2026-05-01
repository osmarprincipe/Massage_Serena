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
import { ContentCheckoutButton } from "@/components/shared/ContentCheckoutButton";
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
        select: { contentId: true },
      },
    },
  });

  const activeMembership = user?.memberships[0] ?? null;
  const nextBooking = user?.client?.bookings[0] ?? null;

  let allMembershipContent: any[] = [];
  if (activeMembership) {
    allMembershipContent = await prisma.content.findMany({
      where: { status: "PUBLISHED", membershipAccess: { some: { planId: activeMembership.planId } } },
      orderBy: { publishDate: "desc" },
    });
  }
  const membershipContent = allMembershipContent.slice(0, 3);
  const membershipContentIds = allMembershipContent.map((c) => c.id);
  const purchasedIds = (user?.purchases ?? []).map((p) => p.contentId);
  const accessibleIds = [...new Set([...membershipContentIds, ...purchasedIds])];

  const lockedTeaser = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      separatePurchaseEnabled: true,
      id: { notIn: accessibleIds },
    },
    take: 2,
    orderBy: { publishDate: "desc" },
  });

  return { user, activeMembership, nextBooking, membershipContent, lockedTeaser };
}

const mediaTypeColors: Record<string, React.CSSProperties> = {
  VIDEO: { background: "rgba(122,12,28,0.30)", color: "#f0b8c0" },
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
    <div className="px-6 py-8 max-w-5xl mx-auto space-y-8 animate-fade-in">

      {/* ── Hero Welcome ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 plan-card-glass"
        style={{
          background: "rgba(16,6,10,0.78)",
          border: "1px solid rgba(122,12,28,0.28)",
          boxShadow: "0 8px 48px rgba(122,12,28,0.22), 0 2px 10px rgba(0,0,0,0.55)",
        }}
      >
        {/* Ambient glows */}
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl pointer-events-none"
          style={{ background: "rgba(177,18,38,0.14)" }} />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-2xl pointer-events-none"
          style={{ background: "rgba(212,175,55,0.06)" }} />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-3">
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5">
              <div style={{ width: "16px", height: "1.5px", background: "rgba(198,161,91,0.50)" }} />
              <p className="text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: "rgba(198,161,91,0.65)" }}>
                {greeting}
              </p>
            </div>

            <h1
              className="text-[2rem] font-bold font-display tracking-tight leading-none"
              style={{ color: "#f5ede6", letterSpacing: "-0.022em" }}
            >
              {displayName.split(" ")[0]}
              <span style={{ color: "rgba(212,175,55,0.65)", marginLeft: "6px" }}>✦</span>
            </h1>

            {activeMembership ? (
              <div className="flex items-center gap-2.5 pt-0.5">
                <MembershipBadge planLevel={activeMembership.plan.level} planName={activeMembership.plan.name} size="md" />
                <span className="text-xs" style={{ color: "rgba(245,237,230,0.45)" }}>
                  since {formatDate(activeMembership.startDate, "MMMM yyyy")}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-sm" style={{ color: "rgba(245,237,230,0.45)" }}>
                  No active membership
                </span>
                <Link
                  href="/payment"
                  className="text-sm font-semibold transition-colors hover:text-[#f0d98a]"
                  style={{ color: "#d4af37" }}
                >
                  Get started →
                </Link>
              </div>
            )}
          </div>

          {/* Avatar */}
          <div
            className="shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center text-lg font-bold font-display border"
            style={{
              background: "rgba(122,12,28,0.28)",
              borderColor: "rgba(177,18,38,0.22)",
              color: "#f0b8c0",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {getInitials(displayName)}
          </div>
        </div>
      </div>

      {/* ── Summary Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Membership */}
        <Link href="/app/membership" className="group block">
          <div
            className="h-full rounded-2xl border p-5 plan-card-glass transition-all duration-300 hover:-translate-y-0.5 [box-shadow:0_4px_22px_rgba(0,0,0,0.52)] hover:[box-shadow:0_16px_48px_rgba(0,0,0,0.68),0_4px_16px_rgba(212,175,55,0.10)] hover:border-[rgba(212,175,55,0.12)]"
            style={{
              background: "rgba(14,8,11,0.82)",
              borderColor: "rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: "rgba(180,140,20,0.18)", color: "#d4af37" }}>
                <Crown className="h-4.5 w-4.5" style={{ height: "18px", width: "18px" }} />
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#8a7f78" }} />
            </div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground mb-1.5"
              style={{ opacity: 0.70 }}
            >
              Membership
            </p>
            {activeMembership ? (
              <>
                <p className="text-[17px] font-bold font-display text-foreground" style={{ letterSpacing: "-0.015em" }}>
                  {activeMembership.plan.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1" style={{ opacity: 0.60 }}>
                  {activeMembership.endDate
                    ? `Renews ${formatDate(activeMembership.endDate)}`
                    : "Active · auto-renewing"}
                </p>
              </>
            ) : (
              <>
                <p className="text-[17px] font-bold font-display text-foreground" style={{ letterSpacing: "-0.015em" }}>No Plan</p>
                <p className="text-xs mt-1 font-medium" style={{ color: "#e8a0a8" }}>Upgrade now →</p>
              </>
            )}
          </div>
        </Link>

        {/* Next Booking */}
        <Link href="/app/bookings" className="group block">
          <div
            className="h-full rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 [box-shadow:0_4px_22px_rgba(0,0,0,0.52)] hover:[box-shadow:0_16px_48px_rgba(0,0,0,0.68),0_4px_16px_rgba(122,12,28,0.12)] hover:border-[rgba(122,12,28,0.16)]"
            style={{
              background: "linear-gradient(145deg, #181312 0%, #1e1614 100%)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: "rgba(122,12,28,0.22)", color: "#e8a0a8" }}>
                <Calendar className="h-4.5 w-4.5" style={{ height: "18px", width: "18px" }} />
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#8a7f78" }} />
            </div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground mb-1.5"
              style={{ opacity: 0.70 }}
            >
              Next Booking
            </p>
            {nextBooking ? (
              <>
                <p className="text-[17px] font-bold font-display text-foreground" style={{ letterSpacing: "-0.015em" }}>
                  {nextBooking.service?.name || "Session"}
                </p>
                <p className="text-xs text-muted-foreground mt-1" style={{ opacity: 0.60 }}>
                  {formatRelativeDate(nextBooking.date)}
                </p>
              </>
            ) : (
              <>
                <p className="text-[17px] font-bold font-display text-foreground" style={{ letterSpacing: "-0.015em" }}>None</p>
                <p className="text-xs text-muted-foreground mt-1" style={{ opacity: 0.60 }}>No upcoming sessions</p>
              </>
            )}
          </div>
        </Link>

        {/* Content */}
        <Link href="/app/content" className="group block">
          <div
            className="h-full rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-0.5 [box-shadow:0_4px_22px_rgba(0,0,0,0.52)] hover:[box-shadow:0_16px_48px_rgba(0,0,0,0.68),0_4px_16px_rgba(122,12,28,0.12)] hover:border-[rgba(122,12,28,0.14)]"
            style={{
              background: "linear-gradient(145deg, #181312 0%, #1e1614 100%)",
              borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: "rgba(40,35,32,0.80)", color: "#cbbfb6" }}>
                <PlaySquare className="h-4.5 w-4.5" style={{ height: "18px", width: "18px" }} />
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: "#8a7f78" }} />
            </div>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.10em] text-muted-foreground mb-1.5"
              style={{ opacity: 0.70 }}
            >
              Content
            </p>
            <p className="text-[17px] font-bold font-display text-foreground" style={{ letterSpacing: "-0.015em" }}>
              {membershipContent.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1" style={{ opacity: 0.60 }}>
              {membershipContent.length === 1 ? "item" : "items"} available to you
            </p>
          </div>
        </Link>
      </div>

      {/* ── Available Content ── */}
      {membershipContent.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-[17px] font-semibold font-display text-foreground"
              style={{ letterSpacing: "-0.015em" }}
            >
              Available to You
            </h2>
            <Link
              href="/app/content"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground"
              style={{ color: "#e8a0a8" }}
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {membershipContent.map((item) => (
              <div
                key={item.id}
                className="group rounded-2xl border overflow-hidden plan-card-glass transition-all duration-[350ms] ease-out hover:-translate-y-1 [box-shadow:0_4px_22px_rgba(0,0,0,0.50)] hover:[box-shadow:0_20px_60px_rgba(0,0,0,0.70),0_6px_22px_rgba(122,12,28,0.18)] hover:border-[rgba(122,12,28,0.25)]"
                style={{
                  background: "rgba(12,7,9,0.84)",
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              >
                {/* Thumbnail */}
                <div className="relative h-36 overflow-hidden"
                  style={{ background: "linear-gradient(145deg, #1e0a10, #211916)" }}>
                  {item.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover brightness-75 contrast-105 saturate-90 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PlaySquare className="h-9 w-9" style={{ color: "rgba(138,127,120,0.40)" }} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/[0.05] to-transparent" />
                  {/* Media type badge */}
                  <span
                    className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm"
                    style={mediaTypeColors[item.mediaType] || { background: "rgba(40,35,32,0.90)", color: "#8a7f78" }}
                  >
                    {item.mediaType}
                  </span>
                  {/* Included badge */}
                  <div
                    className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                    style={{ background: "rgba(10,72,40,0.88)", color: "#4ade80" }}
                  >
                    Included
                  </div>
                </div>
                {/* Info */}
                <div className="p-3.5">
                  <p
                    className="text-sm font-semibold text-foreground line-clamp-1"
                    style={{ letterSpacing: "-0.008em" }}
                  >
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed" style={{ opacity: 0.70 }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Locked Premium Teaser ── */}
      {lockedTeaser.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2
              className="text-[17px] font-semibold font-display text-foreground"
              style={{ letterSpacing: "-0.015em" }}
            >
              Unlock More
            </h2>
            <Link
              href="/app/content"
              className="flex items-center gap-1 text-xs font-medium transition-colors hover:text-foreground"
              style={{ color: "#e8a0a8" }}
            >
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lockedTeaser.map((item) => (
              <div
                key={item.id}
                className="relative rounded-2xl border overflow-hidden"
                style={{
                  background: "rgba(12,7,9,0.84)",
                  borderColor: "rgba(255,255,255,0.07)",
                  boxShadow: "0 4px 22px rgba(0,0,0,0.50)",
                }}
              >
                {/* Blurred thumbnail */}
                <div className="relative h-32" style={{ background: "linear-gradient(145deg, #1e0a10, #211916)" }}>
                  {item.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover opacity-35 brightness-50"
                    />
                  )}
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(15,11,10,0.45)", backdropFilter: "blur(3px)" }}
                  >
                    <div
                      className="p-3 rounded-full border"
                      style={{ background: "rgba(122,12,28,0.28)", borderColor: "rgba(177,18,38,0.32)" }}
                    >
                      <Lock className="h-5 w-5" style={{ color: "#e8a0a8" }} />
                    </div>
                  </div>
                </div>
                {/* Info + purchase */}
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold text-foreground truncate"
                      style={{ letterSpacing: "-0.008em" }}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1" style={{ opacity: 0.65 }}>
                      {item.description}
                    </p>
                  </div>
                  {item.separatePurchasePrice && (
                    <ContentCheckoutButton
                      contentId={item.id}
                      label={formatCurrency(item.separatePurchasePrice)}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Upgrade CTA ── */}
      {activeMembership && (
        <div
          className="relative overflow-hidden rounded-2xl p-6 plan-card-glass"
          style={{
            background: "rgba(14,10,4,0.82)",
            border: "1px solid rgba(212,175,55,0.18)",
            boxShadow: "0 4px 28px rgba(212,175,55,0.07)",
          }}
        >
          <div
            className="absolute -top-10 -right-10 h-36 w-36 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(212,175,55,0.12)" }}
          />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl shrink-0"
                style={{ background: "rgba(212,175,55,0.14)", color: "#d4af37" }}
              >
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p
                  className="font-semibold text-foreground"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  Upgrade your membership
                </p>
                <p className="text-sm text-muted-foreground mt-0.5" style={{ opacity: 0.70 }}>
                  Exclusive content and priority booking access
                </p>
              </div>
            </div>
            <Link
              href="/app/membership"
              className="shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-px hover:brightness-[1.08] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #9a7a1a 0%, #d4af37 100%)",
                color: "#0f0b0a",
                boxShadow: "0 2px 14px rgba(212,175,55,0.28)",
                letterSpacing: "0.01em",
              }}
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
