# Wise Migration - Quick Reference Task List

**Prepared for:** Frontend & Backend Developers
**Duration:** 8 days | 23 story points | 1-2 developers
**Date Started:** TBD

---

## Priority Order & Daily Checklist

### Day 1: Setup & Dependencies

```
[ ] Task 1.1: Install Wise SDK
    [ ] npm install wise-api --save-exact
    [ ] Update package-lock.json
    [ ] Verify import works: import Wise from 'wise-api'

[ ] Task 1.2: Get API credentials & set environment
    [ ] Go to Wise Dashboard → API settings
    [ ] Copy API token (keep secret)
    [ ] Copy webhook secret
    [ ] Add to .env.local:
        WISE_API_KEY=<token>
        WISE_WEBHOOK_SECRET=<webhook_secret>
    [ ] Verify .env.local is in .gitignore

[ ] Task 1.3: Create Wise library wrapper
    File: /control-plane/lib/wise.ts
    [ ] Initialize Wise client with API key
    [ ] Export getWise() function
    [ ] Create TypeScript types for API responses
    [ ] Export stub functions:
        - createPaymentLink(amount, reference, returnUrl, metadata)
        - getQuote(sourceCurrency, targetCurrency, amount)
        - verifyWebhookSignature(body, signature)
        - getTransfer(transferId)
    [ ] Add error handling wrappers
```

**End of Day 1 Goal:** Can import from `lib/wise.ts`, environment variables set, no TypeScript errors.

---

### Day 2-3: Backend API Refactoring

```
[ ] Task 2.1: Update checkout endpoint
    File: /app/api/checkout/route.ts
    [ ] Replace createCheckoutSession() with createPaymentLink()
    [ ] Change return value from session.url to paymentLink.url
    [ ] Update Wise payment link creation logic:
        - Get tier from request body
        - Map tier to amount ($99, $199, $2500, $5000)
        - Generate unique reference ID
        - Call createPaymentLink() with return URL
    [ ] Test with curl:
        curl -X POST http://localhost:3000/api/checkout \
          -H "Content-Type: application/json" \
          -d '{"tier":"tier2","priceId":""}'
    [ ] Should return { url: "https://wise.com/..." }

[ ] Task 2.2: Create Wise webhook endpoint
    File: /app/api/webhooks/wise/route.ts (NEW FILE)
    [ ] Create POST handler that:
        [ ] Reads request body
        [ ] Gets x-wise-signature header
        [ ] Calls verifyWebhookSignature()
        [ ] Parses event JSON
        [ ] Checks WebhookEvent table for idempotency (wiseEventId)
        [ ] Routes by event.type:
            - transfer.completed → handleTransferCompleted()
            - transfer.failed → handleTransferFailed()
        [ ] Updates user tier in database
        [ ] Marks event as processed in WebhookEvent
        [ ] Returns { received: true }
    [ ] Add handleTransferCompleted() function:
        [ ] Extract metadata (userId, tier) from transfer
        [ ] Update user.tier, user.wiseTransferId, user.wisePaidAt
        [ ] Update Clerk metadata if clerkId exists
        [ ] Create SubscriptionHistory log entry
        [ ] Handle errors gracefully
    [ ] Test with mock webhook payload

[ ] Task 2.3: Update database schema
    File: /prisma/schema.prisma
    [ ] Option A (Replace): Rename columns
        - stripeCustomerId → wiseRecipientId
        - stripeSubscriptionId → wiseTransferId
        - stripePriceId → wiseAmountUSD
        - stripeCurrentPeriodEnd → wisePaidAt
    [ ] Option B (Add): Keep old columns, add new ones for safety
        - Add wiseTransferId: String?
        - Add wiseAmountUSD: String?
        - Add wisePaidAt: DateTime?
    [ ] Update WebhookEvent model:
        - Change stripeEventId to wiseEventId
    [ ] Run: prisma migrate dev --name wise_payment_columns
    [ ] Verify schema.prisma syntax is valid
    [ ] Check migration file was generated

[ ] Task 2.4: Update billing portal endpoint
    File: /app/api/billing/portal/route.ts
    [ ] Option A (Simple): Return subscription status JSON
        [ ] Query user.wiseTransferId and user.tier
        [ ] Return { tier, paidAt, transferId }
        [ ] Frontend displays as read-only
    [ ] Option B (Support redirect): Return support contact
        [ ] Return { message: "Contact support...", supportUrl: "..." }
    [ ] Test returns correct data for authenticated user
```

**End of Days 2-3 Goal:** Backend API works, webhook ready for testing, database migrated.

---

### Day 4-5: Frontend Components

```
[ ] Task 3.1: Update settings page
    File: /app/dashboard/settings/page.tsx
    [ ] Find "Manage Billing" button (line ~101)
    [ ] Replace onClick handler:
        OLD: handleManageBilling() → calls /api/billing/portal
        NEW: Show "Contact Support" message or link
    [ ] Update Subscription section to show Wise data:
        - Use wisePaidAt instead of stripeCurrentPeriodEnd
        - Display payment method info if available
    [ ] Test: Settings page loads, no console errors
    [ ] Test: Billing section shows correct tier/renewal date

[ ] Task 3.2: Verify checkout flow
    Files: /app/page.tsx, /app/dashboard/new-blueprint/page.tsx
    [ ] Search for stripe references in checkout
    [ ] Verify POST /api/checkout is called (no changes needed)
    [ ] Verify response.json() expects { url: string }
    [ ] Verify window.location.href = response.url redirects to Wise
    [ ] Test: Click "Upgrade" → Redirected to Wise payment link
    [ ] Test: Wise payment link is valid and accessible

[ ] Task 3.3: Update error handling
    Files: Any component with fetch('/api/checkout')
    [ ] Catch response errors:
        [ ] 400 → "Invalid tier selected"
        [ ] 401 → "Please log in first"
        [ ] 500 → "Payment setup failed, try again"
    [ ] Catch Wise-specific errors in API:
        [ ] "unsupported_currency" → "Currency not supported"
        [ ] "amount_too_small" → "Minimum amount is $X"
        [ ] "rate_expired" → "Exchange rate expired, refresh page"
    [ ] Test: Trigger each error and verify message displays

[ ] Task 3.4: Update success redirect
    File: /app/dashboard/page.tsx or checkout success handler
    [ ] Find success redirect (window.location.href = "/dashboard?success=true")
    [ ] Update query params:
        OLD: ?success=true&session_id={CHECKOUT_SESSION_ID}
        NEW: ?success=true&transfer_id={TRANSFER_ID}
    [ ] Update success message:
        OLD: "Your Stripe subscription is active"
        NEW: "Your payment has been processed"
    [ ] Test: Complete payment → Redirected to /dashboard?success=true
    [ ] Test: Success message displays on dashboard
```

**End of Days 4-5 Goal:** All frontend components updated, checkout flow verified end-to-end.

---

### Day 6-7: Testing & Validation

```
[ ] Task 4.1: Unit tests for Wise library
    File: /tests/wise.test.ts (NEW)
    [ ] Test createPaymentLink() returns valid URL
    [ ] Test getQuote() handles various amounts
    [ ] Test verifyWebhookSignature() with valid signature → true
    [ ] Test verifyWebhookSignature() with invalid signature → false
    [ ] Test error handling (API errors, network timeout)
    [ ] Run: npm test -- wise.test.ts
    [ ] Verify all tests pass

[ ] Task 4.2: Integration test - checkout flow
    File: /tests/integration/checkout.test.ts (NEW)
    [ ] Mock: Wise API createPaymentLink()
    [ ] POST /api/checkout with { tier: "tier2" }
    [ ] Assert response: { url: "https://wise.com/..." }
    [ ] Verify user created in test database
    [ ] Verify user tier is "tier2"
    [ ] Run: npm test -- checkout.test.ts
    [ ] Verify all tests pass

[ ] Task 4.3: Integration test - webhook processing
    File: /tests/integration/webhook.test.ts (NEW)
    [ ] Create mock webhook payload (transfer.completed)
    [ ] Mock HMAC signature for webhook
    [ ] POST /api/webhooks/wise with signed payload
    [ ] Assert: user.tier updated to correct tier
    [ ] Assert: user.wiseTransferId populated
    [ ] Assert: WebhookEvent.processed = true
    [ ] Send same webhook twice → Assert second is idempotent
    [ ] Run: npm test -- webhook.test.ts
    [ ] Verify all tests pass

[ ] Task 4.4: Manual E2E test - full purchase flow
    [ ] Start app: npm run dev
    [ ] Sign up with new test account
    [ ] Navigate to pricing or dashboard
    [ ] Click "Upgrade to Architect" (Tier 2)
    [ ] Verify redirected to Wise payment page
    [ ] Use Wise sandbox card: 4242 4242 4242 4242 (or sandbox credentials)
    [ ] Complete payment in Wise UI
    [ ] Verify redirected to /dashboard?success=true
    [ ] Verify dashboard shows "Architect Plan"
    [ ] Check database: user.tier = "tier2", user.wiseTransferId populated
    [ ] Check logs: No errors, webhook processed
    [ ] Test: Blueprint generation works (tier2 = unlimited)

[ ] Task 4.5: Manual E2E test - payment failure scenario
    [ ] Click "Upgrade" again
    [ ] Use invalid Wise payment (or decline in sandbox)
    [ ] Verify redirect to /dashboard?canceled=true
    [ ] Verify error message displays
    [ ] Check database: user.tier still "tier2" (not downgraded)
    [ ] Verify no duplicate transactions

[ ] Task 4.6: Manual E2E test - settings & subscription info
    [ ] Log in as paid user (tier2 or tier3)
    [ ] Navigate to /dashboard/settings
    [ ] Verify "Current Plan" shows "Architect" or "Apex"
    [ ] Verify renewal/paid date displays correctly
    [ ] Verify "Manage Billing" shows support contact (not Stripe portal)
    [ ] Log out and log back in
    [ ] Verify subscription tier persists
```

**End of Days 6-7 Goal:** All tests passing, manual E2E flow verified, payment works end-to-end.

---

### Day 8: Cleanup & Documentation

```
[ ] Task 5.1: Remove Stripe references
    [ ] Delete /lib/stripe.ts
    [ ] Delete /app/api/webhooks/stripe/route.ts
    [ ] Remove "stripe" from package.json dependencies
    [ ] Run: npm install (prune unused packages)
    [ ] Search codebase: grep -r "stripe" /control-plane/
        [ ] Remove any remaining imports
        [ ] Remove comments mentioning Stripe
        [ ] Fix any broken imports
    [ ] Run: npm run build (verify no TypeScript errors)

[ ] Task 5.2: Update documentation
    File: /API-KEYS-SETUP-GUIDE.md
    [ ] Remove "Stripe Setup" section
    [ ] Add "Wise API Setup" section:
        - How to get API token from Wise Dashboard
        - How to configure webhook URL
        - How to get webhook secret
        - Example .env configuration

    File: /DEPLOYMENT-PLAN.md
    [ ] Find payment provider section
    [ ] Replace Stripe with Wise
    [ ] Update environment variable names

    File: /LOCAL-TESTING-GUIDE.md
    [ ] Add "Testing Wise Payments" section
    [ ] Document Wise sandbox credentials
    [ ] Document how to mock webhooks locally

[ ] Task 5.3: Verify database migration
    [ ] Run migration on staging: prisma migrate deploy
    [ ] Verify all columns renamed/added correctly
    [ ] Query existing users: SELECT id, tier, wiseTransferId FROM "User" LIMIT 5
    [ ] Verify no data loss

[ ] Task 5.4: Security audit
    [ ] Verify WISE_API_KEY not in logs: grep -r "WISE_API_KEY" /logs/
    [ ] Verify webhook signature always verified (no bypasses)
    [ ] Verify error messages don't leak sensitive data
    [ ] Check /app/api/checkout requires auth (auth() check)
    [ ] Check /app/api/webhooks/wise doesn't require auth (webhooks are public)
    [ ] Verify webhook secret is strong (32+ random chars)
    [ ] Run security scan: npm audit (fix any vulnerabilities)

[ ] Task 5.5: Staging deployment & smoke tests
    [ ] Deploy to staging environment
    [ ] Run smoke test suite:
        [ ] POST /api/checkout → { url: "..." }
        [ ] Webhook processing → user.tier updated
        [ ] Settings page loads without errors
        [ ] Blueprint generation works
    [ ] Monitor logs for errors: tail -f /var/log/app.log
    [ ] Get sign-off from QA or product team
```

**End of Day 8 Goal:** Production-ready, fully documented, all tests passing, ready for deployment.

---

## Files to Create/Modify Summary

### Create (New Files)
- `lib/wise.ts` - Wise API wrapper library
- `app/api/webhooks/wise/route.ts` - Webhook endpoint
- `tests/wise.test.ts` - Unit tests
- `tests/integration/checkout.test.ts` - Integration test
- `tests/integration/webhook.test.ts` - Integration test

### Modify (Existing Files)
- `app/api/checkout/route.ts` - Use Wise instead of Stripe
- `app/api/billing/portal/route.ts` - Remove Stripe portal redirect
- `app/dashboard/settings/page.tsx` - Update billing section
- `prisma/schema.prisma` - Rename columns or add new ones
- `package.json` - Remove stripe, add wise-api
- `.env.local` - Add Wise credentials
- `API-KEYS-SETUP-GUIDE.md` - Update instructions
- `DEPLOYMENT-PLAN.md` - Update payment provider info
- `LOCAL-TESTING-GUIDE.md` - Add Wise testing section

### Delete (Remove Files)
- `lib/stripe.ts`
- `app/api/webhooks/stripe/route.ts`

---

## Key Code Patterns

### Pattern 1: Creating a Payment Link (Backend)
```typescript
import { createPaymentLink } from '@/lib/wise';

const link = await createPaymentLink({
  amount: 99.00,
  reference: `user_${user.id}_${Date.now()}`,
  returnUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
  metadata: { userId: user.id, tier: 'tier2' }
});

return NextResponse.json({ url: link.url });
```

### Pattern 2: Processing Webhook (Backend)
```typescript
import { verifyWebhookSignature } from '@/lib/wise';

const body = await request.text();
const signature = headers().get('x-wise-signature');

if (!verifyWebhookSignature(body, signature)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}

const event = JSON.parse(body);
// Handle event...
```

### Pattern 3: Redirecting to Payment (Frontend)
```typescript
const response = await fetch('/api/checkout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tier: 'tier2' })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Wise payment page
```

---

## Common Gotchas & Solutions

| Gotcha | Solution |
|--------|----------|
| Wise API key in console.log | Use environment variable, never stringify in logs |
| Webhook signature doesn't verify | Check webhook secret is correct, verify HMAC algorithm |
| User tier not updating | Check webhook is actually being sent, verify database update query |
| Duplicate payments | Implement idempotency check using reference ID |
| Currency conversion unexpected | Always show user final USD amount before payment |
| Payment link expires | Regenerate link if returning to checkout after timeout |

---

## Questions During Implementation?

1. **Where do I get the Wise API key?** → Wise Dashboard → Settings → API
2. **How do I test webhooks locally?** → Use Wise webhook simulator or ngrok tunnel + Wise sandbox
3. **What if Wise API fails?** → Return 500, log error, user can retry checkout
4. **Do we need subscription management?** → No, Wise doesn't support recurring. Manual renewal or trigger new payment.
5. **What about refunds?** → Implement separate refund endpoint using Wise transfer refund API

---

## Success Criteria (Ready for Production)

- [ ] All 23 tasks completed
- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] E2E flow tested manually: signup → payment → tier updated → success
- [ ] Webhook idempotency verified
- [ ] Error handling for all Wise API failures
- [ ] Documentation updated
- [ ] Security audit passed
- [ ] Staging deployment successful
- [ ] Code review approved
- [ ] Ready for production deployment

---

## Post-Deployment Monitoring

**First 24 hours:**
- [ ] Monitor webhook processing: Check WebhookEvent table for failures
- [ ] Monitor errors: Search logs for "ERROR" or "Wise"
- [ ] Monitor user tier updates: Verify tier2/tier3 users can access features
- [ ] Monitor API latency: Payment link creation should be <500ms
- [ ] Monitor payment success rate: Track successful vs failed payments

**First week:**
- [ ] Gather user feedback on payment flow
- [ ] Monitor billing/subscription inquiries
- [ ] Check for any missed Stripe references in code
- [ ] Monitor feature gate enforcement (tier limits)

---

## Version History

| Version | Date | Status |
|---------|------|--------|
| 1.0 | 2026-03-14 | Draft for review |

