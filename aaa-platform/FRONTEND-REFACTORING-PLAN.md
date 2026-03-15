# Frontend Refactoring Plan: Stripe to Wise API Migration

**Project:** Apex Automation Agency Platform
**Date:** March 2026
**Status:** Planning Phase
**Scope:** Replace Stripe payment processing with Wise API

---

## Executive Summary

This document outlines the frontend migration work to replace Stripe with Wise API for payment processing. The refactoring will maintain current UX while adapting to Wise's different payment architecture and limitations.

**Key Difference:** Stripe provides hosted checkout (redirect flow), while Wise API requires server-side transfer creation with client-side bank details submission or hosted payment links. This impacts the entire checkout flow.

---

## Part 1: Current Stripe Integration Audit

### 1.1 Identified Stripe Components

**Backend Integration Points:**
- `/control-plane/lib/stripe.ts` - Stripe initialization, helper functions
  - `getStripe()` - Singleton Stripe instance
  - `createCheckoutSession()` - Creates Stripe checkout sessions (redirect-based)
  - `createCustomerPortalSession()` - Billing portal access
  - `getOrCreateCustomer()` - Customer management
  - `PRICE_IDS` - Environment-based pricing
  - `TIER_CONFIG` - Pricing tier definitions

- `/control-plane/app/api/checkout/route.ts` - Checkout initiation
  - Authenticates user via Clerk
  - Gets/creates Stripe customer
  - Determines pricing tier (tier2=subscription, tier3=one-time)
  - Creates checkout session → returns redirect URL

- `/control-plane/app/api/webhooks/stripe/route.ts` - Webhook processing
  - Verifies webhook signatures
  - Handles 6 event types:
    - `checkout.session.completed` - Order fulfillment
    - `customer.subscription.created/updated/deleted` - Subscription management
    - `invoice.payment_succeeded/failed` - Payment status
  - Updates Prisma database with tier changes
  - Syncs Clerk metadata with subscription status
  - Logs subscription history

- `/control-plane/app/api/billing/portal/route.ts` - Customer portal redirect
  - Creates Stripe billing portal session
  - Allows users to manage subscriptions/payment methods

**Frontend Components:**
- `/control-plane/app/dashboard/settings/page.tsx`
  - Shows current tier and renewal date
  - "Manage Billing" button → calls `/api/billing/portal` → Stripe redirect
  - Displays `stripeCurrentPeriodEnd` for renewal date

- `/control-plane/app/page.tsx` - Landing page
  - Pricing section with tier cards
  - Links to `/sign-up` for checkout (Tier 1 free, Tier 2 trial, Tier 3 book-call)

- `/control-plane/components/feature-gating/UpgradePrompt.tsx` - Feature gating
  - Links to `/pricing` page when features locked
  - Shows upgrade CTAs at feature boundaries

**Environment Variables (Backend Required):**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...  # (Likely unused in current setup)
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TIER2_MONTHLY_99=price_...
STRIPE_PRICE_TIER2_MONTHLY_199=price_...
STRIPE_PRICE_TIER3_ONETIME_2500=price_...
STRIPE_PRICE_TIER3_ONETIME_5000=price_...
```

**Database Schema (Relevant Fields):**
```prisma
// From stripe webhook processing
stripeCustomerId: String?
stripeSubscriptionId: String?
stripePriceId: String?
stripeCurrentPeriodEnd: DateTime?

// Audit trail
WebhookEvent {
  stripeEventId: String (unique)
  eventType: String
  processed: Boolean
  attempts: Int
  lastError: String?
  processedAt: DateTime?
}

SubscriptionHistory {
  userId: String
  stripeSubscriptionId: String
  oldTier: String
  newTier: String
  oldPriceId: String?
  newPriceId: String?
  eventType: String
  status: String
}
```

---

## Part 2: Wise API Payment Flow Analysis

### 2.1 Wise API Capabilities & Limitations

**What Wise Provides:**
- REST API for creating transfers (international payments)
- Recipient management (bank accounts)
- Quote generation (exchange rates, fees)
- Hosted payment links (no-code hosted checkout)
- Webhook support for payment events
- Currency conversion

**What Wise DOESN'T Provide:**
- Direct card tokenization like Stripe Elements
- Subscription/recurring payments (no built-in billing)
- Customer portal for managing payment methods
- Card form components
- PCI-compliant hosted card collection

**PCI Compliance Challenge:**
Wise doesn't securely collect card details. Options:
1. **Use Wise-hosted payment links** (simplest) - No card details on your servers
2. **Use Stripe Elements for cards, then Wise for transfer** (hybrid) - Most flexible
3. **Collect cards with third-party PCI service** (expensive)

**Recommended Approach:** Use Wise-hosted payment links for initial payment, then API for management.

### 2.2 Payment Flow Mapping

**Current Flow (Stripe):**
```
User clicks "Upgrade"
  ↓
POST /api/checkout (tier, priceId)
  ↓
Create Stripe customer + session
  ↓
Return session.url
  ↓
Frontend: window.location.href = session.url
  ↓
Stripe hosted checkout page (card collection)
  ↓
Payment processed
  ↓
Stripe webhook: checkout.session.completed
  ↓
Update user tier in database
  ↓
Redirect to /dashboard?success=true
```

**New Flow (Wise Hosted Links):**
```
User clicks "Upgrade"
  ↓
POST /api/checkout (tier, amount)
  ↓
Create Wise quote (get amount with fees)
  ↓
Create Wise hosted payment link
  ↓
Return payment link URL
  ↓
Frontend: window.location.href = payment_link_url
  ↓
Wise hosted payment page (card collection on Wise domain)
  ↓
Payment processed on Wise side
  ↓
Wise webhook: payment event
  ↓
Verify webhook signature
  ↓
Update user tier in database
  ↓
Redirect to /dashboard?success=true
```

---

## Part 3: Frontend Files to Modify

### 3.1 API Routes (Backend - Priority 1)

| File | Changes | Impact |
|------|---------|--------|
| `/app/api/checkout/route.ts` | Replace Stripe session creation with Wise payment link creation | High - Core checkout flow |
| `/app/api/webhooks/stripe/route.ts` | Create new `/app/api/webhooks/wise/route.ts` for Wise events | High - Payment confirmation |
| `/app/api/billing/portal/route.ts` | Remove (no Wise equivalent) or create custom portal | Medium - Self-service billing |
| `/lib/stripe.ts` | Create `/lib/wise.ts` with Wise SDK utilities | High - Core library |

### 3.2 Frontend Components (User Facing)

| File | Changes | Impact |
|------|---------|--------|
| `/app/dashboard/settings/page.tsx` | Remove "Manage Billing" button (no Wise portal) | Low - Can show static subscription info |
| `/app/page.tsx` | No changes needed (pricing display only) | None |
| `/components/feature-gating/UpgradePrompt.tsx` | No changes needed | None |

### 3.3 Configuration Files

| File | Changes | Impact |
|------|---------|--------|
| `package.json` | Add `wise-api` (or appropriate SDK), remove `stripe` | Medium |
| `.env` | Replace Stripe keys with Wise API keys | Medium |
| Database schema | Rename fields from `stripe*` to `wise*` (or add new columns) | Medium |

---

## Part 4: Wise API Library Implementation

### 4.1 Create `lib/wise.ts`

**Required Functions:**
```typescript
// Initialize Wise client with API key
export function getWise(): WiseClient

// Get quote for amount + conversion
export async function getQuote(
  sourceCurrency: 'USD',
  targetCurrency: 'USD' | 'EUR' | 'GBP',
  amount: number
): Promise<Quote>

// Create hosted payment link
export async function createPaymentLink(
  amount: number,
  reference: string,
  returnUrl: string,
  metadata: Record<string, string>
): Promise<PaymentLink>

// Create transfer (for server-side processing)
export async function createTransfer(
  recipient: Recipient,
  amount: number,
  reference: string
): Promise<Transfer>

// Get transfer status
export async function getTransfer(transferId: string): Promise<Transfer>

// Verify webhook signature
export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean
```

**Placeholder Structure:**
- Initialize Wise API client with `WISE_API_KEY`
- Export functions mirroring Stripe patterns for easier migration
- Handle errors specific to Wise (rate limits, invalid currencies, etc.)

---

## Part 5: Implementation Task Checklist

### Phase 1: Setup & Dependencies (Day 1)

- [ ] **Task 1.1** Install Wise SDK
  - `npm install --save-exact wise-api` (or latest official SDK)
  - Update `package.json` lock file
  - Remove `stripe` dependency if not needed elsewhere

- [ ] **Task 1.2** Set up environment variables
  - Get Wise API token from dashboard
  - Add `WISE_API_KEY` to `.env.local`
  - Add `WISE_WEBHOOK_SECRET` for webhook verification
  - Document required variables in `API-KEYS-SETUP-GUIDE.md`

- [ ] **Task 1.3** Create Wise library wrapper
  - Create `/lib/wise.ts`
  - Implement client initialization
  - Add TypeScript types for Wise responses
  - Export helper functions (quote, payment link, transfer, verify)

---

### Phase 2: Backend API Refactoring (Days 2-3)

- [ ] **Task 2.1** Create Wise checkout endpoint
  - File: `/app/api/checkout/route.ts` (replace existing)
  - Logic:
    1. Auth & get user from Clerk
    2. Get/create user in database
    3. Get tier from request body
    4. Call `getQuote()` with tier amount
    5. Call `createPaymentLink()` with return URL
    6. Return `{ url: paymentLink.url }`
  - **Error handling:** Invalid tier, Wise API errors, network failures
  - **Testing:** Manual checkout flow

- [ ] **Task 2.2** Create Wise webhook endpoint
  - File: `/app/api/webhooks/wise/route.ts` (new file)
  - Logic:
    1. Verify webhook signature with `verifyWebhookSignature()`
    2. Extract payment event (payment.completed, payment.failed, etc.)
    3. Get transfer ID from webhook payload
    4. Call `getTransfer()` to verify final amount/status
    5. Find user by reference ID from webhook metadata
    6. Update user tier based on status
    7. Log to `WebhookEvent` table for idempotency
    8. Return 200 success
  - **Idempotency:** Check `WebhookEvent.wiseEventId` before processing
  - **Webhook events to handle:**
    - `transfer.completed` → user tier upgrade
    - `transfer.failed` → log failure, notify user
    - `transfer.rate_locked` → optional rate notification
  - **Testing:** Mock Wise webhook payloads

- [ ] **Task 2.3** Update user database schema
  - Replace `stripe*` columns with `wise*` columns:
    - `stripeCustomerId` → `wiseRecipientId` (optional, if using recipient mgmt)
    - `stripeSubscriptionId` → `wiseTransferId`
    - `stripePriceId` → `wiseAmountUSD`
    - `stripeCurrentPeriodEnd` → `wisePaidAt` or subscription renewal date
  - Create migration: `prisma migrate dev --name wise_payment_columns`
  - Update `WebhookEvent` to track `wiseEventId` instead of `stripeEventId`

- [ ] **Task 2.4** Create/update billing portal endpoint
  - File: `/app/api/billing/portal/route.ts` (modify)
  - **Option A:** Return static subscription info (no management)
    - Query user's `wiseTransferId` and `tier`
    - Return JSON with subscription status
    - Frontend displays as read-only info
  - **Option B:** Redirect to manual cancellation page
    - Show message: "Contact support to cancel"
    - Or link to support form
  - **Testing:** Verify endpoint returns correct user data

---

### Phase 3: Frontend Components (Days 4-5)

- [ ] **Task 3.1** Update settings page
  - File: `/app/dashboard/settings/page.tsx`
  - Changes:
    1. Remove "Manage Billing" button click handler that calls `/api/billing/portal`
    2. Replace with conditional display:
       - If on paid tier: Show "Contact Support to Manage Billing"
       - Or: Show read-only subscription details
    3. Add link to support email or form
  - **Testing:** Verify no errors on settings page
  - **Screenshot:** Before/after

- [ ] **Task 3.2** Update checkout payment submission
  - File: `/app/dashboard/new-blueprint/page.tsx` (or checkout component)
  - **If there's a checkout modal/component:** (Check if it exists)
    - Replace Stripe Elements with Wise hosted link redirect
    - Remove Stripe card form
  - **If using simple POST:** (Current setup)
    - No frontend changes needed (API handles it)
    - Just verify success redirect works
  - **Testing:** Full purchase flow end-to-end

- [ ] **Task 3.3** Update error handling
  - Files: Any component that calls `/api/checkout`
  - Handle Wise-specific errors:
    - `payment_failed` → "Payment failed, please try again"
    - `invalid_amount` → "Amount too small/large for Wise"
    - `unsupported_currency` → "Currency not supported"
    - `rate_expired` → "Exchange rate expired, try again"
  - **Testing:** Trigger errors and verify messages display

- [ ] **Task 3.4** Update success/redirect flow
  - File: Any checkout success handler (check `/dashboard?success=true`)
  - Verify `session_id` parameter still works (might be `transfer_id` now)
  - Update success message to reflect Wise instead of Stripe
  - **Testing:** Capture payment, verify redirect works

---

### Phase 4: Testing & Validation (Days 6-7)

- [ ] **Task 4.1** Unit tests for Wise library
  - Create `/lib/wise.test.ts` or `/tests/wise.test.ts`
  - Test `getQuote()` with various amounts
  - Test `createPaymentLink()` URL generation
  - Test `verifyWebhookSignature()` with mock signatures
  - **Minimum coverage:** 80%

- [ ] **Task 4.2** Integration test: checkout flow
  - Create test file: `/tests/integration/checkout.test.ts`
  - Steps:
    1. POST `/api/checkout` with tier2 → expect payment link URL
    2. Verify returned URL is valid Wise domain
    3. Verify user created in database
  - **Testing:** Manual + automated

- [ ] **Task 4.3** Integration test: webhook processing
  - Create test file: `/tests/integration/webhook.test.ts`
  - Steps:
    1. Create mock Wise webhook payload (payment.completed)
    2. POST `/api/webhooks/wise` with signed payload
    3. Verify user tier updated in database
    4. Verify second identical webhook is idempotent
  - **Testing:** Use Wise webhook simulator (if available)

- [ ] **Task 4.4** Subscription tier verification
  - Verify users who paid are flagged as `tier2` or `tier3`
  - Verify Clerk metadata updated (if synced)
  - Verify free users still show as `tier1`
  - Check feature gates work correctly
  - **Testing:** Dashboard access, blueprint limits, etc.

- [ ] **Task 4.5** Payment scenarios
  - Test successful one-time payment (Tier 3)
  - Test successful recurring setup (Tier 2 - if implementing)
  - Test failed payment (simulate via Wise sandbox)
  - Test duplicate webhook (idempotency)
  - Test webhook timeout/retry logic
  - **Testing:** Monitor logs for errors

---

### Phase 5: Cleanup & Documentation (Days 8)

- [ ] **Task 5.1** Remove Stripe references
  - Delete `lib/stripe.ts`
  - Delete `/app/api/webhooks/stripe/route.ts`
  - Remove Stripe from `package.json`
  - Search codebase for "stripe" comments/code and remove
  - **Testing:** No build errors

- [ ] **Task 5.2** Update documentation
  - File: `API-KEYS-SETUP-GUIDE.md`
    - Remove Stripe setup section
    - Add Wise API setup section (how to get API token, configure webhook URL)
  - File: `DEPLOYMENT-PLAN.md`
    - Update payment provider section
  - File: `LOCAL-TESTING-GUIDE.md`
    - Add Wise sandbox testing instructions

- [ ] **Task 5.3** Update database migration guide
  - Document `stripe*` → `wise*` column changes
  - Provide rollback plan if needed
  - **Testing:** Migration succeeds on staging environment

- [ ] **Task 5.4** Code review & security audit
  - Ensure webhook signature verification is correct
  - Verify no hardcoded API keys
  - Check error messages don't leak sensitive data
  - Verify CORS/security headers on API endpoints
  - **Testing:** Security review checklist

- [ ] **Task 5.5** Staging environment deployment
  - Deploy to staging first
  - Run smoke tests:
    - Signup works
    - Checkout redirect works
    - Webhook processes correctly
    - User tier updates
  - **Smoke tests:** Manual flow through full purchase

---

## Part 6: File Modification Details

### 6.1 `/app/api/checkout/route.ts` - Replace Content

**Key Changes:**
- Import `getWise()` instead of `stripe`
- Call `createPaymentLink()` instead of `createCheckoutSession()`
- Pass `returnUrl` for redirect after payment
- Return `{ url: paymentLink.url }`

**Before (Stripe):**
```typescript
const session = await createCheckoutSession({
  customerId: customer.id,
  priceId: selectedPriceId,
  mode: 'subscription',
  successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
});
return NextResponse.json({ url: session.url });
```

**After (Wise):**
```typescript
const amount = getTierAmount(tier); // $99, $199, $2500, $5000
const transferId = `trnf_${user.id}_${Date.now()}`;
const paymentLink = await createPaymentLink({
  amount,
  reference: transferId,
  returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&transfer_id=${transferId}`,
  metadata: { userId, tier, userEmail: email }
});
return NextResponse.json({ url: paymentLink.url });
```

### 6.2 `/app/api/webhooks/wise/route.ts` - New File

**Structure:**
```typescript
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/wise';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('x-wise-signature');

  // Verify signature
  if (!verifyWebhookSignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  // Check idempotency
  const existingEvent = await prisma.webhookEvent.findUnique({
    where: { wiseEventId: event.id }
  });

  if (existingEvent?.processed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Process event based on type
  switch (event.type) {
    case 'transfer.completed':
      await handleTransferCompleted(event.data);
      break;
    case 'transfer.failed':
      await handleTransferFailed(event.data);
      break;
  }

  // Mark as processed
  await prisma.webhookEvent.upsert({
    where: { wiseEventId: event.id },
    create: { wiseEventId: event.id, eventType: event.type, processed: true },
    update: { processed: true, processedAt: new Date() }
  });

  return NextResponse.json({ received: true });
}
```

### 6.3 `/lib/wise.ts` - New Library

**Essential Functions:**
```typescript
export async function createPaymentLink({
  amount,
  reference,
  returnUrl,
  metadata
}: {
  amount: number;
  reference: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<{ url: string; linkId: string }> {
  // Call Wise API to create hosted payment link
  // Return link URL
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  // Verify HMAC signature using WISE_WEBHOOK_SECRET
  // Return true if valid
}
```

### 6.4 Database Migrations

**File:** `/prisma/migrations/[timestamp]_wise_payment/migration.sql`

```sql
-- Rename Stripe columns to Wise columns (or add new ones)
ALTER TABLE "User" RENAME COLUMN "stripeCustomerId" TO "wiseRecipientId";
ALTER TABLE "User" RENAME COLUMN "stripeSubscriptionId" TO "wiseTransferId";
ALTER TABLE "User" RENAME COLUMN "stripePriceId" TO "wiseAmountUSD";
ALTER TABLE "User" RENAME COLUMN "stripeCurrentPeriodEnd" TO "wisePaidAt";

-- Update WebhookEvent table
ALTER TABLE "WebhookEvent" RENAME COLUMN "stripeEventId" TO "wiseEventId";
```

**Or** (if keeping both for backward compatibility):
```sql
-- Add new columns
ALTER TABLE "User" ADD COLUMN "wiseTransferId" String;
ALTER TABLE "User" ADD COLUMN "wiseAmountUSD" String;
ALTER TABLE "User" ADD COLUMN "wisePaidAt" DateTime;

-- Update WebhookEvent table
ALTER TABLE "WebhookEvent" ADD COLUMN "wiseEventId" String UNIQUE;
```

---

## Part 7: Testing Checklist

### Unit Tests
- [ ] Wise quote generation returns correct fees
- [ ] Payment link URL is valid
- [ ] Webhook signature verification works with valid/invalid signatures
- [ ] Tier amount mapping (tier2=$99, tier3=$2500, etc.)

### Integration Tests
- [ ] Complete checkout flow (POST `/api/checkout` → payment link URL)
- [ ] Complete payment flow (Wise sandbox payment → webhook → user tier updated)
- [ ] Webhook idempotency (same webhook processed twice = no duplicate tier changes)
- [ ] Error handling (invalid tier → error response)
- [ ] User creation in database during checkout

### E2E Tests (Manual)
- [ ] Sign up → See pricing page
- [ ] Click "Upgrade" → Redirected to Wise payment page
- [ ] Complete payment in Wise sandbox
- [ ] Redirected back to `/dashboard?success=true`
- [ ] Dashboard shows new tier (e.g., "Architect Plan")
- [ ] Settings page shows renewal/paid date
- [ ] Webhook processed (check `WebhookEvent` table)
- [ ] Blueprint limit updated (tier1=3, tier2=unlimited)

### Security Tests
- [ ] Webhook signature verification prevents tampering
- [ ] No API keys in error messages
- [ ] No sensitive data in logs
- [ ] CORS headers set correctly
- [ ] Only authenticated users can access `/api/checkout`

---

## Part 8: Rollback Plan

**If Wise integration fails:**
1. Revert database migration (restore `stripe*` columns)
2. Restore `/lib/stripe.ts` from git history
3. Restore `/app/api/webhooks/stripe/route.ts`
4. Update `/app/api/checkout/route.ts` to use Stripe
5. Redeploy backend
6. Notify affected users

**Estimated rollback time:** 30-60 minutes (with prepared git commits)

---

## Part 9: Sizing & Effort Estimate

| Phase | Tasks | Effort | Days |
|-------|-------|--------|------|
| Setup | Dependencies, env vars, lib creation | 2 points | 1 day |
| Backend | Checkout, webhooks, database schema | 8 points | 2-3 days |
| Frontend | Settings, error handling, redirect | 4 points | 1-2 days |
| Testing | Unit, integration, E2E, security | 6 points | 2 days |
| Cleanup | Documentation, removal, review | 3 points | 1 day |
| **Total** | **23 points** | **~40 hours** | **~8 days** |

**Team Size:** 1-2 developers (parallelizable by backend/frontend split)

---

## Part 10: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Wise API rate limits hit | Low | Medium | Implement exponential backoff, cache quotes |
| Webhook delivery failure | Medium | High | Implement webhook retry logic, dead-letter queue |
| PCI compliance issues | Low | Critical | Use Wise hosted payment links (no card data on servers) |
| User tier updates delayed | Medium | Medium | Log webhook, add manual verification endpoint |
| Currency conversion confusion | Medium | Low | Display final USD amount before payment |

---

## Next Steps

1. **Week 1:** Get Wise API credentials, review API docs
2. **Week 2:** Implement Phase 1 (setup) and Phase 2 (backend)
3. **Week 3:** Implement Phase 3 (frontend) and Phase 4 (testing)
4. **Week 4:** Production deployment with monitoring

---

## Appendix: Environment Variables Checklist

**Current (Stripe):**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_TIER2_MONTHLY_99=price_...
STRIPE_PRICE_TIER2_MONTHLY_199=price_...
STRIPE_PRICE_TIER3_ONETIME_2500=price_...
STRIPE_PRICE_TIER3_ONETIME_5000=price_...
```

**New (Wise):**
```
WISE_API_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
WISE_WEBHOOK_SECRET=webhook_secret_from_dashboard
WISE_RECIPIENT_ID=optional_default_recipient
NEXT_PUBLIC_URL=http://localhost:3000 (for redirect URLs)
```

**Amount Mapping (Hardcoded or Env):**
```
WISE_TIER2_MONTHLY_99=99
WISE_TIER2_MONTHLY_199=199
WISE_TIER3_ONETIME_2500=2500
WISE_TIER3_ONETIME_5000=5000
WISE_CURRENCY=USD
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-14 | Engineer | Initial plan |

