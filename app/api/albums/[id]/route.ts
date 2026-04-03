import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  coverImageUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  publishDate: z.string().optional(),
  separatePurchaseEnabled: z.boolean().optional(),
  separatePurchasePrice: z.number().optional(),
  planIds: z.array(z.string()).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const album = await prisma.album.findUnique({
    where: { id: params.id },
    include: {
      membershipAccess: { include: { plan: true } },
      items: { orderBy: { sortOrder: "asc" } },
      _count: { select: { items: true } },
    },
  });

  if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  return NextResponse.json({ data: album });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { planIds, publishDate, ...data } = parsed.data;

  const album = await prisma.album.update({
    where: { id: params.id },
    data: {
      ...data,
      publishDate: publishDate ? new Date(publishDate) : undefined,
      ...(planIds !== undefined && {
        membershipAccess: {
          deleteMany: {},
          create: planIds.map((planId) => ({ planId })),
        },
      }),
    },
    include: {
      membershipAccess: { include: { plan: true } },
      items: { orderBy: { sortOrder: "asc" } },
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ data: album });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.album.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Album deleted" });
}
