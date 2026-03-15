import { headers } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { tenantDb } from "@/lib/db";
import {
  verifyWebhookSignature,
  extractWebhookData,
  mapVariantIdToTier,
  isSubscriptionActive,
} from "@/lib/lemonsqueezy";
import { updateSubscriptionTier } from "@/lib/clerk";

const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("x-signature");

  if (!signature) {
    console.error("No X-Signature header found");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  if (!webhookSecret) {
    console.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature, webhookSecret)) {
    console.error("Invalid LemonSqueezy webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch (error) {
    console.error("Invalid JSON in webhook body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload.meta?.event_name;
  const webhookData = extractWebhookData(payload);

  // Check for duplicate events (idempotency)
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { lemonsqueezyEventId: webhookData.id },
  });

  if (existingEvent?.processed) {
    console.log(`Event ${webhookData.id} already processed, skipping`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Create or update webhook event record
  await prisma.webhookEvent.upsert({
    where: { lemonsqueezyEventId: webhookData.id },
    create: {
      lemonsqueezyEventId: webhookData.id,
      eventType: eventType,
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
    switch (eventType) {
      case "order_created": {
        await handleOrderCreated(webhookData);
        break;
      }

      case "subscription_created": {
        await handleSubscriptionCreated(webhookData);
        break;
      }

      case "subscription_updated": {
        await handleSubscriptionUpdated(webhookData);
        break;
      }

      case "subscription_cancelled": {
        await handleSubscriptionCancelled(webhookData);
        break;
      }

      case "subscription_payment_success": {
        await handlePaymentSuccess(webhookData);
        break;
      }

      default:
        console.log(`Unhandled LemonSqueezy event type: ${eventType}`);
    }

    // Mark event as processed
    await prisma.webhookEvent.update({
      where: { lemonsqueezyEventId: webhookData.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const err = error as Error;
    console.error("Error processing LemonSqueezy webhook:", err.message, err.stack);

    // Log error for retry
    await prisma.webhookEvent.update({
      where: { lemonsqueezyEventId: webhookData.id },
      data: {
        lastError: err.message,
      },
    });

    // Return 500 to trigger LemonSqueezy retry
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/**
 * Handle order_created event
 * Triggered when a one-time payment is completed
 */
async function handleOrderCreated(data: any) {
  console.log("Processing order_created:", {
    orderId: data.id,
    customerId: data.customerId,
    variantId: data.variantId,
  });

  // Find user by email (LemonSqueezy uses email for customer identification)
  const user = await prisma.user.findFirst({
    where: { email: data.customerEmail },
  });

  if (!user) {
    console.error("No user found for email:", data.customerEmail);
    throw new Error(`No user found for email ${data.customerEmail}`);
  }

  const tier = mapVariantIdToTier(data.variantId);

  // Update database with order info
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lemonsqueezyCustomerId: data.customerId,
      lemonsqueezyOrderId: data.id,
      tier: tier,
    },
  });

  // Update Clerk metadata
  if (user.clerkId) {
    await updateSubscriptionTier(user.clerkId, tier);
  }

  // Log purchase
  await tenantDb.subscriptionHistory.create({
    data: {
      userId: user.id,
      lemonsqueezyOrderId: data.id,
      oldTier: user.tier,
      newTier: tier,
      oldPriceId: null,
      newPriceId: data.variantId,
      eventType: "one_time_payment",
      status: "completed",
    },
  });

  console.log(`User ${user.id} purchased ${tier} via LemonSqueezy order ${data.id}`);
}

/**
 * Handle subscription_created event
 * Triggered when a new subscription is started
 */
async function handleSubscriptionCreated(data: any) {
  console.log("Processing subscription_created:", {
    subscriptionId: data.subscriptionId,
    customerId: data.customerId,
    variantId: data.variantId,
  });

  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: data.customerEmail },
  });

  if (!user) {
    console.error("No user found for email:", data.customerEmail);
    throw new Error(`No user found for email ${data.customerEmail}`);
  }

  const tier = mapVariantIdToTier(data.variantId);

  // Update database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lemonsqueezyCustomerId: data.customerId,
      lemonsqueezySubscriptionId: data.subscriptionId,
      lemonsqueezyVariantId: data.variantId,
      tier: tier,
    },
  });

  // Update Clerk metadata
  if (user.clerkId) {
    await updateSubscriptionTier(user.clerkId, tier === "tier2" ? "tier2" : "tier1");
  }

  // Log subscription
  await tenantDb.subscriptionHistory.create({
    data: {
      userId: user.id,
      lemonsqueezySubscriptionId: data.subscriptionId,
      oldTier: user.tier,
      newTier: tier,
      oldPriceId: null,
      newPriceId: data.variantId,
      eventType: "subscription_created",
      status: data.status,
    },
  });

  console.log(`User ${user.id} created subscription ${data.subscriptionId} for ${tier}`);
}

/**
 * Handle subscription_updated event
 * Triggered when subscription details change (plan change, pause, etc)
 */
async function handleSubscriptionUpdated(data: any) {
  console.log("Processing subscription_updated:", {
    subscriptionId: data.subscriptionId,
    customerId: data.customerId,
    status: data.status,
    variantId: data.variantId,
  });

  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: data.customerEmail },
  });

  if (!user) {
    console.error("No user found for email:", data.customerEmail);
    throw new Error(`No user found for email ${data.customerEmail}`);
  }

  const oldTier = user.tier;
  const oldVariantId = user.lemonsqueezyVariantId;
  const tier = mapVariantIdToTier(data.variantId);
  const active = isSubscriptionActive(data.status);

  // Update database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lemonsqueezyVariantId: data.variantId,
      tier: active ? tier : "tier1",
    },
  });

  // Update Clerk metadata
  if (user.clerkId) {
    const newTier = active ? tier : "tier1";
    await updateSubscriptionTier(user.clerkId, newTier === "tier2" ? "tier2" : "tier1");
  }

  // Log tier change if tier changed
  if (oldTier !== tier || oldVariantId !== data.variantId) {
    await tenantDb.subscriptionHistory.create({
      data: {
        userId: user.id,
        lemonsqueezySubscriptionId: data.subscriptionId,
        oldTier: oldTier,
        newTier: tier,
        oldPriceId: oldVariantId || null,
        newPriceId: data.variantId,
        eventType: "subscription_updated",
        status: data.status,
      },
    });

    console.log(`User ${user.id} subscription updated: ${oldTier} → ${tier}`);
  }
}

/**
 * Handle subscription_cancelled event
 * Triggered when subscription is cancelled
 */
async function handleSubscriptionCancelled(data: any) {
  console.log("Processing subscription_cancelled:", {
    subscriptionId: data.subscriptionId,
    customerId: data.customerId,
  });

  // Find user by email
  const user = await prisma.user.findFirst({
    where: { email: data.customerEmail },
  });

  if (!user) {
    console.error("No user found for email:", data.customerEmail);
    throw new Error(`No user found for email ${data.customerEmail}`);
  }

  const oldTier = user.tier;

  // Downgrade to free tier
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lemonsqueezySubscriptionId: null,
      lemonsqueezyVariantId: null,
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
      lemonsqueezySubscriptionId: data.subscriptionId,
      oldTier: oldTier,
      newTier: "tier1",
      oldPriceId: user.lemonsqueezyVariantId || null,
      newPriceId: null,
      eventType: "subscription_canceled",
      status: "canceled",
    },
  });

  console.log(`User ${user.id} subscription cancelled, downgraded to tier1`);
}

/**
 * Handle subscription_payment_success event
 * Triggered when a recurring payment succeeds
 */
async function handlePaymentSuccess(data: any) {
  console.log("Payment succeeded for subscription:", data.subscriptionId);

  // Could send "Payment successful" email here
  // Could update usage metrics or generate monthly reports
}
