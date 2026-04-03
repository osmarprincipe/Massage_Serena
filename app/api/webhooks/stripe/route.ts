import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { computeMembershipEndDate } from "@/lib/membership-duration";

// Must be dynamic — no caching, raw body required
export const dynamic = "force-dynamic";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ─── Entry point ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.warn("[stripe/webhook] Request missing stripe-signature header");
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json({ error: `Invalid signature: ${message}` }, { status: 400 });
  }

  console.log(`[stripe/webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.deleted":
      case "customer.subscription.updated":
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe/webhook] Error processing ${event.type}:`, message);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ─── checkout.session.completed ───────────────────────────────────────────────

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const sessionId = session.id;
  const mode = session.mode;
  const email = session.customer_email ?? session.customer_details?.email ?? null;
  const metadata = (session.metadata ?? {}) as Record<string, string>;

  console.log(
    `[stripe/webhook] checkout.session.completed — id: ${sessionId}, mode: ${mode}, email: ${email}`
  );
  console.log(`[stripe/webhook] metadata:`, JSON.stringify(metadata));

  if (!email) {
    console.error(`[stripe/webhook] No email on session ${sessionId} — cannot process`);
    return;
  }

  // Mark PaymentIntent as COMPLETED. Build OR conditions without undefined values
  // (Prisma strips undefined → {} which matches all rows and causes unique violations).
  const orConditions: Array<Record<string, string>> = [{ stripeSessionId: sessionId }];
  if (typeof session.payment_intent === "string") {
    orConditions.push({ stripeIntentId: session.payment_intent });
  }

  await prisma.paymentIntent
    .updateMany({
      where: { OR: orConditions },
      data: { status: "COMPLETED", stripeSessionId: sessionId },
    })
    .catch((err) => {
      console.warn("[stripe/webhook] Could not update PaymentIntent:", err.message);
    });

  // Resolve the user. Purchases now require authentication, so the user must be ACTIVE.
  // userId in metadata is the fastest path; email lookup is the fallback.
  let userId = metadata.userId ?? null;
  let user: { id: string; status: string } | null = null;

  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      console.warn(`[stripe/webhook] metadata.userId "${userId}" not found — falling back to email lookup`);
    }
  }

  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });
  }

  console.log(
    `[stripe/webhook] User: ${user ? `id=${user.id} status=${user.status}` : "NOT FOUND"}`
  );

  if (!user || user.status !== "ACTIVE") {
    console.error(
      `[stripe/webhook] No ACTIVE user found for email=${email} on session ${sessionId}. ` +
        `Purchases require an authenticated account. Skipping.`
    );
    return;
  }

  if (mode === "subscription") {
    await handleSubscriptionPayment(session, user.id, metadata);
  } else if (mode === "payment") {
    await handleOneTimePayment(session, user.id, metadata);
  } else {
    console.warn(`[stripe/webhook] Unexpected session mode: ${mode}`);
  }
}

// ─── Subscription checkout ────────────────────────────────────────────────────

async function handleSubscriptionPayment(
  session: Stripe.Checkout.Session,
  userId: string,
  metadata: Record<string, string>
) {
  const plan = await resolvePlan(session, metadata);
  if (!plan) {
    console.error(
      `[stripe/webhook] Cannot resolve MembershipPlan for session ${session.id}. ` +
        `Ensure metadata.planId is set or MembershipPlan.stripePriceId matches.`
    );
    return;
  }
  console.log(`[stripe/webhook] Resolved plan: id=${plan.id} name="${plan.name}"`);

  // Cancel any existing active memberships before creating the new one
  const cancelled = await prisma.userMembership.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "CANCELLED", endDate: new Date() },
  });
  if (cancelled.count > 0) {
    console.log(`[stripe/webhook] Cancelled ${cancelled.count} existing membership(s) for user ${userId}`);
  }

  const startDate = new Date();
  const endDate = computeMembershipEndDate(startDate, plan.billingCycle);

  const membership = await prisma.userMembership.create({
    data: {
      userId,
      planId: plan.id,
      status: "ACTIVE",
      startDate,
      endDate,
      autoRenew: true,
    },
  });
  console.log(
    `[stripe/webhook] ✓ Activated "${plan.name}" membership (${membership.id}) for user ${userId} ` +
      `billingCycle=${plan.billingCycle} startDate=${startDate.toISOString()} endDate=${endDate.toISOString()}`
  );
}

// ─── One-time payment checkout ────────────────────────────────────────────────

async function handleOneTimePayment(
  session: Stripe.Checkout.Session,
  userId: string,
  metadata: Record<string, string>
) {
  const content = await resolveContent(session, metadata);
  if (!content) {
    console.error(
      `[stripe/webhook] Cannot resolve Content for session ${session.id}. ` +
        `Ensure metadata.contentId is set or Content.stripePriceId matches.`
    );
    return;
  }
  console.log(`[stripe/webhook] Resolved content: id=${content.id} title="${content.title}"`);

  const pricePaid =
    session.amount_total != null
      ? session.amount_total / 100
      : (content.separatePurchasePrice ?? 0);

  const purchase = await prisma.contentPurchase.upsert({
    where: { userId_contentId: { userId, contentId: content.id } },
    create: { userId, contentId: content.id, pricePaid, status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
  console.log(
    `[stripe/webhook] ✓ Unlocked content "${content.title}" (purchase ${purchase.id}) for user ${userId}`
  );
}

// ─── Subscription lifecycle events ───────────────────────────────────────────

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const status = subscription.status;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  console.log(`[stripe/webhook] Subscription ${subscription.id} status: ${status}`);

  if (status !== "canceled" && status !== "unpaid" && status !== "past_due") {
    return;
  }

  console.warn(
    `[stripe/webhook] Subscription ${subscription.id} entered state "${status}" for customer ${customerId}. ` +
      `Manual membership expiry may be required.`
  );
}

// ─── Helpers: resolve plan and content ────────────────────────────────────────

async function resolvePlan(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  if (metadata.planId) {
    const plan = await prisma.membershipPlan.findUnique({ where: { id: metadata.planId } });
    if (plan) return plan;
    console.warn(`[stripe/webhook] metadata.planId "${metadata.planId}" not found in DB`);
  }

  const priceId = await getFirstPriceId(session.id);
  if (priceId) {
    const plan = await prisma.membershipPlan.findFirst({ where: { stripePriceId: priceId } });
    if (plan) return plan;
    console.warn(`[stripe/webhook] No MembershipPlan with stripePriceId "${priceId}"`);
  }

  return null;
}

async function resolveContent(
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  if (metadata.contentId) {
    const content = await prisma.content.findUnique({ where: { id: metadata.contentId } });
    if (content) return content;
    console.warn(`[stripe/webhook] metadata.contentId "${metadata.contentId}" not found in DB`);
  }

  const priceId = await getFirstPriceId(session.id);
  if (priceId) {
    const content = await prisma.content.findFirst({ where: { stripePriceId: priceId } });
    if (content) return content;
    console.warn(`[stripe/webhook] No Content with stripePriceId "${priceId}"`);
  }

  return null;
}

async function getFirstPriceId(sessionId: string): Promise<string | null> {
  try {
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 1 });
    return lineItems.data[0]?.price?.id ?? null;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe/webhook] Could not fetch line items for session ${sessionId}:`, message);
    return null;
  }
}
