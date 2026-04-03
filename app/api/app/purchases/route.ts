import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;

  const purchases = await prisma.contentPurchase.findMany({
    where: { userId },
    include: {
      content: {
        select: {
          id: true,
          title: true,
          description: true,
          mediaType: true,
          thumbnailUrl: true,
          status: true,
        },
      },
    },
    orderBy: { purchasedAt: "desc" },
  });

  const total = purchases.reduce((sum, p) => sum + p.pricePaid, 0);

  return NextResponse.json({ data: { purchases, total } });
}
