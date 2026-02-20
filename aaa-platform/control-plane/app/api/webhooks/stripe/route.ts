import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, PRICE_IDS } from "@/lib/stripe";
import { updateSubscriptionTier } from "@/lib/clerk";
import { tenantDb, prisma } from "@/lib/db";

const stripe = getStripe();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("No stripe-signature header found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Check for duplicate events (idempotency)
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent?.processed) {
    console.log(`Event ${event.id} already processed, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Create or update webhook event record
  await prisma.webhookEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      eventType: event.type,
      processed: false,
      attempts: 1,
    },
    update: {
      attempts: {
        increment: 1,
      },
    },
  });

  // Process webhook event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error as Error;
    console.error("Error processing webhook:", err.message, err.stack);

    // Log error for retry
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        lastError: err.message,
      },
    });

    // Return 500 to trigger Stripe retry
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 * Handle checkout.session.completed event
 * Triggered when a user completes a Stripe checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | null;
  const metadata = session.metadata || {};

  console.log("Processing checkout.session.completed:", {
    sessionId: session.id,
    customerId,
    mode: session.mode,
    metadata,
  });

  // Find user by Stripe customer ID
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("No user found for customer:", customerId);
    throw new Error(`No user found for customer ${customerId}`);
  }

  if (session.mode === "subscription" && subscriptionId) {
    // Subscription payment (Tier 2)
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    const tier = mapPriceIdToTier(priceId);

    // Update database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        tier: tier,
      },
    });

    // Update Clerk metadata
    if (user.clerkId) {
      await updateSubscriptionTier(user.clerkId, tier === "tier2" ? "tier2" : "tier1");
    }

    // Log subscription history
    await tenantDb.subscriptionHistory.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: subscriptionId,
        oldTier: "tier1",
        newTier: tier,
        oldPriceId: null,
        newPriceId: priceId,
        eventType: "subscription_created",
        status: subscription.status,
      },
    });

    console.log(`User ${user.id} subscribed to ${tier} (${priceId})`);
  } else if (session.mode === "payment") {
    // One-time payment (Tier 3)
    const tier = metadata.tier || "tier3";

    await prisma.user.update({
      where: { id: user.id },
      data: {
        tier: tier,
      },
    });

    // Update Clerk metadata
    if (user.clerkId) {
      await updateSubscriptionTier(user.clerkId, "tier3");
    }

    // Log payment
    await tenantDb.subscriptionHistory.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: `onetime_${session.id}`,
        oldTier: user.tier,
        newTier: tier,
        oldPriceId: null,
        newPriceId: session.amount_total?.toString() || "unknown",
        eventType: "one_time_payment",
        status: "completed",
      },
    });

    console.log(`User ${user.id} purchased ${tier} (one-time payment)`);
  }
}

/**
 * Handle customer.subscription.created event
 * Triggered when a subscription is created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = mapPriceIdToTier(priceId);

  console.log("Processing customer.subscription.created:", {
    subscriptionId: subscription.id,
    customerId,
    priceId,
    tier,
  });

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("No user found for customer:", customerId);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      tier: tier,
    },
  });

  // Update Clerk metadata
  if (user.clerkId) {
    await updateSubscriptionTier(user.clerkId, tier === "tier2" ? "tier2" : "tier1");
  }

  // Log subscription history
  await tenantDb.subscriptionHistory.create({
    data: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      oldTier: user.tier,
      newTier: tier,
      oldPriceId: user.stripePriceId || null,
      newPriceId: priceId,
      eventType: "subscription_created",
      status: subscription.status,
    },
  });
}

/**
 * Handle customer.subscription.updated event
 * Triggered when subscription details change (tier upgrade/downgrade)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const tier = mapPriceIdToTier(priceId);

  console.log("Processing customer.subscription.updated:", {
    subscriptionId: subscription.id,
    customerId,
    priceId,
    tier,
    status: subscription.status,
  });

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("No user found for customer:", customerId);
    return;
  }

  const oldTier = user.tier;
  const oldPriceId = user.stripePriceId;

  // Update database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      tier: subscription.status === "active" ? tier : "tier1",
    },
  });

  // Update Clerk metadata
  if (user.clerkId) {
    const newTier = subscription.status === "active" ? tier : "tier1";
    await updateSubscriptionTier(
      user.clerkId,
      newTier === "tier2" ? "tier2" : "tier1"
    );
  }

  // Log tier change if tier changed
  if (oldTier !== tier || oldPriceId !== priceId) {
    await tenantDb.subscriptionHistory.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: subscription.id,
        oldTier: oldTier,
        newTier: tier,
        oldPriceId: oldPriceId || null,
        newPriceId: priceId,
        eventType: "subscription_updated",
        status: subscription.status,
      },
    });

    console.log(`User ${user.id} tier changed: ${oldTier} → ${tier}`);
  }
}

/**
 * Handle customer.subscription.deleted event
 * Triggered when a subscription is canceled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  console.log("Processing customer.subscription.deleted:", {
    subscriptionId: subscription.id,
    customerId,
  });

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("No user found for customer:", customerId);
    return;
  }

  // Downgrade to free tier
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      tier: "tier1",
    },
  });

  // Update Clerk metadata
  if (user.clerkId) {
    await updateSubscriptionTier(user.clerkId, "tier1");
  }

  // Log cancellation
  await tenantDb.subscriptionHistory.create({
    data: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      oldTier: user.tier,
      newTier: "tier1",
      oldPriceId: user.stripePriceId || null,
      newPriceId: null,
      eventType: "subscription_canceled",
      status: "canceled",
    },
  });

  console.log(`User ${user.id} subscription canceled, downgraded to tier1`);
}

/**
 * Handle invoice.payment_succeeded event
 * Triggered when a recurring payment succeeds
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Payment succeeded for invoice:", invoice.id);

  // Could send "Payment successful" email here
  // Could update usage metrics or generate monthly reports
}

/**
 * Handle invoice.payment_failed event
 * Triggered when a recurring payment fails
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Payment failed for invoice:", invoice.id);

  const customerId = invoice.customer as string;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (user) {
    console.log(`Payment failed for user ${user.id}. Consider sending dunning email.`);

    // Could trigger dunning email sequence here
    // Could update user status to "payment_failed"
    // Could notify admin of failed payment
  }
}

/**
 * Map Stripe Price ID to AAA Platform tier
 */
function mapPriceIdToTier(priceId: string): string {
  // Tier 2 mapping
  if (
    priceId === PRICE_IDS.TIER2_MONTHLY_99 ||
    priceId === PRICE_IDS.TIER2_MONTHLY_199
  ) {
    return "tier2";
  }

  // Tier 3 mapping
  if (
    priceId === PRICE_IDS.TIER3_ONETIME_2500 ||
    priceId === PRICE_IDS.TIER3_ONETIME_5000
  ) {
    return "tier3";
  }

  // Legacy naming support
  if (priceId === PRICE_IDS.ARCHITECT_MONTHLY || priceId === PRICE_IDS.ARCHITECT_YEARLY) {
    return "tier2";
  }

  if (priceId === PRICE_IDS.APEX) {
    return "tier3";
  }

  // Default to tier1 for unknown price IDs
  console.warn(`Unknown price ID: ${priceId}, defaulting to tier1`);
  return "tier1";
}
