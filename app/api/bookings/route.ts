import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bookingSchema = z.object({
  clientId: z.string().optional(),
  serviceId: z.string().optional(),
  date: z.string(),
  duration: z.number().int().min(15),
  notes: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).default("PENDING"),
  // New client fields
  newClient: z
    .object({
      name: z.string().min(1),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
    })
    .optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (status) where.status = status;
  if (clientId) where.clientId = clientId;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { client: { name: { contains: search } } },
      { service: { name: { contains: search } } },
      { notes: { contains: search } },
    ];
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true, price: true } },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({ data: bookings, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { clientId, newClient, serviceId, date, duration, notes, status } = parsed.data;

  let resolvedClientId = clientId;

  // Create new client if needed
  if (!clientId && newClient) {
    const client = await prisma.client.create({
      data: {
        name: newClient.name,
        email: newClient.email || null,
        phone: newClient.phone || null,
      },
    });
    resolvedClientId = client.id;
  }

  if (!resolvedClientId) {
    return NextResponse.json({ error: "Client is required" }, { status: 400 });
  }

  const booking = await prisma.booking.create({
    data: {
      clientId: resolvedClientId,
      serviceId: serviceId || null,
      date: new Date(date),
      duration,
      notes: notes || null,
      status,
    },
    include: {
      client: true,
      service: true,
    },
  });

  return NextResponse.json({ data: booking }, { status: 201 });
}
