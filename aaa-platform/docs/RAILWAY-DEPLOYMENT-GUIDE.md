# Railway Deployment Guide - AAA Platform

**Complete guide to deploy the AAA Platform to production using Railway**

**Estimated Time**: 2-3 hours
**Cost**: ~$15-40/month (with trial period available)
**Prerequisites**: GitHub account, test environment working locally

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Railway Account Setup](#railway-account-setup)
3. [PostgreSQL Database Setup](#postgresql-database-setup)
4. [Deploy Control Plane (Next.js)](#deploy-control-plane)
5. [Deploy GenAI Core (Python/FastAPI)](#deploy-genai-core)
6. [Environment Variables Configuration](#environment-variables-configuration)
7. [Database Migration](#database-migration)
8. [Domain Configuration](#domain-configuration)
9. [SSL & Security](#ssl-security)
10. [Testing & Verification](#testing-verification)
11. [Monitoring & Logs](#monitoring-logs)
12. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### ✅ What You Need Before Starting

- [ ] GitHub account with AAA Platform repository
- [ ] Credit card (for Railway - free trial available)
- [ ] Clerk account with test keys working
- [ ] Stripe account with test keys working
- [ ] OpenRouter API key
- [ ] Local development environment working
- [ ] All tests passing locally

### ✅ Repository Requirements

```bash
# Verify your repository structure
cd /home/daymon/Businesses/Apex\ Automation

# Should have:
# - aaa-platform/control-plane/ (Next.js app)
# - aaa-platform/genai-core/ (Python FastAPI)
# - docker-compose.yml (optional)
# - .env.example (template)
```

### ✅ Create Production Branch (Optional but Recommended)

```bash
# Create a production branch
git checkout -b production
git push origin production

# This allows you to test deployments without affecting main
```

---

## Railway Account Setup

### Step 1: Sign Up for Railway

1. Go to: https://railway.app/
2. Click **"Start a New Project"**
3. Sign in with GitHub
4. Authorize Railway to access your repositories

**Free Trial**: Railway provides $5 in free credits monthly (no credit card required initially)

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Empty Project"** (we'll add services manually)
3. Name your project: `aaa-platform-production`

**Project Structure**:
```
aaa-platform-production/
├── postgres (Database)
├── control-plane (Next.js Frontend)
└── genai-core (Python Backend)
```

---

## PostgreSQL Database Setup

### Step 1: Add PostgreSQL Service

1. In your Railway project, click **"+ New Service"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will automatically provision a database

**Wait 30-60 seconds** for the database to be ready.

### Step 2: Get Database Connection String

1. Click on the **PostgreSQL service**
2. Go to **"Variables"** tab
3. Find **`DATABASE_URL`** - this is your connection string

**Format**:
```
postgresql://postgres:PASSWORD@HOSTNAME:5432/railway
```

**Copy this URL** - you'll need it for both services.

### Step 3: Verify Database is Running

1. Go to **"Metrics"** tab
2. You should see CPU and Memory graphs
3. Status should show **"Healthy"**

---

## Deploy Control Plane

### Step 1: Add Control Plane Service

1. Click **"+ New Service"**
2. Select **"GitHub Repo"**
3. Choose your repository: `Apex Automation/aaa-platform`
4. Railway will detect it's a Node.js app

### Step 2: Configure Build Settings

1. Click on the **control-plane service**
2. Go to **"Settings"** tab
3. Configure:

**Root Directory**:
```
aaa-platform/control-plane
```

**Build Command** (optional, Railway auto-detects):
```bash
npm install && npm run build
```

**Start Command** (optional, Railway auto-detects):
```bash
npm start
```

**Node Version** (add in Settings → Environment):
```
NODE_VERSION=20
```

### Step 3: Set Port Configuration

Railway will automatically detect port 3000, but verify:

1. Go to **Settings → Networking**
2. Ensure **Port** is set to `3000`
3. Enable **Public Networking** (generates a URL)

### Step 4: Get Public URL

Once deployed, Railway generates a URL:
```
https://aaa-platform-production.up.railway.app
```

**Copy this URL** - you'll need it for environment variables.

---

## Deploy GenAI Core

### Step 1: Add GenAI Core Service

1. Click **"+ New Service"**
2. Select **"GitHub Repo"**
3. Choose same repository (it will create a second service)
4. Railway will detect it's a Python app

### Step 2: Configure Build Settings

1. Click on the **genai-core service**
2. Go to **"Settings"** tab
3. Configure:

**Root Directory**:
```
aaa-platform/genai-core
```

**Build Command**:
```bash
pip install -r requirements.txt
```

**Start Command**:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Python Version** (add in Settings → Environment):
```
PYTHON_VERSION=3.11
```

### Step 3: Set Port Configuration

1. Go to **Settings → Networking**
2. Ensure **Port** is set to `8000` (or use `$PORT` variable)
3. Enable **Public Networking**

Railway will generate a URL like:
```
https://genai-core-production.up.railway.app
```

---

## Environment Variables Configuration

### Control Plane Environment Variables

1. Click on **control-plane service**
2. Go to **"Variables"** tab
3. Add the following variables:

#### Required Variables

```bash
# Database (use the DATABASE_URL from PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# URLs
NEXT_PUBLIC_URL=${{RAILWAY_PUBLIC_DOMAIN}}
NEXT_PUBLIC_GENAI_CORE_URL=${{genai-core.RAILWAY_PUBLIC_DOMAIN}}

# Clerk Authentication (TEST KEYS for now)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
CLERK_SECRET_KEY=sk_test_YOUR_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe (TEST KEYS for now)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY

# Stripe Price IDs (use your test price IDs)
STRIPE_PRICE_TIER2_MONTHLY_99=price_YOUR_KEY
STRIPE_PRICE_TIER2_MONTHLY_199=price_YOUR_KEY
STRIPE_PRICE_TIER3_ONETIME_2500=price_YOUR_KEY
STRIPE_PRICE_TIER3_ONETIME_5000=price_YOUR_KEY

# Node Environment
NODE_ENV=production
```

**Pro Tip**: Railway allows **service references** using `${{ServiceName.VARIABLE}}` syntax!

### GenAI Core Environment Variables

1. Click on **genai-core service**
2. Go to **"Variables"** tab
3. Add:

```bash
# Database (same as control-plane)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Python Environment
PYTHONUNBUFFERED=1
```

### Step 4: Deploy Changes

After adding environment variables:

1. Railway will **automatically redeploy** both services
2. Wait 2-3 minutes for deployment to complete
3. Check **"Deployments"** tab for status

---

## Database Migration

### Step 1: Generate Prisma Client

The build process should handle this, but verify:

```bash
# In control-plane package.json, ensure you have:
"build": "prisma generate && next build"
```

### Step 2: Run Database Migrations

**Option A: Via Railway CLI** (Recommended)

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Link to your project:
```bash
cd /home/daymon/Businesses/Apex\ Automation/aaa-platform/control-plane
railway link
# Select: aaa-platform-production → control-plane
```

4. Run migrations:
```bash
railway run npx prisma migrate deploy
```

**Option B: Via Railway Dashboard** (If CLI doesn't work)

1. Go to **control-plane service**
2. Click **"Settings" → "Deploy"**
3. Add **"Deploy Command"**:
```bash
npx prisma migrate deploy && npm start
```

### Step 3: Apply Multi-Tenant Migration

```bash
# Copy migration SQL to Railway
railway run psql $DATABASE_URL -f prisma/migrations/add_multi_tenant_isolation.sql
```

**If psql not available**, use Railway's PostgreSQL plugin:
1. Click on **PostgreSQL service**
2. Go to **"Data"** tab
3. Paste SQL from `add_multi_tenant_isolation.sql`
4. Click **"Execute"**

### Step 4: Verify Migration

```bash
# Check tables exist
railway run psql $DATABASE_URL -c "\dt"

# Should show:
# User, Blueprint, UserSettings, SubscriptionHistory, UsageEvent, etc.
```

---

## Domain Configuration

### Option 1: Use Railway Subdomain (Free)

Railway provides a free subdomain:
```
https://aaa-platform-production.up.railway.app
```

**Pros**: Free, automatic SSL, no DNS configuration
**Cons**: Not brandable, long URL

### Option 2: Custom Domain (Recommended)

#### Step 1: Purchase Domain

Purchase from:
- Namecheap: https://www.namecheap.com/
- GoDaddy: https://www.godaddy.com/
- Cloudflare: https://www.cloudflare.com/

**Recommended**: `apexautomation.ai` or similar

**Cost**: ~$10-50/year

#### Step 2: Add Domain to Railway

1. Click on **control-plane service**
2. Go to **"Settings" → "Domains"**
3. Click **"+ Custom Domain"**
4. Enter your domain: `apexautomation.ai`

Railway will show DNS records to add:

```
Type: CNAME
Name: @ (or www)
Value: aaa-platform-production.up.railway.app
```

#### Step 3: Configure DNS

1. Go to your domain registrar's DNS settings
2. Add the CNAME record shown by Railway
3. Wait 5-60 minutes for DNS propagation

**Check DNS propagation**:
```bash
dig apexautomation.ai
```

#### Step 4: Update Environment Variables

Once domain is working, update:

```bash
# In control-plane variables
NEXT_PUBLIC_URL=https://apexautomation.ai

# Update Clerk redirect URLs
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=https://apexautomation.ai/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=https://apexautomation.ai/dashboard
```

**Railway automatically provisions SSL certificates** for custom domains!

---

## SSL & Security

### SSL Certificates (Automatic)

Railway automatically provides SSL certificates via Let's Encrypt:
- ✅ No configuration needed
- ✅ Auto-renewal
- ✅ Supports custom domains

### Security Headers (Add to Next.js)

Create `next.config.js` if not exists:

```javascript
// aaa-platform/control-plane/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

Commit and push - Railway will redeploy automatically.

---

## Testing & Verification

### Step 1: Health Checks

Test all endpoints are working:

```bash
# Control Plane health
curl https://YOUR-DOMAIN.up.railway.app/

# Should return Next.js page

# GenAI Core health
curl https://genai-core-production.up.railway.app/

# Should return: {"status":"healthy"}
```

### Step 2: Test Authentication Flow

1. Visit: `https://YOUR-DOMAIN.up.railway.app/sign-up`
2. Create a test account
3. Verify email confirmation (if enabled)
4. Check you're redirected to `/dashboard`

### Step 3: Test Blueprint Generation

1. Go to dashboard
2. Click "Generate Blueprint"
3. Fill in form:
   - Industry: SaaS
   - Revenue Goal: $100k/month
   - Tech Stack: Next.js, Stripe
   - Pain Points: Manual customer onboarding
4. Click "Generate"
5. Verify blueprint is created and saved

### Step 4: Test Stripe Integration

**Using Test Mode** (Stripe test keys):

1. Go to pricing page
2. Click "Subscribe to Tier 2"
3. Use Stripe test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: Any future date
   CVC: Any 3 digits
   ```
4. Complete checkout
5. Verify:
   - Redirected to success page
   - User tier updated in database
   - Webhook received (check Railway logs)

### Step 5: Database Verification

Check data was created:

```bash
# Connect to database
railway run psql $DATABASE_URL

# Check users
SELECT id, email, tier FROM "User";

# Check blueprints
SELECT id, "userId", industry FROM "Blueprint";

# Verify tenant isolation
SELECT DISTINCT "tenantId" FROM "Blueprint";

# Exit
\q
```

---

## Monitoring & Logs

### Real-Time Logs

1. Go to Railway dashboard
2. Click on any service
3. Go to **"Logs"** tab
4. See real-time logs

**Filter logs**:
```
# Filter by severity
level:error

# Filter by keyword
"Blueprint generated"
```

### Metrics

Railway provides built-in metrics:

1. Click on service
2. Go to **"Metrics"** tab
3. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

### Set Up Alerts (Optional)

1. Go to **Project Settings → Notifications**
2. Add Slack/Discord webhook
3. Configure alerts for:
   - Deployment failures
   - High CPU usage
   - Service crashes

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Build Fails: "Module not found"

**Cause**: Missing dependencies

**Solution**:
```bash
# Ensure package.json includes all dependencies
cd aaa-platform/control-plane
npm install
git add package-lock.json
git commit -m "chore: update dependencies"
git push
```

#### 2. Database Connection Error

**Cause**: DATABASE_URL not set correctly

**Solution**:
1. Go to PostgreSQL service
2. Copy the exact `DATABASE_URL`
3. Update in control-plane variables: `${{Postgres.DATABASE_URL}}`
4. Redeploy

#### 3. Prisma Client Not Generated

**Cause**: Build script doesn't run `prisma generate`

**Solution**:
Update `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

#### 4. CORS Errors

**Cause**: GenAI Core not allowing control-plane domain

**Solution**:
Update `genai-core/main.py`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://YOUR-DOMAIN.up.railway.app",
        "https://apexautomation.ai"  # if using custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 5. 502 Bad Gateway

**Cause**: Service crashed or port misconfigured

**Solution**:
1. Check logs for crash reason
2. Verify start command uses correct port
3. For Next.js: `npm start` (port 3000)
4. For FastAPI: `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### 6. Environment Variables Not Loading

**Cause**: Railway variables need redeploy

**Solution**:
1. After changing variables, click **"Deploy"** button
2. Or make a small code change and push to trigger redeploy

---

## Production Readiness Checklist

Before switching to production keys:

### Security
- [ ] SSL certificate active (HTTPS working)
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Database has Row-Level Security enabled
- [ ] No secrets in code (all in environment variables)

### Functionality
- [ ] Sign up/sign in working
- [ ] Blueprint generation working
- [ ] Stripe checkout working (test mode)
- [ ] Webhooks receiving events
- [ ] Email notifications working (if enabled)

### Database
- [ ] Migrations applied successfully
- [ ] Multi-tenant isolation verified
- [ ] Backup strategy configured (Railway auto-backups)

### Monitoring
- [ ] Can view logs in Railway
- [ ] Metrics showing healthy status
- [ ] Error tracking configured (optional: add Sentry)

### Documentation
- [ ] Deployment process documented
- [ ] Rollback procedure documented
- [ ] Team has access to Railway project

---

## Upgrade to Production Keys

Once testing is complete, upgrade to production:

### 1. Clerk Production Keys

1. Go to Clerk dashboard → Settings → API Keys
2. Switch to **Production**
3. Copy new keys:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```
4. Update in Railway variables
5. Update webhook URL in Clerk:
   ```
   https://apexautomation.ai/api/webhooks/clerk
   ```

### 2. Stripe Production Keys

1. Activate Stripe account (complete business verification)
2. Switch to **Live mode** in dashboard
3. Get production key:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   ```
4. Create production products (Tier 2, Tier 3)
5. Update price IDs in Railway variables
6. Setup production webhook:
   ```
   https://apexautomation.ai/api/webhooks/stripe
   ```
7. Get webhook signing secret:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_live_...
   ```

### 3. Deploy Production

1. Update all variables in Railway
2. Click **"Deploy"**
3. Wait for deployment to complete
4. Test with **real Stripe card** (small amount)
5. Verify everything works
6. **Launch!** 🚀

---

## Scaling & Optimization

### When to Scale Up

Consider upgrading when:
- Response times > 1 second consistently
- CPU usage > 80% regularly
- Memory usage approaching limits
- Database queries slowing down

### Railway Scaling Options

1. **Vertical Scaling** (Increase resources)
   - Go to Settings → Resources
   - Increase CPU/Memory allocation
   - Cost increases proportionally

2. **Horizontal Scaling** (Multiple instances)
   - Railway Pro plan required
   - Enable auto-scaling in settings
   - Load balancer automatically configured

### Database Optimization

1. **Connection Pooling**
   - Use Prisma's built-in pooling
   - Configure `connection_limit` in DATABASE_URL

2. **Read Replicas** (for heavy read workloads)
   - Available on Railway Pro
   - Configure in PostgreSQL settings

---

## Cost Optimization Tips

1. **Use Railway's Free Tier Initially**
   - $5/month free credits
   - Upgrade when needed

2. **Optimize Docker Images**
   - Use `.dockerignore` to exclude unnecessary files
   - Multi-stage builds reduce image size

3. **Monitor Usage**
   - Check Railway dashboard → Billing
   - Set up usage alerts
   - Review metrics to identify waste

4. **Database Optimization**
   - Clean up old data regularly
   - Optimize queries (use indexes)
   - Consider archiving strategy

---

## Support & Resources

### Railway Resources
- Documentation: https://docs.railway.app/
- Discord: https://discord.gg/railway
- Status Page: https://status.railway.app/

### AAA Platform Resources
- Main Documentation: `/aaa-platform/docs/`
- Multi-Tenant Guide: `MULTI-TENANT-ARCHITECTURE.md`
- Troubleshooting: This guide

### Getting Help

1. Check Railway logs first
2. Review this guide's troubleshooting section
3. Check Railway Discord for similar issues
4. Contact Railway support (Pro plan)

---

## Next Steps

After successful deployment:

1. **Test Thoroughly**
   - Run through all user flows
   - Test with multiple accounts
   - Verify tenant isolation

2. **Set Up Monitoring**
   - Add error tracking (Sentry)
   - Configure uptime monitoring
   - Set up log aggregation

3. **Document for Team**
   - Share Railway access
   - Document deployment process
   - Create runbook for common tasks

4. **Plan for Scale**
   - Monitor growth
   - Plan upgrade path
   - Consider CDN for static assets

---

## Congratulations! 🎉

You've successfully deployed the AAA Platform to production on Railway!

**Your production URLs**:
- Frontend: `https://YOUR-DOMAIN.up.railway.app`
- API: `https://genai-core.up.railway.app`
- Database: Managed by Railway

**Ready to accept customers!** 💰

---

## Appendix: Railway CLI Commands

Quick reference for Railway CLI:

```bash
# Login
railway login

# Link project
railway link

# View logs
railway logs

# Run commands in Railway environment
railway run <command>

# Deploy manually
railway up

# Open in browser
railway open

# View environment variables
railway variables

# Connect to database
railway connect postgres
```

---

**Last Updated**: 2026-02-02
**Maintained By**: AAA Platform Team
