/**
 * Stripe auto-sync helpers.
 * Called server-side after DB writes so admin never has to manually enter Stripe IDs.
 *
 * Stripe prices are immutable (unit_amount / recurring.interval cannot change).
 * When price or billing changes we archive the old price and create a new one.
 * Products are always mutable (name, description).
 */

import { stripe } from "@/lib/stripe";

// ─── Membership plan ─────────────────────────────────────────────────────────

interface PlanSyncInput {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: string; // "MONTHLY" | "WEEKLY"
  stripeProductId: string | null;
  stripePriceId: string | null;
}

export async function syncMembershipPlan(
  plan: PlanSyncInput
): Promise<{ stripeProductId: string; stripePriceId: string }> {
  const interval = plan.billingCycle === "WEEKLY" ? "week" : "month";
  const amountCents = Math.round(plan.price * 100);

  // ── Ensure product exists ──────────────────────────────────────────────────
  let stripeProductId = plan.stripeProductId;

  if (!stripeProductId) {
    const product = await stripe.products.create({
      name: plan.name,
      ...(plan.description ? { description: plan.description } : {}),
      metadata: { source: "serene-studio", planId: plan.id },
    });
    stripeProductId = product.id;
  } else {
    await stripe.products.update(stripeProductId, {
      name: plan.name,
      description: plan.description ?? "",
      metadata: { source: "serene-studio", planId: plan.id },
    });
  }

  // ── Ensure price is current ────────────────────────────────────────────────
  let stripePriceId = plan.stripePriceId;
  let needNewPrice = !stripePriceId;

  if (stripePriceId) {
    try {
      const existing = await stripe.prices.retrieve(stripePriceId);
      if (
        existing.unit_amount !== amountCents ||
        existing.recurring?.interval !== interval
      ) {
        needNewPrice = true;
      }
    } catch {
      // Price doesn't exist in Stripe — create fresh
      needNewPrice = true;
    }
  }

  if (needNewPrice) {
    // Archive old price so it's no longer offered
    if (stripePriceId) {
      await stripe.prices.update(stripePriceId, { active: false }).catch(() => {});
    }
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: amountCents,
      currency: "usd",
      recurring: { interval },
      metadata: { planId: plan.id },
    });
    stripePriceId = price.id;
  }

  return { stripeProductId, stripePriceId: stripePriceId! };
}

// ─── Purchasable content ──────────────────────────────────────────────────────

interface ContentSyncInput {
  id: string;
  title: string;
  description: string | null;
  separatePurchasePrice: number;
  stripeProductId: string | null;
  stripePriceId: string | null;
}

export async function syncContentProduct(
  content: ContentSyncInput
): Promise<{ stripeProductId: string; stripePriceId: string }> {
  const amountCents = Math.round(content.separatePurchasePrice * 100);

  // ── Ensure product exists ──────────────────────────────────────────────────
  let stripeProductId = content.stripeProductId;

  if (!stripeProductId) {
    const product = await stripe.products.create({
      name: content.title,
      ...(content.description ? { description: content.description } : {}),
      metadata: { source: "serene-studio", contentId: content.id },
    });
    stripeProductId = product.id;
  } else {
    await stripe.products.update(stripeProductId, {
      name: content.title,
      description: content.description ?? "",
      metadata: { source: "serene-studio", contentId: content.id },
    });
  }

  // ── Ensure price is current ────────────────────────────────────────────────
  let stripePriceId = content.stripePriceId;
  let needNewPrice = !stripePriceId;

  if (stripePriceId) {
    try {
      const existing = await stripe.prices.retrieve(stripePriceId);
      if (existing.unit_amount !== amountCents) {
        needNewPrice = true;
      }
    } catch {
      needNewPrice = true;
    }
  }

  if (needNewPrice) {
    if (stripePriceId) {
      await stripe.prices.update(stripePriceId, { active: false }).catch(() => {});
    }
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: amountCents,
      currency: "usd",
      metadata: { contentId: content.id },
    });
    stripePriceId = price.id;
  }

  return { stripeProductId, stripePriceId: stripePriceId! };
}
