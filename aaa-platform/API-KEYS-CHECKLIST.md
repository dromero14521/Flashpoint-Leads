# API Keys Collection Checklist
## Quick Reference Guide (Print This!)

**Time**: 30-45 minutes | **Date**: ________________

---

## 🔑 Keys to Collect

### 1. Clerk Authentication (5 min)
- [ ] Go to: https://dashboard.clerk.com
- [ ] Switch to **LIVE/PRODUCTION** mode ⚠️
- [ ] Navigate to: API Keys
- [ ] Copy `pk_live_*` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] Copy `sk_live_*` → `CLERK_SECRET_KEY`

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_____________________
CLERK_SECRET_KEY=sk_live_____________________
```

---

### 2. Stripe Payments (20 min)

#### Main API Key
- [ ] Go to: https://dashboard.stripe.com
- [ ] Toggle OFF "Viewing test data" ⚠️
- [ ] Navigate to: Developers → API Keys
- [ ] Copy `sk_live_*` → `STRIPE_SECRET_KEY`

```
STRIPE_SECRET_KEY=sk_live_____________________
```

#### Create Products
- [ ] Navigate to: Products
- [ ] Create: "Architect Tier" - $99/month (recurring)
  - [ ] Copy Price ID → `STRIPE_PRICE_TIER2_MONTHLY_99`
- [ ] Create: "Architect Tier Pro" - $199/month (recurring)
  - [ ] Copy Price ID → `STRIPE_PRICE_TIER2_MONTHLY_199`
- [ ] Create: "Apex Implementation" - $2,500 (one-time)
  - [ ] Copy Price ID → `STRIPE_PRICE_TIER3_ONETIME_2500`
- [ ] Create: "Apex Premium" - $5,000 (one-time)
  - [ ] Copy Price ID → `STRIPE_PRICE_TIER3_ONETIME_5000`

```
STRIPE_PRICE_TIER2_MONTHLY_99=price_____________________
STRIPE_PRICE_TIER2_MONTHLY_199=price_____________________
STRIPE_PRICE_TIER3_ONETIME_2500=price_____________________
STRIPE_PRICE_TIER3_ONETIME_5000=price_____________________
```

#### Webhook (Do AFTER deployment!)
- [ ] Navigate to: Developers → Webhooks
- [ ] Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Select events: checkout.session.completed, customer.subscription.*, invoice.payment_*
- [ ] Copy signing secret → `STRIPE_WEBHOOK_SECRET`

```
STRIPE_WEBHOOK_SECRET=whsec_____________________
```

---

### 3. OpenRouter LLM (5 min)
- [ ] Go to: https://openrouter.ai
- [ ] Sign in/create account
- [ ] Add credits: $10-20 recommended
- [ ] Navigate to: Keys
- [ ] Create new key: "AAA Platform Production"
- [ ] Copy `sk-or-v1-*` → `OPENROUTER_API_KEY`

```
OPENROUTER_API_KEY=sk-or-v1-_____________________
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

---

### 4. Sentry Error Tracking (5 min) - OPTIONAL
- [ ] Go to: https://sentry.io
- [ ] Create account (free tier)
- [ ] Create project: "aaa-platform" (Next.js)
- [ ] Copy DSN → `SENTRY_DSN`

```
SENTRY_DSN=https://_____________________
```

---

## ✅ Verification

### Before proceeding, verify:

**All keys have correct prefixes:**
- [ ] Clerk: `pk_live_*` and `sk_live_*` (not pk_test_!)
- [ ] Stripe: `sk_live_*` (not sk_test_!)
- [ ] Stripe prices: All start with `price_`
- [ ] OpenRouter: Starts with `sk-or-v1-`
- [ ] Sentry: Starts with `https://`

**Security check:**
- [ ] Keys saved in secure location (password manager)
- [ ] Keys NOT committed to git
- [ ] Keys NOT shared via email/Slack

**Account status:**
- [ ] Clerk: Live mode enabled
- [ ] Stripe: Test mode toggle OFF
- [ ] OpenRouter: Credits added ($10+)
- [ ] Sentry: Free tier activated

---

## 📝 Full Environment Variables

Once collected, your production `.env` should have:

```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_URL=https://yourdomain.com  # Update after deployment
DATABASE_URL=  # Railway provides this

# Clerk (LIVE keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_____________________
CLERK_SECRET_KEY=sk_live_____________________

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_____________________
STRIPE_WEBHOOK_SECRET=whsec_____________________  # After deployment
STRIPE_PRICE_TIER2_MONTHLY_99=price_____________________
STRIPE_PRICE_TIER2_MONTHLY_199=price_____________________
STRIPE_PRICE_TIER3_ONETIME_2500=price_____________________
STRIPE_PRICE_TIER3_ONETIME_5000=price_____________________

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-_____________________
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# GenAI Core URL (Railway internal)
GENAI_CORE_URL=http://genai-core.railway.internal:8000

# Monitoring (optional)
SENTRY_DSN=https://_____________________
ENVIRONMENT=production

# Security
USE_MOCK_LLM=false
```

---

## 🚀 Ready to Deploy?

- [ ] All keys collected (8-9 total)
- [ ] Keys verified (correct prefixes)
- [ ] Keys saved securely
- [ ] Ready for Railway deployment

**Next Step**: Proceed to Phase 2 - Railway Deployment

---

## 📞 Quick Support Links

- Clerk: https://clerk.com/docs
- Stripe: https://stripe.com/docs
- OpenRouter: https://openrouter.ai/docs
- Sentry: https://docs.sentry.io

---

**Printed**: ________________
**Completed**: ________________
**Deployed**: ________________
