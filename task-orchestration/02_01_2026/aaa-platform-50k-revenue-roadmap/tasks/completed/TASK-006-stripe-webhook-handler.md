# TASK-006: Build Stripe Webhook Handler

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 6-8 hours
**Dependencies**: TASK-005
**Assigned To**: Unassigned

---

## Objective

Implement a robust Stripe webhook handler to process payment events, update user subscription tiers, and handle subscription lifecycle events.

---

## Description

Webhooks are the mechanism by which Stripe notifies our application of payment events. This task implements the webhook endpoint that:
- Verifies webhook signatures (security)
- Processes subscription creation/updates/cancellations
- Updates user metadata in Clerk
- Logs all payment events for auditing

**Current State**: Basic webhook route exists at `/api/webhooks/stripe/route.ts`
**Target State**: Production-ready webhook with full event handling

---

## Acceptance Criteria

- [ ] Webhook signature verification implemented
- [ ] Event handlers for all critical events:
  - `checkout.session.completed` - New subscription/payment
  - `customer.subscription.created` - Subscription activated
  - `customer.subscription.updated` - Tier change
  - `customer.subscription.deleted` - Cancellation
  - `invoice.payment_succeeded` - Recurring payment success
  - `invoice.payment_failed` - Payment failure
- [ ] User metadata updated in Clerk after successful payment
- [ ] Database records created for:
  - Subscriptions
  - Payment history
  - Tier changes
- [ ] Error handling and retry logic
- [ ] Webhook event logging for debugging
- [ ] Idempotency handling (prevent duplicate processing)
- [ ] Email notifications triggered for key events
- [ ] Documentation: `docs/WEBHOOK-IMPLEMENTATION.md`

---

## Technical Implementation

### Webhook Route Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
```

### Event Handler Functions

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, tier } = session.metadata!;

  // Update user tier in Clerk
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      subscription_tier: tier,
      subscription_status: "active",
      stripe_customer_id: session.customer,
    },
  });

  // Store in database
  await db.subscriptions.create({
    tenant_id: userId,
    stripe_subscription_id: session.subscription,
    tier,
    status: "active",
    created_at: new Date(),
  });

  // Send welcome email
  await sendEmail({
    to: session.customer_email,
    template: "subscription_welcome",
    data: { tier },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  const newTier = getTierFromPriceId(subscription.items.data[0].price.id);

  // Update user tier
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      subscription_tier: newTier,
      subscription_status: subscription.status,
    },
  });

  // Log tier change
  await db.tierChanges.create({
    tenant_id: userId,
    old_tier: subscription.metadata.previous_tier,
    new_tier: newTier,
    changed_at: new Date(),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;

  // Downgrade to free tier
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      subscription_tier: "tier1",
      subscription_status: "canceled",
    },
  });

  // Send cancellation email
  await sendEmail({
    to: subscription.metadata.email,
    template: "subscription_canceled",
  });
}
```

---

## Security Considerations

### Webhook Signature Verification
- **Critical**: Always verify `stripe-signature` header
- Prevents malicious actors from sending fake webhook events
- Uses Stripe's official webhook secret

### Idempotency
```typescript
// Prevent duplicate processing
const eventId = event.id;
const existingEvent = await db.webhookEvents.findUnique({
  where: { stripe_event_id: eventId },
});

if (existingEvent) {
  console.log(`Event ${eventId} already processed, skipping`);
  return NextResponse.json({ received: true });
}

// Process event...

// Mark as processed
await db.webhookEvents.create({
  stripe_event_id: eventId,
  event_type: event.type,
  processed_at: new Date(),
});
```

---

## Testing Steps

### Local Testing with Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

### Manual Testing
1. Create test subscription via Stripe dashboard
2. Verify webhook event received in application logs
3. Check user tier updated in Clerk
4. Verify database record created
5. Confirm email sent (check email logs)

### Error Scenarios
1. Invalid signature → Should return 400
2. Duplicate event → Should be idempotent (no double-processing)
3. Database failure → Should log error, return 500 for retry
4. Network timeout → Stripe will retry webhook (up to 3 days)

---

## Blockers

- Requires TASK-005 (Stripe products configured)
- Requires SSL certificate for production webhooks
- Requires accessible public URL (use ngrok for local testing)

---

## Notes

- Stripe retries failed webhooks automatically (exponential backoff)
- Webhook processing should be fast (<5 seconds) to avoid timeouts
- For heavy processing, enqueue background jobs instead of blocking
- Monitor webhook failures in Stripe dashboard
- Set up alerts for repeated webhook failures

---

## Related Tasks

- TASK-005: Configure Stripe Products (dependency)
- TASK-004: Clerk Authentication (updates user metadata)
- TASK-009: Feature Gating (enforces tier changes)
- TASK-015: Optimize Tier 2 Retention (monitors cancellations)
