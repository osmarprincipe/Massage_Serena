import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.botSettings.findFirst();
  return NextResponse.json({ data: settings });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const existing = await prisma.botSettings.findFirst();

  const settings = existing
    ? await prisma.botSettings.update({ where: { id: existing.id }, data: body })
    : await prisma.botSettings.create({ data: body });

  return NextResponse.json({ data: settings });
}
