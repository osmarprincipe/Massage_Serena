import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncMembershipPlan } from "@/lib/stripe-sync";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  price: z.coerce.number().min(0, "Price must be positive").optional(),
  billingCycle: z.enum(["MONTHLY", "WEEKLY"]).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  console.log(`[PATCH /memberships/${params.id}] payload:`, JSON.stringify(body));

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { features, ...rest } = parsed.data;

  // ── Step 1: Save plan fields to DB ────────────────────────────────────────
  let plan = await prisma.membershipPlan.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(features !== undefined ? { features: JSON.stringify(features) } : {}),
    },
  });
  console.log(`[PATCH /memberships/${params.id}] plan fields saved. current stripeProductId=${plan.stripeProductId}`);

  // ── Step 2: Sync with Stripe ───────────────────────────────────────────────
  let syncedStripeIds: { stripeProductId: string; stripePriceId: string } | null = null;
  let stripeSyncError: string | null = null;

  try {
    syncedStripeIds = await syncMembershipPlan({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      billingCycle: plan.billingCycle,
      stripeProductId: plan.stripeProductId,
      stripePriceId: plan.stripePriceId,
    });
    console.log(`[PATCH /memberships/${params.id}] Stripe sync OK:`, syncedStripeIds);
  } catch (err) {
    stripeSyncError = err instanceof Error ? err.message : String(err);
    console.error(`[PATCH /memberships/${params.id}] Stripe sync FAILED:`, err);
  }

  // ── Step 3: Persist Stripe IDs back to DB ─────────────────────────────────
  if (
    syncedStripeIds &&
    (syncedStripeIds.stripeProductId !== plan.stripeProductId ||
      syncedStripeIds.stripePriceId !== plan.stripePriceId)
  ) {
    // Primary: use Prisma ORM update
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
      console.log(`[PATCH /memberships/${params.id}] DB Stripe IDs saved via ORM:`, plan.stripeProductId, plan.stripePriceId);
    } catch (ormErr) {
      console.error(`[PATCH /memberships/${params.id}] ORM update failed (likely stale Prisma client — restart dev server):`, ormErr);
    }

    // Fallback: raw SQL — bypasses ORM schema validation entirely
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
        // Re-fetch so the response contains the new IDs
        const fresh = await prisma.membershipPlan.findUnique({ where: { id: plan.id } });
        if (fresh) plan = fresh;
        console.log(`[PATCH /memberships/${params.id}] DB Stripe IDs saved via raw SQL`);
      } catch (rawErr) {
        console.error(`[PATCH /memberships/${params.id}] Raw SQL fallback also failed:`, rawErr);
      }
    }
  }

  // Always return the synced IDs alongside plan data so the client can update UI
  // even if the DB write failed for any reason.
  return NextResponse.json({
    data: plan,
    stripeIds: syncedStripeIds ?? undefined,
    stripeSyncError: stripeSyncError ?? undefined,
  });
}

// ─── DELETE: archive or hard-delete a plan ────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = await prisma.membershipPlan.findUnique({
    where: { id: params.id },
    include: { _count: { select: { userMemberships: true } } },
  });

  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const membershipCount = plan._count.userMemberships;
  console.log(`[DELETE /memberships/${params.id}] plan="${plan.name}" membershipCount=${membershipCount}`);

  // ── Archive Stripe product so it no longer appears as purchasable ─────────
  if (plan.stripeProductId) {
    await stripe.products.update(plan.stripeProductId, { active: false }).catch((err) => {
      console.warn(`[DELETE /memberships/${params.id}] Could not archive Stripe product: ${err.message}`);
    });
    console.log(`[DELETE /memberships/${params.id}] Stripe product ${plan.stripeProductId} archived`);
  }

  // ── Hard delete only when no memberships (active or historical) reference this plan
  if (membershipCount === 0) {
    await prisma.membershipPlan.delete({ where: { id: params.id } });
    console.log(`[DELETE /memberships/${params.id}] Hard deleted — no membership history`);
    return NextResponse.json({ deleted: true, archived: false });
  }

  // ── Soft delete: mark inactive so it no longer appears for new purchases
  await prisma.membershipPlan.update({
    where: { id: params.id },
    data: { isActive: false },
  });
  console.log(`[DELETE /memberships/${params.id}] Soft deleted (isActive=false) — ${membershipCount} membership record(s) preserved`);
  return NextResponse.json({ deleted: false, archived: true, membershipCount });
}
