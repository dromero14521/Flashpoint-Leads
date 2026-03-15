# Stripe to Wise API Migration - Executive Summary

**Project:** Apex Automation Agency Platform
**Date:** March 14, 2026
**Duration:** 8 days | ~40 hours | 23 story points
**Team:** 1-2 developers

---

## What We're Doing

Replacing Stripe payment processing with Wise API for handling one-time payments and subscriptions in the AAA Platform. This enables international payment support and reduces payment processing costs.

---

## Current State (Stripe)

### Architecture
- Stripe hosted checkout (user redirected to Stripe domain for card entry)
- Real-time payment processing
- Webhook-based subscription updates
- Built-in customer portal for billing management
- 6 webhook event types handled

### Key Files
```
Backend:
  /lib/stripe.ts                          (112 lines)
  /app/api/checkout/route.ts              (89 lines)
  /app/api/webhooks/stripe/route.ts       (468 lines)
  /app/api/billing/portal/route.ts        (32 lines)

Frontend:
  /app/dashboard/settings/page.tsx        (Manage Billing button)
  /app/page.tsx                           (Pricing display)
```

### Database Fields
- `stripeCustomerId` - Customer identifier
- `stripeSubscriptionId` - Active subscription
- `stripePriceId` - Product pricing
- `stripeCurrentPeriodEnd` - Renewal date

---

## New State (Wise)

### Architecture
- Wise hosted payment links (user redirected to Wise domain for payment)
- No built-in subscription management (manual renewals)
- Webhook-based payment confirmation
- No customer portal (manual cancellations via support)
- 2+ webhook event types handled

### Files to Create
```
New:
  /lib/wise.ts                            (150 lines)
  /app/api/webhooks/wise/route.ts         (200 lines)
  /tests/wise.test.ts                     (150 lines)
  /tests/integration/checkout.test.ts     (100 lines)
  /tests/integration/webhook.test.ts      (120 lines)
```

### Files to Modify
```
Modify:
  /app/api/checkout/route.ts              (Replace Stripe with Wise)
  /app/api/billing/portal/route.ts        (Remove or simplify)
  /app/dashboard/settings/page.tsx        (Remove Stripe portal redirect)
  /prisma/schema.prisma                   (Rename columns)
  /package.json                           (Remove stripe, add wise)
  /API-KEYS-SETUP-GUIDE.md               (Update instructions)
```

### Database Fields (New)
- `wiseRecipientId` - Payment recipient
- `wiseTransferId` - Transfer identifier
- `wiseAmountUSD` - Amount paid
- `wisePaidAt` - Payment completion date

### Deleted Files
```
Delete:
  /lib/stripe.ts
  /app/api/webhooks/stripe/route.ts
```

---

## Key Differences

| Feature | Stripe | Wise |
|---------|--------|------|
| Hosted Checkout | Yes ✓ | Yes ✓ |
| PCI Compliance | Built-in | Via hosted links |
| Subscriptions | Native recurring | Manual renewal |
| Customer Portal | Built-in | None |
| Refunds | Built-in | API available |
| Webhook Events | 6+ types | 2+ types |
| Currency Support | Multi-currency | Multi-currency |
| Integration Complexity | Low | Medium |

---

## Implementation Overview

### Phase 1: Setup (Day 1)
1. Install Wise SDK
2. Configure environment variables
3. Create Wise library wrapper

### Phase 2: Backend (Days 2-3)
1. Update checkout endpoint (Stripe → Wise)
2. Create webhook endpoint for Wise events
3. Migrate database schema
4. Update billing portal endpoint

### Phase 3: Frontend (Days 4-5)
1. Update settings page (remove Stripe portal)
2. Update error handling
3. Verify checkout flow
4. Test success redirect

### Phase 4: Testing (Days 6-7)
1. Unit tests for Wise library
2. Integration tests for checkout flow
3. Integration tests for webhooks
4. Manual E2E testing
5. Security audit

### Phase 5: Cleanup (Day 8)
1. Remove Stripe references
2. Update documentation
3. Database migration verification
4. Staging deployment & smoke tests

---

## What Stays the Same

✓ User authentication (Clerk)
✓ Tier system (tier1, tier2, tier3)
✓ Feature gating (blueprint limits, etc.)
✓ Dashboard UI/UX
✓ Settings page layout
✓ Landing page
✓ Pricing display

---

## What Changes

✗ Payment provider API
✗ Checkout flow (different redirect)
✗ Billing management (no self-service portal)
✗ Webhook structure
✗ Database column names
✗ Error messages & handling
✗ API endpoints

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Webhook delivery failure | Implement idempotency, logging, retry mechanism |
| Payment processing delays | Use Wise sandbox for testing, monitor production |
| User confusion on new flow | Clear messaging, same user experience for checkout |
| Data migration errors | Backup database, test migration on staging first |
| API rate limits | Implement exponential backoff, caching |

---

## Success Metrics

After deployment, verify:

- ✓ 100% of payments processed via Wise
- ✓ Webhook processing 99%+ successful
- ✓ User tier updates within 1 minute of payment
- ✓ Zero duplicate transactions
- ✓ Feature gates enforcing tier limits correctly
- ✓ Dashboard shows correct subscription info
- ✓ No payment failures unrelated to user actions

---

## Timeline & Milestones

| Milestone | Target Date | Owner |
|-----------|------------|-------|
| Setup complete | Day 1 | Backend dev |
| Backend migration done | Day 3 | Backend dev |
| Frontend updates done | Day 5 | Frontend dev |
| All tests passing | Day 7 | Full team |
| Production ready | Day 8 | Full team |

---

## Go/No-Go Criteria

**GO if:**
- All tests passing (unit + integration + E2E)
- Security audit completed
- Staging deployment successful
- No critical blockers

**NO-GO if:**
- Webhook reliability <95%
- User tier updates failing
- Data migration issues
- Security vulnerabilities found

---

## Post-Deployment Tasks

**Week 1:**
- Monitor webhook processing (check logs hourly)
- Monitor payment success rate
- Gather user feedback on payment flow
- Monitor error logs for unexpected issues

**Week 2:**
- Review analytics (payment volume, success rate)
- Performance optimization if needed
- Update support docs with new flow
- Archive Stripe implementation

---

## Deliverables

**Documents:**
1. ✓ FRONTEND-REFACTORING-PLAN.md (comprehensive technical plan)
2. ✓ WISE-MIGRATION-TASK-LIST.md (day-by-day developer checklist)
3. ✓ WISE-API-TECHNICAL-REFERENCE.md (API implementation guide)
4. ✓ MIGRATION-SUMMARY.md (this document)

**Code:**
1. `/lib/wise.ts` - Wise API wrapper
2. `/app/api/webhooks/wise/route.ts` - Webhook handler
3. Updated checkout and billing endpoints
4. Updated database schema & migrations
5. Unit & integration tests
6. Updated documentation

---

## Questions for Stakeholders

1. **Subscription renewals:** Should we auto-trigger new payments on renewal dates, or email users to manually upgrade?
2. **Customer support:** Who handles cancellation requests if there's no Wise portal?
3. **Refunds:** Should we implement refund functionality day 1 or after migration?
4. **International:** Should we support multi-currency payments or USD-only?
5. **Timeline:** Any date constraints for going live?

---

## Assumptions

- Wise API docs accurate as of March 2026
- Node.js 20+ available for deployment
- Database supports migrations
- Wise webhook delivery reliable
- No additional payment methods needed (card-only)
- USD primary currency for now

---

## References

- Stripe integration currently in: `/control-plane/lib/stripe.ts`
- Current checkout flow: `/control-plane/app/api/checkout/route.ts`
- Webhook handling: `/control-plane/app/api/webhooks/stripe/route.ts`
- API setup guide: `/API-KEYS-SETUP-GUIDE.md`
- Full refactoring plan: `./FRONTEND-REFACTORING-PLAN.md`
- Developer task list: `./WISE-MIGRATION-TASK-LIST.md`
- Technical reference: `./WISE-API-TECHNICAL-REFERENCE.md`

---

**Status:** Ready for developer assignment
**Next Step:** Assign to backend and frontend developers, schedule kickoff meeting
