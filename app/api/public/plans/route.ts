import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never cache — plan active/archived status must always be current.
export const dynamic = "force-dynamic";

// Public — no auth required.
export async function GET() {
  try {
    const plans = await prisma.membershipPlan.findMany({
      select: {
        id: true,
        name: true,
        level: true,
        price: true,
        billingCycle: true,
        description: true,
        features: true,
        isPopular: true,
        isActive: true,
      },
      where: { isActive: true },
      orderBy: { level: "asc" },
    });

    return NextResponse.json({ data: plans }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("[api/public/plans] error:", err);
    return NextResponse.json({ error: "Failed to load plans", data: [] }, { status: 500 });
  }
}
