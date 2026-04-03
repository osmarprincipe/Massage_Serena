import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  planId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const userId = (session?.user as any)?.id as string | undefined;

  console.log(`[membership-checkout] Auth: email=${userEmail ?? "none"} userId=${userId ?? "none"}`);

  if (!userEmail || !userId) {
    return NextResponse.json({ error: "You must be logged in to subscribe" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { planId } = parsed.data;
  console.log(`[membership-checkout] Plan requested: ${planId}`);

  // ── Fetch plan via ORM ────────────────────────────────────────────────────
  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });

  console.log(`[membership-checkout] ORM plan result:`, plan
    ? `id=${plan.id} name="${plan.name}" isActive=${plan.isActive} stripePriceId=${plan.stripePriceId ?? "NULL"} stripeProductId=${(plan as any).stripeProductId ?? "NULL"}`
    : "NOT FOUND"
  );

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }
  if (!plan.isActive) {
    return NextResponse.json({ error: "This plan is no longer available" }, { status: 400 });
  }

  // ── Resolve stripePriceId — ORM first, raw SQL fallback ──────────────────
  //
  // The dev server caches the Prisma client at startup. If `stripeProductId` was added
  // to MembershipPlan after the server started, the stale in-memory ORM omits that column
  // from its SELECT, returning `undefined` even when the DB has a value.
  // Raw SQL bypasses the ORM entirely and reads what is actually in the database.
  //
  let stripePriceId: string | null = plan.stripePriceId ?? null;

  if (!stripePriceId) {
    try {
      const rows = await prisma.$queryRaw<Array<{ stripePriceId: string | null; stripeProductId: string | null }>>`
        SELECT "stripePriceId", "stripeProductId"
        FROM "MembershipPlan"
        WHERE "id" = ${planId}
        LIMIT 1
      `;
      const raw = rows[0] ?? null;
      console.log(
        `[membership-checkout] Raw SQL result: stripePriceId=${raw?.stripePriceId ?? "NULL"} stripeProductId=${raw?.stripeProductId ?? "NULL"}`
      );
      stripePriceId = raw?.stripePriceId ?? null;
    } catch (rawErr) {
      // Column may not exist yet — means prisma db push has not been run
      console.error("[membership-checkout] Raw SQL fallback failed (column may not exist):", rawErr);
    }
  } else {
    console.log(`[membership-checkout] ORM stripePriceId OK: ${stripePriceId}`);
  }

  if (!stripePriceId) {
    console.error(
      `[membership-checkout] Plan ${planId} has no stripePriceId. ` +
        `Go to Admin → Memberships → edit this plan and save to trigger Stripe sync.`
    );
    return NextResponse.json(
      { error: "This plan is not yet connected to Stripe. Please contact us to complete your purchase." },
      { status: 400 }
    );
  }

  // ── Create Stripe Checkout Session ────────────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log(`[membership-checkout] Creating Stripe session: user=${userId} plan=${planId} stripePriceId=${stripePriceId}`);

  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: { planId: plan.id, userId },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[membership-checkout] Stripe error:", message);
    return NextResponse.json({ error: "Could not create checkout session. Please try again." }, { status: 500 });
  }

  console.log(`[membership-checkout] ✓ Stripe session created: ${stripeSession.id} url=${stripeSession.url}`);

  // ── Record PaymentIntent (non-fatal) ──────────────────────────────────────
  await prisma.paymentIntent
    .create({
      data: {
        type: "MEMBERSHIP",
        targetId: planId,
        amount: plan.price,
        currency: "USD",
        status: "PENDING",
        stripeSessionId: stripeSession.id,
        email: userEmail,
        userId,
      },
    })
    .then(() => {
      console.log(`[membership-checkout] PaymentIntent recorded for session ${stripeSession.id}`);
    })
    .catch((err) => {
      console.warn("[membership-checkout] Could not record PaymentIntent:", err.message);
    });

  return NextResponse.json({ url: stripeSession.url });
}
