import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

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

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const activeMembership = user.memberships[0] ?? null;

  // Get content accessible via membership
  let accessibleContent: any[] = [];
  if (activeMembership) {
    accessibleContent = await prisma.content.findMany({
      where: {
        status: "PUBLISHED",
        membershipAccess: { some: { planId: activeMembership.planId } },
      },
      take: 3,
      orderBy: { publishDate: "desc" },
    });
  }

  // Get some locked/purchasable content as a teaser
  const purchasedIds = user.purchases.map((p) => p.contentId);
  const accessibleIds = accessibleContent.map((c) => c.id);
  const lockedContent = await prisma.content.findMany({
    where: {
      status: "PUBLISHED",
      separatePurchaseEnabled: true,
      id: { notIn: [...purchasedIds, ...accessibleIds] },
    },
    take: 2,
    orderBy: { publishDate: "desc" },
  });

  return NextResponse.json({
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        client: user.client
          ? { id: user.client.id, name: user.client.name }
          : null,
      },
      membership: activeMembership,
      nextBooking: user.client?.bookings[0] ?? null,
      recentContent: accessibleContent,
      recentPurchases: user.purchases,
      lockedTeaser: lockedContent,
    },
  });
}
