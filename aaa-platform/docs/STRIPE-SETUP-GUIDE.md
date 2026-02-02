# Stripe Setup Guide
## AAA Platform - Complete Payment Configuration

**Last Updated**: 2026-02-01
**Status**: 🔄 In Progress

---

## Overview

This guide walks you through setting up Stripe for the AAA Platform's 3-tier pricing model:

- **Tier 1 (Freemium)**: $0 - Market capture
- **Tier 2 (Core Subscription)**: $99-$199/month - Recurring revenue
- **Tier 3 (Apex Implementation)**: $2,500-$5,000 - High-ticket service

**Revenue Goal**: $50,000/month (250 Tier 2 subscribers + 10 Tier 3 clients)

---

## Prerequisites

- [ ] Stripe account (sign up at [stripe.com](https://stripe.com))
- [ ] Business information (name, address, tax ID)
- [ ] Bank account for payouts (production only)

---

## Part 1: Stripe Account Setup

### Step 1: Create Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up with your business email
3. Verify your email address
4. Complete business profile

### Step 2: Get API Keys

1. Navigate to **Developers** → **API keys**
2. Copy your **Test Mode** keys:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

3. Add to `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## Part 2: Create Products in Stripe Dashboard

### Important: Start in Test Mode

Toggle **Test mode** ON in the Stripe dashboard (top right corner)

---

### Product 1: Tier 1 - Freemium (Free)

**Note**: Stripe doesn't require a product for free tier, but we'll track it in our database.

- ✅ Skip product creation in Stripe
- ✅ User starts on `tier: "free"` by default in database
- ✅ Feature gating handled in application code

---

### Product 2: Tier 2 - Core Subscription

#### Variant A: Individual Plan ($99/month)

1. Go to **Products** → **Add Product**
2. Fill in details:
   ```
   Name: AAA Core Subscription - Individual
   Description: Unlimited automation blueprints, API integrations, priority support
   ```
3. Add pricing:
   ```
   Pricing model: Standard pricing
   Price: $99.00 USD
   Billing period: Monthly
   ```
4. Click **Save product**
5. **Copy the Price ID** (starts with `price_`)
6. Add to `.env`:
   ```bash
   STRIPE_PRICE_TIER2_MONTHLY_99=price_YOUR_ID_HERE
   ```

#### Variant B: Team Plan ($199/month)

1. Go to **Products** → **Add Product**
2. Fill in details:
   ```
   Name: AAA Core Subscription - Team
   Description: Everything in Individual + up to 5 team members
   ```
3. Add pricing:
   ```
   Pricing model: Standard pricing
   Price: $199.00 USD
   Billing period: Monthly
   ```
4. Click **Save product**
5. **Copy the Price ID**
6. Add to `.env`:
   ```bash
   STRIPE_PRICE_TIER2_MONTHLY_199=price_YOUR_ID_HERE
   ```

---

### Product 3: Tier 3 - Apex Implementation

#### Variant A: Single Project ($2,500)

1. Go to **Products** → **Add Product**
2. Fill in details:
   ```
   Name: Apex Implementation Service - Single Project
   Description: 1-on-1 strategy session, custom blueprint, implementation support, 30-day follow-up
   ```
3. Add pricing:
   ```
   Pricing model: Standard pricing
   Price: $2,500.00 USD
   Billing period: One time
   ```
4. Click **Save product**
5. **Copy the Price ID**
6. Add to `.env`:
   ```bash
   STRIPE_PRICE_TIER3_ONETIME_2500=price_YOUR_ID_HERE
   ```

#### Variant B: Complete Transformation ($5,000)

1. Go to **Products** → **Add Product**
2. Fill in details:
   ```
   Name: Apex Implementation Service - Complete Transformation
   Description: Everything in Single Project + multi-system integration, ongoing optimization, 90-day support
   ```
3. Add pricing:
   ```
   Pricing model: Standard pricing
   Price: $5,000.00 USD
   Billing period: One time
   ```
4. Click **Save product**
5. **Copy the Price ID**
6. Add to `.env`:
   ```bash
   STRIPE_PRICE_TIER3_ONETIME_5000=price_YOUR_ID_HERE
   ```

---

## Part 3: Configure Webhooks

### Step 1: Add Webhook Endpoint

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   For local testing: Use Stripe CLI (see below)
   For production: https://yourdomain.com/api/webhooks/stripe
   ```

### Step 2: Select Events

Select the following events:

**Required** (for basic functionality):
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

**Recommended** (for payment handling):
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `customer.subscription.trial_will_end`

### Step 3: Get Webhook Secret

1. After creating the webhook, click on it
2. Click **Reveal** next to **Signing secret**
3. Copy the secret (starts with `whsec_`)
4. Add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

## Part 4: Test with Stripe CLI (Local Development)

### Install Stripe CLI

**macOS**:
```bash
brew install stripe/stripe-cli/stripe
```

**Linux**:
```bash
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.4/stripe_1.19.4_linux_x86_64.tar.gz
tar -xvf stripe_1.19.4_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

**Windows**:
Download from [GitHub](https://github.com/stripe/stripe-cli/releases)

### Login to Stripe

```bash
stripe login
```

### Forward Webhooks Locally

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will output a webhook secret like:
```
whsec_xxxxxxxxxxxxxxxxxxxxx
```

Add this to `.env` as `STRIPE_WEBHOOK_SECRET`

---

## Part 5: Enable Customer Portal

The Customer Portal allows users to manage their subscriptions without contacting support.

### Step 1: Configure Portal

1. Go to **Settings** → **Billing** → **Customer portal**
2. Click **Activate**
3. Configure settings:
   ```
   ✅ Allow customers to update payment methods
   ✅ Allow customers to cancel subscriptions
   ✅ Allow customers to switch plans (upgrade/downgrade)
   ✅ Invoice history
   ```

### Step 2: Set Cancellation Behavior

```
When customers cancel:
○ Cancel immediately
● Cancel at the end of the billing period (recommended)
```

### Step 3: Branding

1. Upload your logo
2. Set brand colors:
   ```
   Primary color: #6366F1 (Indigo)
   Background: #0F172A (Slate 950)
   ```

---

## Part 6: Testing Checkout

### Test Card Numbers

Use these cards in **Test Mode**:

**Successful Payment**:
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Payment Requires Authentication** (3D Secure):
```
Card: 4000 0025 0000 3155
```

**Payment Fails**:
```
Card: 4000 0000 0000 9995
```

### Test Each Tier

1. **Tier 2 ($99/month)**:
   ```bash
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"tier": "tier2", "priceId": "price_YOUR_TIER2_99_ID"}'
   ```

2. **Tier 2 ($199/month)**:
   ```bash
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"tier": "tier2", "priceId": "price_YOUR_TIER2_199_ID"}'
   ```

3. **Tier 3 ($2,500)**:
   ```bash
   curl -X POST http://localhost:3000/api/checkout \
     -H "Content-Type: application/json" \
     -d '{"tier": "tier3", "priceId": "price_YOUR_TIER3_2500_ID"}'
   ```

---

## Part 7: Production Checklist

Before going live with real payments:

### Business Verification
- [ ] Complete business information in Stripe dashboard
- [ ] Add business address
- [ ] Add tax ID (EIN for US businesses)
- [ ] Verify bank account for payouts

### Tax Configuration
- [ ] Enable Stripe Tax (if applicable)
- [ ] Configure tax collection by region
- [ ] Set up automatic tax calculation

### Security
- [ ] Switch from Test Mode to Production Mode
- [ ] Generate new Production API keys
- [ ] Update `.env` with production keys
- [ ] Configure production webhook endpoint (SSL required)
- [ ] Enable 3D Secure for cards

### Legal
- [ ] Add Terms of Service link in checkout
- [ ] Add Privacy Policy link
- [ ] Add Refund Policy
- [ ] Configure email receipts

### Monitoring
- [ ] Set up Stripe email notifications
- [ ] Configure failed payment alerts
- [ ] Set up Revenue Recognition (for accrual accounting)

---

## Environment Variables Summary

After completing setup, your `.env` should have:

```bash
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Tier 2 Price IDs (Subscriptions)
STRIPE_PRICE_TIER2_MONTHLY_99=price_xxxxxxxxxxxxx
STRIPE_PRICE_TIER2_MONTHLY_199=price_xxxxxxxxxxxxx

# Tier 3 Price IDs (One-time payments)
STRIPE_PRICE_TIER3_ONETIME_2500=price_xxxxxxxxxxxxx
STRIPE_PRICE_TIER3_ONETIME_5000=price_xxxxxxxxxxxxx
```

---

## Troubleshooting

### Issue: "No such price"
**Cause**: Price ID is incorrect or doesn't exist
**Fix**: Double-check Price ID in Stripe Dashboard → Products → [Product] → Pricing

### Issue: "Invalid API Key"
**Cause**: Using production key in test mode or vice versa
**Fix**: Ensure test keys (pk_test_, sk_test_) are used during development

### Issue: Webhook not receiving events
**Cause**: Webhook endpoint not reachable or secret is wrong
**Fix**:
- For local dev: Use Stripe CLI `stripe listen`
- For production: Ensure HTTPS and correct domain

### Issue: Customer created but subscription not active
**Cause**: Webhook handler not processing `checkout.session.completed`
**Fix**: Check TASK-006 (Stripe Webhook Handler) implementation

---

## Next Steps

After completing this setup:

1. ✅ Test all checkout flows
2. ✅ Verify webhooks are working (TASK-006)
3. ✅ Implement feature gating (TASK-009)
4. ✅ Create pricing page UI
5. ✅ Set up billing portal link in dashboard

---

## Support Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Stripe Testing**: https://stripe.com/docs/testing

---

**Estimated Setup Time**: 30-45 minutes
**Prerequisites**: Stripe account, business information
**Next Task**: TASK-006 (Stripe Webhook Handler)
