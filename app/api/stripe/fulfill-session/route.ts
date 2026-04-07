import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { computeMembershipEndDate } from "@/lib/membership-duration";

/**
 * POST /api/stripe/fulfill-session
 *
 * Verifies a Stripe Checkout session directly (no webhook required) and
 * writes the purchase / membership record to the database.
 *
 * Called from success pages immediately after Stripe redirects the user back.
 * Safe to call multiple times — all DB writes are upsert / idempotent.
 */
export async function POST(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  if (!authSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (authSession.user as any).id as string;

  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId as string | undefined;

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  // Retrieve & verify the session directly from Stripe
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
  }

  if (stripeSession.status !== "complete" || stripeSession.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment not completed" }, { status: 402 });
  }

  const metadata = (stripeSession.metadata ?? {}) as Record<string, string>;

  // Security: if userId was embedded in metadata, verify it matches the logged-in user
  if (metadata.userId && metadata.userId !== userId) {
    return NextResponse.json({ error: "Session does not belong to this account" }, { status: 403 });
  }

  console.log(`[fulfill-session] mode=${stripeSession.mode} userId=${userId} sessionId=${sessionId}`);

  // ── Content (one-time payment) ────────────────────────────────────────────
  if (stripeSession.mode === "payment") {
    const contentId = metadata.contentId;
    if (!contentId) {
      return NextResponse.json({ error: "No contentId in session metadata" }, { status: 400 });
    }

    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const pricePaid =
      stripeSession.amount_total != null
        ? stripeSession.amount_total / 100
        : (content.separatePurchasePrice ?? 0);

    await prisma.contentPurchase.upsert({
      where: { userId_contentId: { userId, contentId } },
      create: { userId, contentId, pricePaid, status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });

    console.log(`[fulfill-session] ✓ Unlocked content "${content.title}" for user ${userId}`);
    return NextResponse.json({ success: true, type: "CONTENT" });
  }

  // ── Membership (subscription) ─────────────────────────────────────────────
  if (stripeSession.mode === "subscription") {
    const planId = metadata.planId;
    if (!planId) {
      return NextResponse.json({ error: "No planId in session metadata" }, { status: 400 });
    }

    const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Idempotent: if already active for this plan, skip
    const existing = await prisma.userMembership.findFirst({
      where: { userId, planId, status: "ACTIVE" },
    });
    if (existing) {
      console.log(`[fulfill-session] Membership already active for user ${userId} plan ${planId}`);
      return NextResponse.json({ success: true, type: "MEMBERSHIP" });
    }

    // Cancel any other active memberships
    await prisma.userMembership.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "CANCELLED", endDate: new Date() },
    });

    const startDate = new Date();
    const endDate = computeMembershipEndDate(startDate, plan.billingCycle);

    await prisma.userMembership.create({
      data: { userId, planId, status: "ACTIVE", startDate, endDate, autoRenew: true },
    });

    console.log(`[fulfill-session] ✓ Activated "${plan.name}" membership for user ${userId}`);
    return NextResponse.json({ success: true, type: "MEMBERSHIP" });
  }

  return NextResponse.json({ error: "Unrecognised session mode" }, { status: 400 });
}
