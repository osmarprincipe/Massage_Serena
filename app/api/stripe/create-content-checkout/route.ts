import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";

const schema = z.object({
  contentId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userEmail = session?.user?.email;
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userEmail || !userId) {
    return NextResponse.json({ error: "You must be logged in to purchase content" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { contentId } = parsed.data;

  const content = await prisma.content.findUnique({ where: { id: contentId } });
  if (!content) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
  if (!content.separatePurchaseEnabled) {
    return NextResponse.json({ error: "This content is not available for individual purchase" }, { status: 400 });
  }
  if (!content.stripePriceId) {
    return NextResponse.json(
      { error: "This content is not yet connected to Stripe. Please contact us." },
      { status: 400 }
    );
  }

  // Prevent double-purchase
  const existing = await prisma.contentPurchase.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });
  if (existing?.status === "ACTIVE") {
    return NextResponse.json({ error: "You already own this content" }, { status: 409 });
  }

  const appUrl = getAppUrl();

  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: content.stripePriceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: { contentId: content.id, userId },
      success_url: `${appUrl}/app/content?purchased=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/app/content`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[create-content-checkout] Stripe error:", message);
    return NextResponse.json({ error: "Could not create checkout session. Please try again." }, { status: 500 });
  }

  // Record PaymentIntent (non-fatal)
  await prisma.paymentIntent
    .create({
      data: {
        type: "CONTENT",
        targetId: contentId,
        amount: content.separatePurchasePrice ?? 0,
        currency: "USD",
        status: "PENDING",
        stripeSessionId: stripeSession.id,
        email: userEmail,
        userId,
      },
    })
    .catch((err) => {
      console.warn("[create-content-checkout] Could not record PaymentIntent:", err.message);
    });

  return NextResponse.json({ url: stripeSession.url });
}
