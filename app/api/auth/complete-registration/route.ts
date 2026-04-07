import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { linkUserToClient } from "@/lib/link-user-client";
import { computeMembershipEndDate } from "@/lib/membership-duration";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { token, name, phone, password } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  console.log(`[complete-registration] Attempting registration with token=${token}`);

  const user = await prisma.user.findUnique({
    where: { registrationToken: token },
  });

  if (!user) {
    console.warn(`[complete-registration] No user found for token=${token}`);
    return NextResponse.json({ error: "Invalid or expired registration link" }, { status: 400 });
  }

  console.log(`[complete-registration] Found user id=${user.id} email=${user.email} status=${user.status}`);

  if (user.registrationExpires && user.registrationExpires < new Date()) {
    console.warn(`[complete-registration] Token expired for user ${user.id} (expired ${user.registrationExpires.toISOString()})`);
    return NextResponse.json({ error: "Registration link has expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const resolvedName = name || user.name;
  const resolvedPhone = phone || user.phone;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: resolvedName,
      phone: resolvedPhone,
      passwordHash,
      status: "ACTIVE",
      emailVerified: new Date(),
      registrationToken: null,
      registrationExpires: null,
    },
  });
  console.log(`[complete-registration] ✓ User ${user.id} activated`);

  // Link or create Client record
  await linkUserToClient({
    userId: user.id,
    email: user.email,
    name: resolvedName ?? null,
    phone: resolvedPhone ?? null,
  });

  // Activate any PENDING memberships — fetch with plan so we can compute endDate per billingCycle
  const pendingMemberships = await prisma.userMembership.findMany({
    where: { userId: user.id, status: "PENDING" },
    include: { plan: true },
  });

  const activationDate = new Date();
  await Promise.all(
    pendingMemberships.map((m) =>
      prisma.userMembership.update({
        where: { id: m.id },
        data: {
          status: "ACTIVE",
          startDate: activationDate,
          endDate: computeMembershipEndDate(activationDate, m.plan.billingCycle),
        },
      })
    )
  );
  console.log(`[complete-registration] Activated ${pendingMemberships.length} pending membership(s) for user ${user.id}`);

  return NextResponse.json({
    message: "Account activated successfully",
    activatedMemberships: pendingMemberships.length,
  });
}
