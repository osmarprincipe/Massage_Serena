import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  // Find the client linked to this user
  const client = await prisma.client.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ data: { upcoming: [], past: [] } });
  }

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.booking.findMany({
      where: {
        clientId: client.id,
        date: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      include: { service: true },
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        clientId: client.id,
        OR: [
          { date: { lt: now } },
          { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
        ],
      },
      include: { service: true },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ data: { upcoming, past } });
}
