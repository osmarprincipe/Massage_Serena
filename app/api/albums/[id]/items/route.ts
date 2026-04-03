import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const itemSchema = z.object({
  mediaUrl: z.string().min(1, "Media URL is required"),
  caption: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

const bulkSchema = z.object({
  items: z.array(itemSchema),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.albumItem.findMany({
    where: { albumId: params.id },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  // Bulk or single
  if (Array.isArray(body.items)) {
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const items = await prisma.$transaction(
      parsed.data.items.map((item) =>
        prisma.albumItem.create({ data: { ...item, albumId: params.id } })
      )
    );
    return NextResponse.json({ data: items }, { status: 201 });
  }

  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const item = await prisma.albumItem.create({
    data: { ...parsed.data, albumId: params.id },
  });

  return NextResponse.json({ data: item }, { status: 201 });
}
