import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  clientId: z.string().optional(),
  serviceId: z.string().nullable().optional(),
  date: z.string().optional(),
  duration: z.number().int().min(15).optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const data: any = { ...parsed.data };
  if (data.date) data.date = new Date(data.date);

  const booking = await prisma.booking.update({
    where: { id: params.id },
    data,
    include: { client: true, service: true },
  });

  return NextResponse.json({ data: booking });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
