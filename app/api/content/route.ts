import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncContentProduct } from "@/lib/stripe-sync";
import { z } from "zod";

const contentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  mediaType: z.enum(["VIDEO", "AUDIO", "IMAGE", "PDF", "TEXT"]).default("VIDEO"),
  contentUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
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
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where: any = {};
  if (status) where.status = status;
  if (search) where.title = { contains: search };

  const [content, total] = await Promise.all([
    prisma.content.findMany({
      where,
      include: {
        membershipAccess: { include: { plan: true } },
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.content.count({ where }),
  ]);

  return NextResponse.json({ data: content, total, page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { planIds, publishDate, ...data } = parsed.data;

  let content = await prisma.content.create({
    data: {
      ...data,
      publishDate: publishDate ? new Date(publishDate) : null,
      membershipAccess: {
        create: planIds.map((planId) => ({ planId })),
      },
    },
    include: { membershipAccess: { include: { plan: true } } },
  });

  // Auto-sync with Stripe when separate purchase is enabled with a price
  if (content.separatePurchaseEnabled && content.separatePurchasePrice) {
    try {
      const stripeIds = await syncContentProduct({
        id: content.id,
        title: content.title,
        description: content.description,
        separatePurchasePrice: content.separatePurchasePrice,
        stripeProductId: content.stripeProductId,
        stripePriceId: content.stripePriceId,
      });
      content = await prisma.content.update({
        where: { id: content.id },
        data: {
          stripeProductId: stripeIds.stripeProductId,
          stripePriceId: stripeIds.stripePriceId,
        },
        include: { membershipAccess: { include: { plan: true } } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[api/content] Stripe sync failed:", message);
    }
  }

  return NextResponse.json({ data: content }, { status: 201 });
}
