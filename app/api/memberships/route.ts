import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeMembershipEndDate } from "@/lib/membership-duration";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plans = await prisma.membershipPlan.findMany({
    include: {
      _count: { select: { userMemberships: true } },
      userMemberships: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, name: true, email: true } } },
        take: 5,
      },
    },
    orderBy: { level: "asc" },
  });

  return NextResponse.json({ data: plans });
}

// Assign membership to user (admin)
const assignSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["ACTIVE", "CANCELLED", "EXPIRED", "PENDING"]).default("ACTIVE"),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { userId, planId, startDate: startDateRaw, endDate: endDateRaw, status } = parsed.data;

  // Cancel any existing active membership
  await prisma.userMembership.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "CANCELLED", endDate: new Date() },
  });

  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const startDate = startDateRaw ? new Date(startDateRaw) : new Date();
  // Use caller-supplied endDate if provided; otherwise compute from billingCycle
  const endDate = endDateRaw
    ? new Date(endDateRaw)
    : computeMembershipEndDate(startDate, plan.billingCycle);

  const membership = await prisma.userMembership.create({
    data: {
      userId,
      planId,
      startDate,
      endDate,
      status,
    },
    include: { plan: true, user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: membership }, { status: 201 });
}
