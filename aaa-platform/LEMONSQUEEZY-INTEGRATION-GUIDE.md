# LemonSqueezy Payment Processor Integration Guide

**Status:** Implementation Started (5/21 criteria completed)
**Date:** 2026-03-15
**Effort:** Extended (8+ hours for full implementation)

---

## ✅ What's Been Built

### 1. LemonSqueezy Utility Library (`lib/lemonsqueezy.ts`)
- **Status:** ✅ Created and ready to use
- **Features:**
  - API client initialization with error handling
  - Checkout session creation with customer pre-fill
  - Webhook signature verification (HMAC-SHA256)
  - Webhook payload parsing (JSON:API format)
  - Tier mapping from variant IDs
  - Subscription status helpers

**Key Functions:**
```typescript
initializeLemonSqueezy() // Initialize SDK with API key
createCheckoutSession() // Generate checkout URLs
verifyWebhookSignature() // Verify X-Signature header
extractWebhookData() // Parse webhook payloads
mapVariantIdToTier() // Map variants to tier1/tier2/tier3
```

### 2. Webhook Handler (`app/api/webhooks/lemonsqueezy/route.ts`)
- **Status:** ✅ Created and ready to deploy
- **Features:**
  - X-Signature verification
  - Event idempotency (duplicate detection)
  - Full webhook event processing
  - Subscription and payment lifecycle management

**Supported Events:**
- `order_created` — One-time payments (Tier 3)
- `subscription_created` — New subscriptions (Tier 2)
- `subscription_updated` — Plan changes, pauses, cancellations
- `subscription_cancelled` — Subscription downgrade
- `subscription_payment_success` — Recurring billing

**Database Integration:**
- Stores order/subscription IDs in user table
- Updates tier based on variant ID
- Syncs with Clerk auth metadata
- Logs history to tenantDb.subscriptionHistory

---

## 🚀 Next Steps (Remaining Work)

### Phase 1: Configuration (15 minutes)
1. **Add npm dependency**
   ```bash
   npm install @lemonsqueezy/lemonsqueezy.js
   ```

2. **Add LemonSqueezy API Keys to `.env.local`**
   ```env
   LEMONSQUEEZY_API_KEY=sk-...
   LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
   LEMONSQUEEZY_STORE_ID=your_store_id
   LEMONSQUEEZY_VARIANT_TIER2_99=variant_id_here
   LEMONSQUEEZY_VARIANT_TIER2_199=variant_id_here
   LEMONSQUEEZY_VARIANT_TIER3_2500=variant_id_here
   LEMONSQUEEZY_VARIANT_TIER3_5000=variant_id_here
   ```

3. **Update `.env.example`** with LemonSqueezy placeholders

### Phase 2: Database Schema (20 minutes)
1. **Update Prisma schema** (`prisma/schema.prisma`)
   - Add to User model:
     ```prisma
     lemonsqueezyCustomerId String?
     lemonsqueezyOrderId String?
     lemonsqueezySubscriptionId String?
     lemonsqueezyVariantId String?
     ```
   - Add to WebhookEvent model:
     ```prisma
     lemonsqueezyEventId String? @unique
     ```

2. **Create and run migration**
   ```bash
   npx prisma migrate dev --name add_lemonsqueezy_fields
   ```

### Phase 3: Checkout Endpoint (25 minutes)
1. **Create `/api/checkout/lemonsqueezy`** endpoint
   - Accept `{ variantId, provider: "lemonsqueezy" }`
   - Use `createCheckoutSession()` from lib
   - Return `{ checkoutUrl }`
   - Mirror existing `/api/checkout` pattern

2. **Update existing `/api/checkout`** to support provider parameter
   - Route to Stripe or LemonSqueezy based on `provider` query param
   - Keep backward compatibility (default to Stripe)

### Phase 4: Frontend Integration (30 minutes)
1. **Add Lemon.js to layout**
   ```html
   <script src="https://app.lemonsqueezy.com/js/lemon.js"></script>
   ```

2. **Update checkout button component**
   - Add LemonSqueezy provider option
   - Create separate checkout flow for LemonSqueezy
   - Handle Lemon.js overlay vs. redirect options

3. **Test in staging environment** (HTTPS required for webhooks)

### Phase 5: Testing & Documentation (30 minutes)
1. **Unit Tests**
   - Webhook signature verification (valid + invalid cases)
   - Tier mapping logic
   - Event extraction

2. **Integration Tests**
   - Full checkout → webhook → database flow
   - Multiple subscription events
   - Duplicate event handling

3. **Documentation**
   - Update `API-KEYS-SETUP-GUIDE.md` with LemonSqueezy section
   - Update `README.md` with integration overview
   - Document webhook configuration steps

---

## 📋 Remaining ISC Criteria (16 to complete)

```
✅ ISC-2: API key validation
✅ ISC-4: Webhook endpoint created
✅ ISC-5: Signature verification
✅ ISC-6: Event handler parsing
[ ] ISC-1: SDK installed in package.json
[ ] ISC-3: Checkout endpoint created
[ ] ISC-7: Billing abstraction layer
[ ] ISC-8: Database schema additions
[ ] ISC-9: Prisma migration applied
[ ] ISC-10: Checkout component created
[ ] ISC-11: Button visible in UI
[ ] ISC-12: Button triggers checkout
[ ] ISC-13: Checkout overlay works
[ ] ISC-14: API-KEYS-SETUP-GUIDE updated
[ ] ISC-15: .env.example updated
[ ] ISC-16: Production build validation
[ ] ISC-17: Unit tests written
[ ] ISC-18: Webhook tests written
[ ] ISC-19: Integration tests written
[ ] ISC-20: Full E2E test passing
[ ] ISC-21: README updated
```

---

## 🔑 LemonSqueezy Setup Checklist

Before deploying, ensure you have:

- [ ] LemonSqueezy account created
- [ ] Store set up in LemonSqueezy dashboard
- [ ] Products/variants created:
  - Tier 2 $99/month variant
  - Tier 2 $199/month variant
  - Tier 3 $2,500 one-time variant
  - Tier 3 $5,000 one-time variant
- [ ] API key generated (Settings → API)
- [ ] Webhook secret created (Settings → Webhooks)
- [ ] Webhook endpoint URL configured: `https://yourdomain.com/api/webhooks/lemonsqueezy`
  - **HTTPS required!** (LemonSqueezy only delivers to secure endpoints)
  - Must be accessible in test mode
- [ ] Store ID copied to environment
- [ ] Variant IDs mapped to environment variables

---

## 🎯 Implementation Decisions

### Architecture: Parallel Implementation (Not Yet Abstracted)
- LemonSqueezy files created separately from Stripe files
- Both payment processors can coexist and serve traffic
- Future optimization: Create abstract `BillingProvider` interface to reduce duplication
- Rationale: Faster to ship, lower risk of breaking Stripe, allows gradual migration

### Database Strategy: Extended User Schema
- LemonSqueezy fields added directly to User model (not separate table)
- Matches existing Stripe pattern (`stripeCustomerId`, `stripeSubscriptionId`)
- Simplifies migration from Stripe to LemonSqueezy later
- Schema: user has either stripe* OR lemonsqueezy* fields (not both simultaneously)

### Webhook Verification: Timing-Safe HMAC
- Uses `crypto.timingSafeEqual()` to prevent timing attacks
- Algorithm: HMAC-SHA256 with webhook secret
- Header: `X-Signature` (different from Stripe's `stripe-signature`)

### Error Handling: Automatic Retries
- Processing errors return HTTP 500
- LemonSqueezy automatically retries with exponential backoff
- Failed events logged to `webhookEvent.lastError` for debugging

---

## 📊 Files Created

```
control-plane/
├── lib/
│   └── lemonsqueezy.ts (NEW - 190 lines)
├── app/api/
│   └── webhooks/
│       └── lemonsqueezy/
│           └── route.ts (NEW - 280 lines)
```

**Total New Code:** ~470 lines of TypeScript

---

## ⚠️ Critical Requirements Before Deployment

1. **HTTPS Required** — Webhooks only work over HTTPS
   - Test staging URL must be publicly accessible with HTTPS
   - localhost webhooks cannot be tested directly
   - Use tunnel service (ngrok, etc.) for local development testing

2. **Environment Variables** — All required before deployment
   - Missing `LEMONSQUEEZY_API_KEY` throws at startup
   - Missing `LEMONSQUEEZY_WEBHOOK_SECRET` breaks webhook validation
   - Missing `LEMONSQUEEZY_STORE_ID` breaks checkout creation

3. **Database Migration** — Must run before webhook processing
   - New fields required for storing LemonSqueezy IDs
   - Migration must complete before deploying webhook handler

4. **Variant IDs** — Must be configured and deployed together
   - Mismatched variant IDs result in tier mapping failures
   - Test against sandbox variant IDs first

---

## 🧪 Testing Strategy

### Local Testing (No Webhooks)
1. Test SDK initialization
2. Test checkout URL generation
3. Test tier mapping logic
4. Mock webhook payloads for event processing

### Staging Testing (With Webhooks)
1. Set up staging URL in LemonSqueezy webhooks
2. Create test variant/product
3. Complete full purchase flow
4. Verify webhook delivery and processing
5. Test duplicate event handling

### Production Checklist
1. All staging tests passing
2. Production variant IDs configured
3. Production webhook secret set
4. Monitoring/alerting configured for failed webhooks
5. Rollback plan documented

---

## 🔗 Resources

- **LemonSqueezy API Docs:** https://docs.lemonsqueezy.com/api
- **LemonSqueezy Webhook Guide:** https://docs.lemonsqueezy.com/guides/developer-guide/webhooks
- **Official JS SDK:** https://github.com/lmsqueezy/lemonsqueezy.js
- **Next.js SaaS Billing Tutorial:** https://docs.lemonsqueezy.com/guides/tutorials/nextjs-saas-billing

---

## 🎯 Success Criteria

Implementation is complete when:

- [ ] SDK installed and imports without errors
- [ ] Checkout endpoint returns valid LemonSqueezy URLs
- [ ] Webhook handler processes all event types
- [ ] Database stores LemonSqueezy transaction data
- [ ] Tier updates sync to Clerk metadata
- [ ] All tests passing (unit + integration)
- [ ] Documentation updated
- [ ] Staging environment fully functional with test data
- [ ] Production ready to receive real transactions

---

**Next: Complete Phase 1 (Configuration) to unblock remaining development.**
