# Stripe Product Configuration Quick Reference
## AAA Platform - 3-Tier Pricing Model

**Last Updated**: 2026-02-02
**For**: Quick copy-paste into Stripe Dashboard

---

## Product Configuration Matrix

| Tier | Product Name | Price | Billing | Features |
|------|--------------|-------|---------|----------|
| **Tier 1** | AAA Freemium | $0 | N/A | In-app feature gating |
| **Tier 2A** | AAA Core Subscription - Individual | $99 | Monthly | Unlimited blueprints, APIs, support |
| **Tier 2B** | AAA Core Subscription - Team | $199 | Monthly | Tier 2A + 5 team members |
| **Tier 3A** | Apex Implementation - Single Project | $2,500 | One-time | Strategy, custom blueprint, 30d support |
| **Tier 3B** | Apex Implementation - Complete | $5,000 | One-time | Tier 3A + multi-system, 90d support |

---

## Stripe Dashboard Setup (Copy-Paste Ready)

### Product 1: Tier 2A - Individual ($99/month)

```
Name: AAA Core Subscription - Individual

Description: Transform your business with AI-powered automation blueprints. Includes unlimited blueprint generations, API integrations with Zapier, Notion, and ClickUp, priority support, and custom branding.

Pricing model: Standard pricing
Price: $99.00 USD
Billing period: Monthly
Payment options: Card

Statement descriptor: AAA Core Sub
```

**Environment Variable**:
```bash
STRIPE_PRICE_TIER2_MONTHLY_99=price_[COPY_FROM_STRIPE]
```

---

### Product 2: Tier 2B - Team ($199/month)

```
Name: AAA Core Subscription - Team

Description: Everything in Individual plan plus support for up to 5 team members. Perfect for small businesses and agencies looking to scale their automation practices.

Pricing model: Standard pricing
Price: $199.00 USD
Billing period: Monthly
Payment options: Card

Statement descriptor: AAA Team Sub
```

**Environment Variable**:
```bash
STRIPE_PRICE_TIER2_MONTHLY_199=price_[COPY_FROM_STRIPE]
```

---

### Product 3: Tier 3A - Single Project ($2,500)

```
Name: Apex Implementation Service - Single Project

Description: White-glove implementation service includes: 1-on-1 strategy session using our proven "Hurt & Heal" framework, custom automation blueprint created by experts, done-for-you implementation support, and 30-day follow-up to ensure success.

Pricing model: Standard pricing
Price: $2,500.00 USD
Billing period: One time
Payment options: Card

Statement descriptor: AAA Apex Single
```

**Environment Variable**:
```bash
STRIPE_PRICE_TIER3_ONETIME_2500=price_[COPY_FROM_STRIPE]
```

---

### Product 4: Tier 3B - Complete Transformation ($5,000)

```
Name: Apex Implementation Service - Complete Transformation

Description: Our flagship offering for serious business transformation. Includes everything in Single Project plus multi-system integration assistance, ongoing optimization, and 90 days of dedicated support. Ideal for businesses ready to revolutionize their operations.

Pricing model: Standard pricing
Price: $5,000.00 USD
Billing period: One time
Payment options: Card

Statement descriptor: AAA Apex Complete
```

**Environment Variable**:
```bash
STRIPE_PRICE_TIER3_ONETIME_5000=price_[COPY_FROM_STRIPE]
```

---

## Webhook Configuration

### Required Events

Select these events when creating webhook endpoint:

**Critical** (must have):
```
☑ checkout.session.completed
☑ customer.subscription.created
☑ customer.subscription.updated
☑ customer.subscription.deleted
☑ invoice.payment_succeeded
☑ invoice.payment_failed
```

**Recommended** (for better UX):
```
☑ customer.subscription.trial_will_end
☑ invoice.payment_action_required
☑ payment_intent.payment_failed
```

---

## Customer Portal Settings

Navigate to: **Settings** → **Billing** → **Customer portal**

**Enable**:
- ✅ Update payment method
- ✅ Cancel subscription (at end of billing period)
- ✅ Switch plans (upgrades & downgrades)
- ✅ View invoice history
- ✅ Download invoices

**Allowed Subscription Changes**:
```
From Tier 2A ($99) → To Tier 2B ($199): Upgrade immediately, prorate
From Tier 2B ($199) → To Tier 2A ($99): Downgrade at period end
```

---

## Tax Configuration (Optional)

If you're collecting sales tax:

1. Go to **Settings** → **Tax**
2. Enable **Stripe Tax**
3. Configure tax collection:
   ```
   ☑ Automatic tax calculation
   ☑ Collect tax in all applicable locations
   ☑ Display tax breakdown on invoices
   ```

---

## Pricing Strategy Notes

### Tier 1 (Free) - Feature Limits

Enforced in application code:
- 3 blueprint generations per month
- No API integrations
- Basic templates only
- "Powered by AAA" watermark
- Email support only

### Tier 2 Conversion Triggers

Show upgrade prompts when free users:
- Hit 3rd blueprint generation
- Attempt to access integrations
- Try to remove watermark
- Request priority support

### Tier 3 Qualification

High-ticket sales require qualification:
- Book strategy call first
- Use "Hurt & Heal" framework
- Quantify pain (cost of inaction)
- Only offer if $10k+ pain identified

---

## Revenue Tracking

### Month 6 Target: $50,000/month

**Breakdown**:
- 250 Tier 2 subscribers × $100 avg = $25,000 MRR
- 10 Tier 3 clients × $2,500 avg = $25,000 one-time

**Key Metrics to Monitor**:
```
• MRR (Monthly Recurring Revenue)
• Churn rate (target: <5%)
• Customer Lifetime Value (LTV)
• Customer Acquisition Cost (CAC)
• LTV:CAC ratio (target: >3:1)
```

---

## Testing Checklist

Use test mode for all development:

### Test Cards

**Success**:
```
4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

**3D Secure** (requires authentication):
```
4000 0025 0000 3155
```

**Decline**:
```
4000 0000 0000 9995
```

### Test Flows

- [ ] Subscribe to Tier 2A ($99/month)
- [ ] Subscribe to Tier 2B ($199/month)
- [ ] Purchase Tier 3A ($2,500)
- [ ] Purchase Tier 3B ($5,000)
- [ ] Upgrade from Tier 2A to Tier 2B
- [ ] Downgrade from Tier 2B to Tier 2A
- [ ] Cancel subscription
- [ ] Update payment method
- [ ] Handle failed payment
- [ ] Verify webhook receives all events

---

## Production Readiness

Before switching to production mode:

**Business Verification** (in Stripe Dashboard):
- [ ] Business name and address
- [ ] Tax ID (EIN for US)
- [ ] Bank account connected
- [ ] Identity verification complete

**Security**:
- [ ] Generate new production API keys
- [ ] Update .env with production keys
- [ ] Configure production webhook (HTTPS required)
- [ ] Enable 3D Secure authentication

**Legal**:
- [ ] Terms of Service URL
- [ ] Privacy Policy URL
- [ ] Refund policy defined
- [ ] Email receipts configured

---

## Support Resources

- **Stripe Dashboard**: https://dashboard.stripe.com
- **API Documentation**: https://stripe.com/docs/api
- **Testing Guide**: https://stripe.com/docs/testing
- **Webhook Events**: https://stripe.com/docs/api/events/types

---

## Related Files

- `lib/stripe.ts` - Stripe helper functions
- `app/api/checkout/route.ts` - Checkout session creation
- `app/api/webhooks/stripe/route.ts` - Webhook handler (TASK-006)
- `docs/STRIPE-SETUP-GUIDE.md` - Detailed setup instructions

---

**Next Steps After Setup**:
1. Complete TASK-006 (Stripe Webhook Handler)
2. Implement TASK-009 (Feature Gating)
3. Build pricing page UI
4. Create upgrade prompts for Tier 1 users
