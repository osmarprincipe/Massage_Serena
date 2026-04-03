import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const info = await prisma.businessInfo.findFirst();
  return NextResponse.json({ data: info });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const existing = await prisma.businessInfo.findFirst();

  const data = {
    businessName: body.businessName,
    address: body.address || null,
    workingHours: body.workingHours ? JSON.stringify(body.workingHours) : null,
    phone: body.phone || null,
    email: body.email || null,
    description: body.description || null,
    logoUrl: body.logoUrl || null,
  };

  const info = existing
    ? await prisma.businessInfo.update({ where: { id: existing.id }, data })
    : await prisma.businessInfo.create({ data });

  return NextResponse.json({ data: info });
}
