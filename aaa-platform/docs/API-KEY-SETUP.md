# API Key Setup Guide

**Last Updated**: 2026-02-01

This guide walks you through obtaining and configuring all required API keys for the AAA Platform.

---

## Overview

The AAA platform requires API keys from three services:
- **Clerk** - User authentication
- **Stripe** - Payment processing
- **OpenRouter** - AI/LLM access

**Time to Complete**: 30-45 minutes

---

## Step 1: Clerk Authentication (15 minutes)

### What is Clerk?
Clerk provides drop-in authentication with sign-up, sign-in, user management, and session handling.

### Setup Instructions

1. **Create Account**
   - Go to https://clerk.com
   - Click "Start Building" or "Sign Up"
   - Create account with email/Google

2. **Create Application**
   - After login, click "+ Create Application"
   - Name: "AAA Platform" (or your preferred name)
   - Select authentication methods:
     - ✅ Email/Password
     - ✅ Google (optional)
     - ✅ GitHub (optional)
   - Click "Create Application"

3. **Get API Keys**
   - You'll be redirected to the dashboard
   - Look for "API Keys" section on the homepage
   - Copy the following keys:
     - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
     - **Secret Key** (starts with `sk_test_` or `sk_live_`)

4. **Add to Environment Variables**

   Edit `aaa-platform/control-plane/.env`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_key_here
   ```

5. **Configure URLs** (Already set in .env.example)
   ```bash
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
   ```

6. **Test Authentication**
   ```bash
   cd aaa-platform/control-plane
   npm run dev
   ```
   - Visit http://localhost:3000/sign-up
   - Create a test account
   - Verify redirect to /dashboard works

### Clerk Dashboard Settings

**Important Configuration**:
- **Paths** → Set sign-in, sign-up, and after-auth URLs
- **Email/SMS** → Customize email templates (optional)
- **Sessions** → Session timeout: 7 days (default is good)

### Cost
- **Free Tier**: 10,000 monthly active users
- **Pro**: $25/month for unlimited users
- For MVP, free tier is sufficient

---

## Step 2: Stripe Payment Processing (15 minutes)

### What is Stripe?
Stripe handles subscription billing, one-time payments, and webhooks for payment events.

### Setup Instructions

1. **Create Account**
   - Go to https://stripe.com
   - Click "Start now" or "Sign up"
   - Complete business verification (can use "Individual" for MVP)

2. **Enable Test Mode**
   - In Stripe Dashboard, look for "Test mode" toggle in top-right
   - **Keep it ON** for development (test mode uses fake cards)

3. **Get API Keys**
   - Navigate to: **Developers** → **API keys**
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_`)
     - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"
   - Copy the **Secret key**

4. **Set Up Webhook Endpoint**

   For local development:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login
   stripe login

   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   This command will output a **webhook signing secret** (starts with `whsec_`).

5. **Add to Environment Variables**

   Edit `aaa-platform/control-plane/.env`:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

6. **Test Payment Flow**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)

### Creating Products (TASK-005)

**Note**: Product/Price creation is handled in TASK-005. For now, just get the API keys.

### Stripe Dashboard Settings

**Recommended Configuration**:
- **Settings** → **Billing** → Enable Customer Portal (for self-service subscription management)
- **Settings** → **Branding** → Upload logo (optional)
- **Settings** → **Emails** → Customize receipt emails (optional)

### Cost
- **Stripe Fees**: 2.9% + $0.30 per transaction
- **No monthly fee** (transaction fees only)

### Production Setup

When ready to go live:
1. Complete Stripe business verification
2. Toggle "Test mode" OFF
3. Get production API keys (starts with `pk_live_` and `sk_live_`)
4. Set up production webhook endpoint (needs HTTPS)
5. Update `.env` with production keys

---

## Step 3: OpenRouter (AI/LLM Access) (10 minutes)

### What is OpenRouter?
OpenRouter provides unified API access to multiple LLM providers (Claude, GPT-4, etc.) with pay-as-you-go pricing.

### Setup Instructions

1. **Create Account**
   - Go to https://openrouter.ai
   - Click "Sign Up" (top-right)
   - Sign up with Google or Email

2. **Add Credits**
   - After login, go to **Settings** → **Credits**
   - Click "Add Credits"
   - Add $10-20 for testing (Claude Sonnet costs ~$3 per 1M input tokens)

3. **Generate API Key**
   - Go to **Settings** → **API Keys**
   - Click "Create Key"
   - Name: "AAA Platform Development"
   - Copy the key (starts with `sk-or-v1-`)
   - **Important**: This is shown only once - save it immediately!

4. **Add to Environment Variables**

   Edit `aaa-platform/genai-core/.env`:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-your_key_here
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
   ```

5. **Test LLM Connection**
   ```bash
   cd aaa-platform/genai-core
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```

   Then test the endpoint:
   ```bash
   curl -X POST http://localhost:8000/generate-blueprint \
     -H "Content-Type: application/json" \
     -d '{
       "industry": "ecommerce",
       "revenue_goal": "$100k/year",
       "tech_stack": ["Shopify"],
       "pain_points": "Manual order processing"
     }'
   ```

### Model Selection

**Recommended Models** (by tier):

| Model | Use Case | Cost | Speed |
|-------|----------|------|-------|
| `anthropic/claude-3.5-sonnet` | **Tier 2** (Production quality) | $3 / 1M input tokens | Fast |
| `anthropic/claude-3-haiku` | **Tier 1** (Cost optimization) | $0.25 / 1M input tokens | Very fast |
| `anthropic/claude-opus-4.5` | **Tier 3** (Premium quality) | $15 / 1M input tokens | Slower |

To change model, update `.env`:
```bash
OPENROUTER_MODEL=anthropic/claude-3-haiku  # For Tier 1 cost savings
```

### Cost Estimates

**Blueprint Generation** (avg 2,000 tokens input, 1,000 tokens output):

| Model | Cost per Blueprint | 100 Blueprints/month |
|-------|-------------------|----------------------|
| Haiku | $0.001 | $0.10 |
| Sonnet | $0.010 | $1.00 |
| Opus | $0.045 | $4.50 |

**Budget Recommendation**: Start with $20 for Month 1 (covers ~200 Sonnet blueprints)

### OpenRouter Dashboard

**Useful Features**:
- **Usage** → View API call logs and costs
- **Models** → Browse available models
- **Settings** → Set spending limits (recommended: $100/month cap)

---

## Step 4: Verify Installation

### Checklist

Run through this checklist to ensure everything is configured correctly:

- [ ] **Clerk Keys Added**
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_test_`
  - `CLERK_SECRET_KEY` starts with `sk_test_`

- [ ] **Stripe Keys Added**
  - `STRIPE_SECRET_KEY` starts with `sk_test_`
  - `STRIPE_WEBHOOK_SECRET` starts with `whsec_`

- [ ] **OpenRouter Keys Added**
  - `OPENROUTER_API_KEY` starts with `sk-or-v1-`
  - `OPENROUTER_MODEL` is set

- [ ] **.gitignore Configured**
  - `.env` files are excluded from git
  - Run: `git status` (should NOT show .env files)

- [ ] **Services Start Successfully**
  - Control Plane: `cd control-plane && npm run dev`
  - GenAI Core: `cd genai-core && python main.py`

### Test Complete Flow

1. **Sign Up Flow**
   - Visit http://localhost:3000/sign-up
   - Create account
   - Should redirect to /dashboard

2. **Blueprint Generation** (if service is implemented)
   - Navigate to /dashboard/new-blueprint
   - Fill out diagnostic form
   - Click "Generate Blueprint"
   - Should receive AI-generated response

3. **Payment Test** (when TASK-005 is complete)
   - Click "Upgrade to Pro"
   - Use test card: 4242 4242 4242 4242
   - Complete checkout
   - Verify subscription activated

---

## Security Best Practices

### DO ✅

- **Use environment variables** for all secrets
- **Never commit `.env` files** to git
- **Use test mode** for development (Clerk, Stripe)
- **Store production keys** in 1Password, LastPass, or equivalent
- **Rotate keys** if compromised
- **Use different keys** for development vs production

### DON'T ❌

- **Never hardcode** API keys in code
- **Never share** secret keys publicly (Slack, email, etc.)
- **Never use production keys** in development
- **Never commit** `.env` to GitHub

---

## Troubleshooting

### Issue: "Missing API key" error

**Solution**:
```bash
# Verify .env file exists
ls -la aaa-platform/control-plane/.env
ls -la aaa-platform/genai-core/.env

# Check if environment variables load
cd control-plane
npm run dev  # Should NOT show missing key errors
```

### Issue: Clerk authentication not working

**Solution**:
- Verify keys in Clerk dashboard match `.env`
- Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is PUBLIC (visible in browser)
- Ensure URLs match: `/sign-in`, `/sign-up`, `/dashboard`

### Issue: Stripe webhook not receiving events

**Solution**:
```bash
# Make sure Stripe CLI is running
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In separate terminal, trigger test event
stripe trigger payment_intent.succeeded
```

### Issue: OpenRouter "Insufficient credits" error

**Solution**:
- Go to https://openrouter.ai/settings/credits
- Add credits ($10-20 recommended for testing)
- Verify API key is correct

### Issue: GenAI Core won't start

**Solution**:
```bash
cd aaa-platform/genai-core

# Ensure Python virtual environment activated
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Try running
python main.py

# Check for specific error messages
```

---

## Environment Variable Reference

### Complete .env Template (Control Plane)

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
STRIPE_ARCHITECT_MONTHLY_PRICE_ID=price_xxxxxxxxxxxx  # Set in TASK-005
STRIPE_ARCHITECT_YEARLY_PRICE_ID=price_xxxxxxxxxxxx   # Set in TASK-005
STRIPE_APEX_PRICE_ID=price_xxxxxxxxxxxx                # Set in TASK-005

# Database
DATABASE_URL="file:./dev.db"  # SQLite for development

# URLs
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_GENAI_CORE_URL=http://localhost:8000
```

### Complete .env Template (GenAI Core)

```bash
# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Development Mode
# Set to true to skip LLM calls and use mock responses
USE_MOCK_LLM=false  # Set to true for testing without API costs
```

---

## Next Steps

After completing this setup:

1. ✅ **TASK-001 Complete** - Environment configured
2. ⏭️ **TASK-004** - Verify Clerk authentication flow
3. ⏭️ **TASK-005** - Configure Stripe products & pricing
4. ⏭️ **TASK-007** - Enhance blueprint service

---

## Support

If you encounter issues not covered in this guide:

- **Clerk**: https://clerk.com/docs
- **Stripe**: https://stripe.com/docs
- **OpenRouter**: https://openrouter.ai/docs

**Internal Questions**: Contact the project maintainer or refer to `CLAUDE.md` for project context.
