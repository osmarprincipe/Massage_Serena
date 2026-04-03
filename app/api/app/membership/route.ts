import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const [activeMembership, allPlans, history] = await Promise.all([
    prisma.userMembership.findFirst({
      where: { userId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { level: "asc" },
    }),
    prisma.userMembership.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    data: { activeMembership, allPlans, history },
  });
}
