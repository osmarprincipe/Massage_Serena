import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  // Get user's active membership
  const activeMembership = await prisma.userMembership.findFirst({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  // Get user's individual purchases
  const purchases = await prisma.contentPurchase.findMany({
    where: { userId, status: "ACTIVE" },
    select: { contentId: true, pricePaid: true, purchasedAt: true },
  });
  const purchasedIds = new Set(purchases.map((p) => p.contentId));

  // Get the planId from active membership (if any)
  const activePlanId = activeMembership?.planId ?? null;

  // Fetch all published content with membership access info
  const allContent = await prisma.content.findMany({
    where: { status: "PUBLISHED" },
    include: {
      membershipAccess: { include: { plan: true } },
    },
    orderBy: { publishDate: "desc" },
  });

  // Classify each content item
  const classified = allContent.map((content) => {
    const includedPlanIds = content.membershipAccess.map((a) => a.planId);
    const includedInMembership = activePlanId
      ? includedPlanIds.includes(activePlanId)
      : false;
    const isPurchased = purchasedIds.has(content.id);
    const isAccessible = includedInMembership || isPurchased;

    return {
      ...content,
      isAccessible,
      includedInMembership,
      isPurchased,
      accessType: isPurchased ? "PURCHASED" : includedInMembership ? "MEMBERSHIP" : "LOCKED",
    };
  });

  const included = classified.filter((c) => c.includedInMembership && !c.isPurchased);
  const purchased = classified.filter((c) => c.isPurchased);
  const locked = classified.filter((c) => !c.isAccessible);

  return NextResponse.json({
    data: { included, purchased, locked, activeMembership },
  });
}
