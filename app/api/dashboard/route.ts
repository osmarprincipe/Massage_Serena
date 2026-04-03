import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const [
    todayBookingsCount,
    activeUsersCount,
    totalClientsCount,
    activeMembershipsCount,
    recentBookings,
    membershipBreakdown,
    upcomingBookings,
  ] = await Promise.all([
    prisma.booking.count({
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
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
    prisma.userMembership.groupBy({
      by: ["planId"],
      where: { status: "ACTIVE" },
      _count: true,
    }),
    prisma.booking.findMany({
      where: {
        date: { gte: today },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      take: 3,
      orderBy: { date: "asc" },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  // Get plan names for membership breakdown
  const plans = await prisma.membershipPlan.findMany({
    where: { id: { in: membershipBreakdown.map((m) => m.planId) } },
    select: { id: true, name: true },
  });

  const planMap = Object.fromEntries(plans.map((p) => [p.id, p.name]));
  const breakdown = { Normal: 0, VIP: 0, Premium: 0 };
  membershipBreakdown.forEach((m) => {
    const name = planMap[m.planId] as keyof typeof breakdown;
    if (name in breakdown) breakdown[name] = m._count;
  });

  return NextResponse.json({
    data: {
      todayBookings: todayBookingsCount,
      activeUsers: activeUsersCount,
      totalClients: totalClientsCount,
      activeMemberships: activeMembershipsCount,
      recentBookings,
      upcomingBookings,
      membershipBreakdown: breakdown,
    },
  });
}
