# TASK-005: Configure Stripe Products & Pricing

**Status**: TODO
**Priority**: CRITICAL
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 4-6 hours
**Dependencies**: TASK-001, TASK-004
**Assigned To**: Unassigned

---

## Objective

Create and configure all three pricing tiers in Stripe to enable subscription management and one-time payments for the AAA platform.

---

## Description

Per the GEMINI.md revenue model, the platform has three distinct pricing tiers that must be configured in Stripe:
- **Tier 1 (Freemium)**: $0 - "Crippleware" for market capture
- **Tier 2 (Core Subscription)**: $99-199/month - Primary recurring revenue
- **Tier 3 (Apex Implementation)**: $2,500-5,000 - High-ticket one-time fee

**Revenue Target**: 10 Tier 3 clients + 250 Tier 2 subscribers = $50k/month

---

## Acceptance Criteria

- [ ] Stripe account created and verified
- [ ] Test mode products created first (for development)
- [ ] Production mode products created
- [ ] **Tier 1 Product** configured:
  - Name: "AAA Freemium"
  - Price: $0
  - Type: Subscription (free tier)
  - Features: Limited blueprint generations, basic templates
- [ ] **Tier 2 Product** configured:
  - Name: "AAA Core Subscription"
  - Price: $99/month and $199/month variants
  - Type: Recurring subscription
  - Features: Unlimited blueprints, premium integrations
- [ ] **Tier 3 Product** configured:
  - Name: "Apex Implementation Service"
  - Price: $2,500 (base) and $5,000 (premium) variants
  - Type: One-time payment
  - Features: White-glove implementation, custom strategy session
- [ ] Price IDs stored in environment variables
- [ ] Checkout session creation tested
- [ ] Subscription upgrade/downgrade flows planned
- [ ] Documentation: `docs/STRIPE-SETUP-GUIDE.md`

---

## Technical Implementation

### Stripe Product Configuration

**Via Stripe Dashboard**:
1. Navigate to Products → Add Product
2. Create each product with pricing details
3. Copy Price IDs for .env configuration

**Environment Variables**:
```bash
# .env
STRIPE_PRICE_TIER1_FREE=price_xxxxxxxxxxxxx
STRIPE_PRICE_TIER2_MONTHLY_99=price_xxxxxxxxxxxxx
STRIPE_PRICE_TIER2_MONTHLY_199=price_xxxxxxxxxxxxx
STRIPE_PRICE_TIER3_ONETIME_2500=price_xxxxxxxxxxxxx
STRIPE_PRICE_TIER3_ONETIME_5000=price_xxxxxxxxxxxxx
```

### Checkout Session Creation

```typescript
// app/api/checkout/route.ts
import Stripe from "stripe";
import { auth } from "@clerk/nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { userId } = auth();
  const { priceId, tier } = await req.json();

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: tier === "tier3" ? "payment" : "subscription",
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing?canceled=true`,
    metadata: {
      userId,
      tier,
    },
  });

  return Response.json({ sessionId: session.id });
}
```

---

## Pricing Strategy Notes

### Tier 1 (Freemium) - $0
**Purpose**: Market capture, lead generation
**Limitations**:
- 3 blueprint generations per month
- No API integrations
- Basic templates only
- "Powered by AAA" watermark

**Conversion Strategy**:
- Upgrade prompts after limit reached
- Showcase Tier 2 features in UI (locked icons)
- Email nurture sequence highlighting pain of limitations

### Tier 2 (Core Subscription) - $99-$199/month
**Purpose**: Recurring revenue base, SaaS valuation driver
**Features**:
- Unlimited blueprint generations
- API integrations (Zapier, Notion, ClickUp)
- Priority support
- No watermarks

**Pricing Variants**:
- $99/month: Individual/solopreneur
- $199/month: Small team (up to 5 users)

### Tier 3 (Apex Implementation) - $2,500-$5,000
**Purpose**: High-ticket cash injection, premium positioning
**Features**:
- 1-on-1 strategy session (using "Hurt and Heal" framework)
- Custom blueprint creation by experts
- Implementation support
- 30-day follow-up

**Pricing Variants**:
- $2,500: Single automation project
- $5,000: Complete business transformation package

---

## Testing Steps

1. Create test Stripe checkout session for each tier
2. Complete test payment (use Stripe test card: 4242 4242 4242 4242)
3. Verify webhook receives payment confirmation
4. Confirm user tier is updated in Clerk metadata
5. Test subscription cancellation flow
6. Test upgrade from Tier 1 → Tier 2
7. Test downgrade from Tier 2 → Tier 1

---

## Stripe Dashboard Configuration

- [ ] Tax settings configured (if applicable)
- [ ] Customer portal enabled (for self-service subscription management)
- [ ] Email receipts enabled
- [ ] Branding customized (logo, colors)
- [ ] Webhook endpoint added: `https://your-domain.com/api/webhooks/stripe`
- [ ] Webhook events selected:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

---

## Blockers

- Requires Stripe account (can use test mode immediately)
- Requires SSL certificate for production webhooks
- Business bank account needed for production payouts

---

## Notes

- Start in **test mode** for development
- Switch to **production mode** only after full testing
- Monitor Stripe fees: 2.9% + $0.30 per transaction
- Consider annual billing discount (save 2 months = 16% off) to increase LTV
- Plan for future: Add "Enterprise" tier above $5k for large organizations

---

## Related Tasks

- TASK-001: Environment Configuration (dependency)
- TASK-004: Clerk Authentication (user tier metadata)
- TASK-006: Stripe Webhook Handler (processes payments)
- TASK-009: Feature Gating (enforces tier restrictions)
- TASK-014: High-Ticket Sales Pipeline (uses Tier 3 products)
