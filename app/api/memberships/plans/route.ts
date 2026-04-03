import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMembershipPlan } from "@/lib/stripe-sync";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  billingCycle: z.enum(["MONTHLY", "WEEKLY"]).default("MONTHLY"),
  level: z.coerce.number().int().min(1, "Level must be at least 1"),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { features, ...rest } = parsed.data;

  console.log(`[POST /memberships/plans] Creating plan: ${rest.name} level=${rest.level} price=${rest.price}`);

  // ── Step 1: Create plan in DB ─────────────────────────────────────────────
  let plan = await prisma.membershipPlan.create({
    data: {
      ...rest,
      features: JSON.stringify(features),
    },
  });
  console.log(`[POST /memberships/plans] Plan created: id=${plan.id}`);

  // ── Step 2: Sync with Stripe ──────────────────────────────────────────────
  let syncedStripeIds: { stripeProductId: string; stripePriceId: string } | null = null;
  let stripeSyncError: string | null = null;

  try {
    syncedStripeIds = await syncMembershipPlan({
      id: plan.id,
      name: plan.name,
      description: plan.description ?? null,
      price: plan.price,
      billingCycle: plan.billingCycle,
      stripeProductId: null,
      stripePriceId: null,
    });
    console.log(`[POST /memberships/plans] Stripe sync OK:`, syncedStripeIds);
  } catch (err) {
    stripeSyncError = err instanceof Error ? err.message : String(err);
    console.error(`[POST /memberships/plans] Stripe sync FAILED:`, stripeSyncError);
  }

  // ── Step 3: Persist Stripe IDs back to DB ────────────────────────────────
  if (syncedStripeIds) {
    let dbUpdated = false;
    try {
      plan = await prisma.membershipPlan.update({
        where: { id: plan.id },
        data: {
          stripeProductId: syncedStripeIds.stripeProductId,
          stripePriceId: syncedStripeIds.stripePriceId,
        },
      });
      dbUpdated = true;
      console.log(`[POST /memberships/plans] Stripe IDs saved via ORM`);
    } catch (ormErr) {
      console.error(`[POST /memberships/plans] ORM update failed (stale Prisma client):`, ormErr);
    }

    if (!dbUpdated) {
      try {
        const now = new Date().toISOString();
        await prisma.$executeRaw`
          UPDATE "MembershipPlan"
          SET "stripeProductId" = ${syncedStripeIds.stripeProductId},
              "stripePriceId"   = ${syncedStripeIds.stripePriceId},
              "updatedAt"       = ${now}
          WHERE "id" = ${plan.id}
        `;
        const fresh = await prisma.membershipPlan.findUnique({ where: { id: plan.id } });
        if (fresh) plan = fresh;
        console.log(`[POST /memberships/plans] Stripe IDs saved via raw SQL`);
      } catch (rawErr) {
        console.error(`[POST /memberships/plans] Raw SQL fallback also failed:`, rawErr);
      }
    }
  }

  return NextResponse.json({
    data: plan,
    stripeIds: syncedStripeIds ?? undefined,
    stripeSyncError: stripeSyncError ?? undefined,
  }, { status: 201 });
}
