import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const albumSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  publishDate: z.string().optional(),
  separatePurchaseEnabled: z.boolean().default(false),
  separatePurchasePrice: z.number().optional(),
  planIds: z.array(z.string()).default([]),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search") || "";

  const where: any = {};
  if (status) where.status = status;
  if (search) where.title = { contains: search };

  const albums = await prisma.album.findMany({
    where,
    include: {
      membershipAccess: { include: { plan: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: albums });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = albumSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { planIds, publishDate, ...data } = parsed.data;

  const album = await prisma.album.create({
    data: {
      ...data,
      publishDate: publishDate ? new Date(publishDate) : null,
      membershipAccess: {
        create: planIds.map((planId) => ({ planId })),
      },
    },
    include: {
      membershipAccess: { include: { plan: true } },
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ data: album }, { status: 201 });
}
