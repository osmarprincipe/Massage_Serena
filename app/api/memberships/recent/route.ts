import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptions = await prisma.userMembership.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true, price: true } },
    },
  });

  return NextResponse.json({ data: subscriptions });
}
