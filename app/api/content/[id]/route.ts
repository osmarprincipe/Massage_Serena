import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncContentProduct } from "@/lib/stripe-sync";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  mediaType: z.enum(["VIDEO", "AUDIO", "IMAGE", "PDF", "TEXT"]).optional(),
  contentUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  publishDate: z.string().optional(),
  separatePurchaseEnabled: z.boolean().optional(),
  separatePurchasePrice: z.number().optional(),
  planIds: z.array(z.string()).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { planIds, publishDate, ...data } = parsed.data;

  let content = await prisma.content.update({
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

      if (
        stripeIds.stripeProductId !== content.stripeProductId ||
        stripeIds.stripePriceId !== content.stripePriceId
      ) {
        content = await prisma.content.update({
          where: { id: content.id },
          data: {
            stripeProductId: stripeIds.stripeProductId,
            stripePriceId: stripeIds.stripePriceId,
          },
          include: { membershipAccess: { include: { plan: true } } },
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[api/content/${params.id}] Stripe sync failed:`, message);
    }
  }

  return NextResponse.json({ data: content });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.content.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "Deleted" });
}
