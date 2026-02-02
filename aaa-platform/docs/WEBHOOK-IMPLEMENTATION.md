# Stripe Webhook Implementation Guide
## AAA Platform - Production-Ready Payment Event Handling

**Last Updated**: 2026-02-02
**Status**: ✅ Production Ready

---

## Overview

This document describes the Stripe webhook implementation for the AAA Platform. The webhook handler processes payment events from Stripe and automatically updates user subscription tiers, maintains payment history, and synchronizes state across the application.

---

## Architecture

```
┌─────────────────────────┐
│      Stripe API         │
│                         │
│  Payment Events Occur   │
└────────────┬────────────┘
             │
             │ HTTP POST (webhook event)
             │
             ▼
┌─────────────────────────┐
│  /api/webhooks/stripe   │
│                         │
│  1. Verify Signature    │
│  2. Check Idempotency   │
│  3. Process Event       │
│  4. Update Database     │
│  5. Update Clerk        │
│  6. Log History         │
└────────────┬────────────┘
             │
             ├──────────────────┬──────────────────┐
             ▼                  ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │   Clerk Auth     │  │  Subscription    │
│   (User Data)    │  │   (Metadata)     │  │  History Log     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Webhook Events Handled

| Event | Description | Actions Taken |
|-------|-------------|---------------|
| `checkout.session.completed` | User completes checkout | Create subscription, update tier, send welcome email |
| `customer.subscription.created` | New subscription activated | Update user tier, log subscription start |
| `customer.subscription.updated` | Subscription modified | Handle tier changes, log upgrade/downgrade |
| `customer.subscription.deleted` | Subscription canceled | Downgrade to free tier, log cancellation |
| `invoice.payment_succeeded` | Recurring payment success | Log payment, could send receipt |
| `invoice.payment_failed` | Payment failure | Log failure, trigger dunning process |

---

## Security Features

### 1. Signature Verification

Every webhook request is verified using Stripe's signature mechanism:

```typescript
const signature = headersList.get("stripe-signature");
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

**Benefits**:
- Prevents unauthorized access
- Ensures events come from Stripe
- Protects against replay attacks

### 2. Idempotency

The system tracks processed events to prevent duplicate processing:

```typescript
const existingEvent = await prisma.webhookEvent.findUnique({
  where: { stripeEventId: event.id },
});

if (existingEvent?.processed) {
  return NextResponse.json({ received: true, duplicate: true });
}
```

**Benefits**:
- Prevents double-charging users
- Handles Stripe's automatic retries safely
- Maintains data consistency

### 3. Error Handling

Failed webhooks return HTTP 500 to trigger Stripe's retry mechanism:

```typescript
catch (error) {
  // Log error
  await prisma.webhookEvent.update({
    where: { stripeEventId: event.id },
    data: { lastError: err.message },
  });

  // Return 500 to trigger retry
  return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
}
```

**Stripe Retry Behavior**:
- Retries for up to 3 days
- Exponential backoff between attempts
- Can be monitored in Stripe Dashboard

---

## Data Models

### WebhookEvent

Tracks all webhook events for idempotency and debugging:

```prisma
model WebhookEvent {
  id            String   @id @default(cuid())
  stripeEventId String   @unique
  eventType     String
  processed     Boolean  @default(false)
  attempts      Int      @default(0)
  lastError     String?

  createdAt     DateTime @default(now())
  processedAt   DateTime?
}
```

### SubscriptionHistory

Logs all subscription tier changes for analytics and auditing:

```prisma
model SubscriptionHistory {
  id                   String   @id @default(cuid())
  userId               String
  stripeSubscriptionId String
  oldTier              String?
  newTier              String
  oldPriceId           String?
  newPriceId           String?
  eventType            String
  status               String

  createdAt            DateTime @default(now())
}
```

---

## Event Handler Details

### checkout.session.completed

**Triggered**: When user completes Stripe checkout
**Purpose**: Initialize new subscription or one-time payment

**Actions**:
1. Find user by Stripe customer ID
2. Determine payment mode (subscription vs one-time)
3. Update user tier in database
4. Update Clerk metadata
5. Log subscription start

**Code Flow**:
```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Find user
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (session.mode === "subscription") {
    // Handle Tier 2 subscription
    // - Retrieve subscription details
    // - Map price ID to tier
    // - Update database and Clerk
    // - Log subscription history
  } else if (session.mode === "payment") {
    // Handle Tier 3 one-time payment
    // - Update user to tier3
    // - Update Clerk metadata
    // - Log payment
  }
}
```

---

### customer.subscription.created

**Triggered**: When Stripe creates a new subscription (after checkout)
**Purpose**: Confirm subscription activation

**Actions**:
1. Map price ID to tier (tier2)
2. Update user database record
3. Update Clerk metadata
4. Log subscription creation

---

### customer.subscription.updated

**Triggered**: When subscription details change (upgrade/downgrade, status change)
**Purpose**: Handle tier changes and subscription modifications

**Actions**:
1. Detect tier change (if any)
2. Update user tier in database
3. Update Clerk metadata with new tier
4. Log tier change history
5. Handle subscription status changes (active, past_due, etc.)

**Common Scenarios**:
- User upgrades from $99 to $199 plan
- User downgrades from $199 to $99 plan
- Subscription goes into past_due state (payment failed)
- Subscription resumes after payment retry

---

### customer.subscription.deleted

**Triggered**: When subscription is canceled
**Purpose**: Downgrade user to free tier

**Actions**:
1. Downgrade user to tier1 (free)
2. Clear subscription data (ID, price, period end)
3. Update Clerk metadata to tier1
4. Log cancellation in history
5. (Future) Trigger cancellation email

---

### invoice.payment_succeeded

**Triggered**: When recurring payment succeeds
**Purpose**: Confirm successful billing cycle

**Actions**:
- Log payment success
- (Future) Send payment receipt email
- (Future) Update usage metrics

---

### invoice.payment_failed

**Triggered**: When recurring payment fails
**Purpose**: Handle payment failures

**Actions**:
- Log payment failure
- (Future) Trigger dunning email sequence
- (Future) Notify admin of failed payment

---

## Tier Mapping

The `mapPriceIdToTier()` function converts Stripe Price IDs to AAA Platform tiers:

```typescript
function mapPriceIdToTier(priceId: string): string {
  // Tier 2 mapping
  if (priceId === PRICE_IDS.TIER2_MONTHLY_99 ||
      priceId === PRICE_IDS.TIER2_MONTHLY_199) {
    return "tier2";
  }

  // Tier 3 mapping
  if (priceId === PRICE_IDS.TIER3_ONETIME_2500 ||
      priceId === PRICE_IDS.TIER3_ONETIME_5000) {
    return "tier3";
  }

  // Legacy support
  if (priceId === PRICE_IDS.ARCHITECT_MONTHLY) return "tier2";
  if (priceId === PRICE_IDS.APEX) return "tier3";

  // Default to tier1 for unknown price IDs
  return "tier1";
}
```

---

## Testing

### Local Testing with Stripe CLI

**Install Stripe CLI**:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

**Forward webhooks to local server**:
```bash
# Start your Next.js dev server
npm run dev

# In another terminal, forward webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook secret like:
```
whsec_xxxxxxxxxxxxxxxxxxxxx
```

Add it to your `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Trigger test events**:
```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription creation
stripe trigger customer.subscription.created

# Test payment failure
stripe trigger invoice.payment_failed
```

### Manual Testing Steps

1. **Create Test Subscription**:
   - Go to Stripe Dashboard → Payments
   - Create test subscription for a customer
   - Verify webhook event received in logs
   - Check user tier updated in database
   - Verify Clerk metadata updated

2. **Test Upgrade/Downgrade**:
   - Modify subscription in Stripe Dashboard
   - Change price from $99 to $199
   - Verify tier change logged in `SubscriptionHistory`

3. **Test Cancellation**:
   - Cancel subscription in Stripe Dashboard
   - Verify user downgraded to tier1
   - Check subscription data cleared

4. **Test Idempotency**:
   - Use Stripe CLI to resend same event
   - Verify webhook returns "duplicate: true"
   - Confirm no duplicate database entries

---

## Monitoring & Debugging

### Webhook Logs

Check webhook processing in application logs:

```bash
# Development
npm run dev
# Watch for: "Processing checkout.session.completed", "User X subscribed to tier2", etc.

# Production
# Check Railway/Vercel logs
```

### Stripe Dashboard

Monitor webhooks in Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. View **Recent events** tab
4. Check for failed deliveries (red indicators)
5. Inspect event payloads and responses

### Database Queries

Check webhook processing status:

```sql
-- View all webhook events
SELECT * FROM WebhookEvent ORDER BY createdAt DESC LIMIT 10;

-- View failed webhooks
SELECT * FROM WebhookEvent WHERE processed = false AND attempts > 1;

-- View subscription history for a user
SELECT * FROM SubscriptionHistory WHERE userId = 'user_xxxxx' ORDER BY createdAt DESC;

-- View current user tiers
SELECT clerkId, email, tier, stripeSubscriptionId FROM User WHERE tier != 'tier1';
```

---

## Production Checklist

Before deploying webhooks to production:

### Stripe Configuration
- [ ] Create webhook endpoint in Stripe Dashboard (production mode)
- [ ] Set URL to: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Enable SSL/TLS (required by Stripe)
- [ ] Select required events (see list above)
- [ ] Copy webhook signing secret

### Environment Variables
- [ ] Add `STRIPE_WEBHOOK_SECRET` to production environment
- [ ] Verify `STRIPE_SECRET_KEY` is production key (starts with `sk_live_`)
- [ ] Test webhook URL is accessible from internet

### Testing
- [ ] Test all event types in test mode first
- [ ] Verify idempotency works correctly
- [ ] Confirm user tier updates properly
- [ ] Check Clerk metadata synchronization
- [ ] Test error handling (invalid signature, missing data)

### Monitoring
- [ ] Set up error alerting for failed webhooks
- [ ] Monitor webhook processing times (<5 seconds)
- [ ] Track webhook retry rates
- [ ] Set up dashboard for subscription metrics

---

## Troubleshooting

### Issue: "Invalid signature"

**Cause**: Webhook secret mismatch or expired

**Fix**:
1. Verify `STRIPE_WEBHOOK_SECRET` in `.env` matches Stripe Dashboard
2. If using Stripe CLI, secret changes each time you run `stripe listen`
3. In production, regenerate webhook secret if compromised

### Issue: "No user found for customer"

**Cause**: User checkout completed but user record doesn't exist

**Fix**:
1. Ensure checkout creates Stripe customer before webhook
2. Check that `stripeCustomerId` is saved during checkout
3. Verify user wasn't deleted between checkout and webhook

### Issue: Duplicate subscriptions

**Cause**: Idempotency check failing

**Fix**:
1. Verify `WebhookEvent` table exists and is accessible
2. Check database constraints on `stripeEventId`
3. Ensure webhook processing completes (marks event as processed)

### Issue: Clerk metadata not updating

**Cause**: Invalid Clerk user ID or permissions

**Fix**:
1. Verify `user.clerkId` is valid
2. Check Clerk API key has metadata update permissions
3. Ensure Clerk user exists (wasn't deleted)

### Issue: Webhooks timing out

**Cause**: Processing takes too long (>30 seconds)

**Fix**:
1. Optimize database queries
2. Move heavy operations to background jobs
3. Return 200 quickly, process asynchronously

---

## Future Enhancements

### Email Notifications
```typescript
// Welcome email after subscription
await sendEmail({
  to: user.email,
  template: "subscription_welcome",
  data: { tier, features: TIER_CONFIG[tier].features },
});

// Cancellation email
await sendEmail({
  to: user.email,
  template: "subscription_canceled",
  data: { tier: "tier1", downgradeDate: new Date() },
});
```

### Dunning Management
```typescript
// After payment failure
if (invoice.attempt_count >= 3) {
  // Send final notice
  await sendEmail({ template: "payment_failed_final" });

  // Downgrade user
  await downgradeTier(userId, "tier1");
}
```

### Analytics Integration
```typescript
// Track subscription metrics
await analytics.track({
  event: "subscription_created",
  userId: user.id,
  properties: {
    tier,
    priceId,
    mrr: calculateMRR(tier),
  },
});
```

---

## Related Documentation

- [Stripe Setup Guide](./STRIPE-SETUP-GUIDE.md) - Initial Stripe configuration
- [Stripe Product Reference](./STRIPE-PRODUCT-REFERENCE.md) - Product setup quick reference
- [Authentication Guide](./AUTHENTICATION-GUIDE.md) - Clerk integration details
- [Stripe Webhook Events](https://stripe.com/docs/api/events/types) - Official Stripe docs

---

## Support

**For webhook issues**:
1. Check application logs for error messages
2. Review Stripe Dashboard → Webhooks → Recent events
3. Query `WebhookEvent` table for failed processing
4. Contact Stripe support if signature verification fails repeatedly

**Emergency**:
- Disable webhook in Stripe Dashboard if causing issues
- Re-enable after fixing the problem
- Stripe will retry missed events for up to 3 days

---

**Last Updated**: 2026-02-02
**Implemented By**: Claude Code Assistant
**Status**: ✅ Production Ready
