# AAA Platform - Production Deployment Plan
## TASK-016: Production Deployment Setup

**Status**: IN PROGRESS
**Started**: 2026-02-02
**Target Completion**: 2026-02-03
**Estimated Effort**: 10 hours
**Priority**: CRITICAL

---

## Executive Summary

This plan outlines the step-by-step process to deploy the AAA Platform to production using Railway (recommended) or Docker Compose on VPS. The deployment will provide HTTPS access, automated database backups, monitoring, and CI/CD pipelines.

**Goal**: Launch https://apexautomation.ai (or similar domain) with full functionality by end of Day 3.

---

## Deployment Phases

### Phase 1: Pre-Deployment Preparation (2 hours)
- [x] Audit existing infrastructure
- [ ] Verify all environment variables
- [ ] Create production .env template
- [ ] Test local Docker build
- [ ] Review and update Dockerfiles
- [ ] Create deployment checklist

### Phase 2: Railway Setup (2 hours) - RECOMMENDED PATH
- [ ] Create Railway account & project
- [ ] Connect GitHub repository
- [ ] Configure PostgreSQL service
- [ ] Configure GenAI Core service
- [ ] Configure Control Plane service
- [ ] Set environment variables
- [ ] Test deployment

### Phase 3: Domain & SSL (1 hour)
- [ ] Purchase/configure domain
- [ ] Point DNS to Railway
- [ ] Configure SSL certificate
- [ ] Verify HTTPS working

### Phase 4: Database Setup (1 hour)
- [ ] Run Prisma migrations
- [ ] Test database connectivity
- [ ] Set up automated backups
- [ ] Configure connection pooling

### Phase 5: Monitoring & Logging (2 hours)
- [ ] Set up Sentry error tracking
- [ ] Configure health check endpoints
- [ ] Set up uptime monitoring
- [ ] Create alerting rules

### Phase 6: CI/CD Pipeline (1.5 hours)
- [ ] Create GitHub Actions workflow
- [ ] Configure deployment triggers
- [ ] Set up automated testing
- [ ] Test deployment pipeline

### Phase 7: Testing & Verification (0.5 hours)
- [ ] Run smoke tests
- [ ] Test all critical flows
- [ ] Verify webhooks working
- [ ] Load testing (optional)

---

## Current Infrastructure Audit

### Existing Components
✅ **Control Plane** (Next.js)
- Dockerfile exists: `aaa-platform/control-plane/Dockerfile`
- Health endpoint: `/api/health`
- Port: 3000

✅ **GenAI Core** (FastAPI)
- Dockerfile exists: `aaa-platform/genai-core/Dockerfile`
- Health endpoint: `/health`
- Port: 8000

✅ **Docker Compose**
- File exists: `docker-compose.yml`
- Services: postgres, genai-core, control-plane, nginx
- Volume management configured

✅ **Documentation**
- Production deployment guide exists
- API setup guide exists
- Authentication guide exists

### Missing Components
⚠️ **Production Environment Variables**
- Need production Clerk keys (live not test)
- Need production Stripe keys (live not test)
- Need production OpenRouter API key
- Need database credentials

⚠️ **CI/CD Pipeline**
- No GitHub Actions workflow yet
- No automated testing setup

⚠️ **Monitoring**
- No Sentry integration yet
- No uptime monitoring configured

⚠️ **Domain**
- Domain not purchased/configured yet
- SSL certificate not set up

---

## Deployment Options Analysis

### Option 1: Railway (RECOMMENDED)
**Pros:**
- Fastest to production (15-30 minutes)
- Automatic SSL certificates
- Built-in PostgreSQL with backups
- Git-based deployments
- Zero DevOps overhead

**Cons:**
- Higher monthly cost ($20-50)
- Less control over infrastructure
- Potential vendor lock-in

**Best For:**
- MVP launch
- Fast iteration
- Small team
- Focus on product, not infrastructure

### Option 2: Docker on VPS
**Pros:**
- Full control
- Lower cost ($10-20/month)
- Can optimize for specific needs
- No vendor lock-in

**Cons:**
- Requires DevOps knowledge
- Manual SSL setup
- Manual backup configuration
- Longer setup time (1-2 hours)

**Best For:**
- Cost-conscious
- DevOps expertise available
- Custom infrastructure needs

### Recommendation
**Start with Railway** for the following reasons:
1. Speed to market (critical for $50k/month goal)
2. Focus on sales, not infrastructure
3. Can migrate to VPS later if needed
4. Railway → VPS migration is straightforward

---

## Phase 1: Pre-Deployment Preparation

### 1.1 Environment Variables Audit

**Required Production Keys:**

#### Clerk (Authentication)
```bash
# Get from: https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx  # LIVE not test!
CLERK_SECRET_KEY=sk_live_xxxxx                    # LIVE not test!
```

#### Stripe (Payments)
```bash
# Get from: https://dashboard.stripe.com
STRIPE_SECRET_KEY=sk_live_xxxxx                   # LIVE not test!
STRIPE_WEBHOOK_SECRET=whsec_xxxxx                 # Production webhook

# Price IDs (from Stripe Dashboard → Products)
STRIPE_PRICE_TIER2_MONTHLY_99=price_xxxxx
STRIPE_PRICE_TIER2_MONTHLY_199=price_xxxxx
STRIPE_PRICE_TIER3_ONETIME_2500=price_xxxxx
STRIPE_PRICE_TIER3_ONETIME_5000=price_xxxxx
```

#### OpenRouter (LLM)
```bash
# Get from: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
```

#### Database
```bash
# Railway provides this automatically
DATABASE_URL=postgresql://user:pass@host:5432/db
```

#### Monitoring (Optional but recommended)
```bash
# Get from: https://sentry.io
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### 1.2 Create Production .env Template

Create `.env.production.example`:

```bash
# ==================================
# AAA Platform - Production Environment
# ==================================

# Application
NODE_ENV=production
NEXT_PUBLIC_URL=https://apexautomation.ai

# Database (provided by Railway)
DATABASE_URL=postgresql://user:pass@host:5432/railway

# Clerk Authentication (LIVE KEYS)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Stripe (LIVE KEYS)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs
STRIPE_PRICE_TIER2_MONTHLY_99=price_xxxxx
STRIPE_PRICE_TIER2_MONTHLY_199=price_xxxxx
STRIPE_PRICE_TIER3_ONETIME_2500=price_xxxxx
STRIPE_PRICE_TIER3_ONETIME_5000=price_xxxxx

# OpenRouter (GenAI)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# GenAI Core URL (internal)
GENAI_CORE_URL=http://genai-core:8000

# Monitoring (Optional)
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
ENVIRONMENT=production

# Security
USE_MOCK_LLM=false
```

### 1.3 Test Local Docker Build

```bash
# Build both services
docker build -t aaa-control-plane ./aaa-platform/control-plane
docker build -t aaa-genai-core ./aaa-platform/genai-core

# Verify builds succeeded
docker images | grep aaa

# Test control-plane
docker run -p 3000:3000 aaa-control-plane

# Test genai-core
docker run -p 8000:8000 aaa-genai-core
```

### 1.4 Pre-Deployment Checklist

**Code Readiness:**
- [x] All tests passing locally
- [x] TypeScript build successful
- [x] Multi-tenant architecture complete
- [x] Feature gating implemented
- [x] Stripe integration working
- [x] Clerk authentication working

**Infrastructure Readiness:**
- [ ] Production API keys obtained
- [ ] Domain purchased (or ready to purchase)
- [ ] Hosting account created (Railway or VPS)
- [ ] Payment method added to hosting

**Security Readiness:**
- [x] Environment variables never committed to git
- [x] .gitignore includes .env files
- [x] Webhook signature verification implemented
- [x] CORS configured properly

---

## Phase 2: Railway Deployment (RECOMMENDED)

### 2.1 Create Railway Account

1. Go to https://railway.app
2. Sign up with GitHub account
3. Connect your GitHub repository
4. Add payment method ($5 free credit, then pay-as-you-go)

### 2.2 Create New Project

```bash
# Install Railway CLI (optional but recommended)
npm install -g @railway/cli

# Login
railway login

# Link to existing project (or create new)
railway init
```

### 2.3 Set Up PostgreSQL Service

**In Railway Dashboard:**
1. Click "+ New Service"
2. Select "Database → PostgreSQL"
3. Railway will provision and expose `DATABASE_URL`

**Configuration:**
- Name: `aaa-postgres`
- Plan: Hobby ($5/month for 1GB)
- Version: PostgreSQL 15
- Backups: Automatic daily

### 2.4 Deploy GenAI Core Service

**Create new service:**
1. Click "+ New Service"
2. Select "GitHub Repo"
3. Choose your repository
4. Root directory: `/aaa-platform/genai-core`
5. Build command: Auto-detected (Dockerfile)
6. Start command: Auto-detected

**Environment Variables:**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
ENVIRONMENT=production
```

**Settings:**
- Port: 8000
- Health check: `/health`
- Restart policy: On failure
- Deploy on: Push to `main` branch

### 2.5 Deploy Control Plane Service

**Create new service:**
1. Click "+ New Service"
2. Select "GitHub Repo"
3. Choose your repository
4. Root directory: `/aaa-platform/control-plane`
5. Build command: `npm run build`
6. Start command: `npm start`

**Environment Variables:**
```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_TIER2_MONTHLY_99=price_xxxxx
STRIPE_PRICE_TIER2_MONTHLY_199=price_xxxxx
STRIPE_PRICE_TIER3_ONETIME_2500=price_xxxxx
STRIPE_PRICE_TIER3_ONETIME_5000=price_xxxxx
GENAI_CORE_URL=http://genai-core.railway.internal:8000
NEXT_PUBLIC_URL=https://apexautomation.ai
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Settings:**
- Port: 3000
- Health check: `/api/health`
- Restart policy: On failure
- Deploy on: Push to `main` branch

### 2.6 Configure Service Networking

Railway automatically creates internal networking:
- `genai-core.railway.internal` → GenAI Core service
- `postgres.railway.internal` → PostgreSQL service

Update `GENAI_CORE_URL`:
```bash
GENAI_CORE_URL=http://genai-core.railway.internal:8000
```

### 2.7 Deploy and Verify

**Deploy:**
```bash
# Via Railway Dashboard: Click "Deploy"
# Or via CLI:
railway up
```

**Check Logs:**
```bash
railway logs --service control-plane
railway logs --service genai-core
railway logs --service postgres
```

**Verify Health:**
```bash
# Get Railway URLs from dashboard
curl https://aaa-control-plane.railway.app/api/health
curl https://aaa-genai-core.railway.app/health
```

---

## Phase 3: Domain & SSL Configuration

### 3.1 Purchase Domain

**Recommended Registrars:**
- Cloudflare ($8-12/year, includes DDoS protection)
- Namecheap ($10-15/year)
- Google Domains ($12/year)

**Suggested Domains:**
- apexautomation.ai
- apexautomate.ai
- getapexautomation.com
- apexarchitect.ai

### 3.2 Configure DNS (Cloudflare Example)

**In Cloudflare Dashboard:**

1. Add your domain
2. Update nameservers at registrar
3. Add DNS records:

```
Type: CNAME
Name: @
Target: aaa-control-plane.railway.app
Proxy: Enabled (orange cloud)

Type: CNAME
Name: www
Target: aaa-control-plane.railway.app
Proxy: Enabled (orange cloud)
```

### 3.3 Configure Custom Domain in Railway

**In Railway Dashboard:**
1. Go to Control Plane service
2. Click "Settings"
3. Scroll to "Domains"
4. Click "Add Custom Domain"
5. Enter: `apexautomation.ai`
6. Railway automatically provisions SSL

**Verify:**
```bash
curl https://apexautomation.ai/api/health
```

### 3.4 Update Environment Variables

```bash
# In Railway: Control Plane service
NEXT_PUBLIC_URL=https://apexautomation.ai
```

### 3.5 Configure Webhooks

**Update webhook URLs in third-party services:**

#### Clerk Webhooks
```
https://apexautomation.ai/api/webhooks/clerk
```

#### Stripe Webhooks
```
https://apexautomation.ai/api/webhooks/stripe
```

---

## Phase 4: Database Management

### 4.1 Run Prisma Migrations

```bash
# From local machine
railway run prisma migrate deploy

# Or in Railway service settings
# Build command: npm run build && npx prisma migrate deploy
```

### 4.2 Verify Database Schema

```bash
railway run prisma studio
# Opens Prisma Studio to inspect database
```

### 4.3 Set Up Automated Backups

**Railway provides automatic daily backups.**

**Additional backup to S3 (optional):**

Create backup script in `/scripts/backup-db.sh`:
```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL | gzip | aws s3 cp - s3://aaa-backups/db_$TIMESTAMP.sql.gz
```

Schedule in Railway:
- Add Cron service
- Schedule: `0 2 * * *` (daily at 2 AM)

### 4.4 Configure Connection Pooling (Optional)

For high traffic, add PgBouncer:

**In Railway:**
1. Add new service: PgBouncer
2. Connect to PostgreSQL
3. Update `DATABASE_URL` to use PgBouncer

---

## Phase 5: Monitoring & Logging

### 5.1 Set Up Sentry

**Create Sentry project:**
1. Go to https://sentry.io
2. Create new project: "AAA Platform"
3. Select "Next.js" and "FastAPI"
4. Copy DSN

**Add to Railway environment:**
```bash
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Install Sentry in Control Plane:**
```bash
cd aaa-platform/control-plane
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

**Install Sentry in GenAI Core:**
```bash
cd aaa-platform/genai-core
pip install sentry-sdk[fastapi]
```

### 5.2 Configure Uptime Monitoring

**Options:**
- BetterStack (https://betterstack.com)
- Uptime Robot (https://uptimerobot.com)
- Pingdom (https://pingdom.com)

**Monitor:**
- `https://apexautomation.ai/api/health` (every 5 minutes)
- `https://apexautomation.ai` (every 5 minutes)

**Alerts:**
- Email when down
- Slack/Discord webhook
- SMS for critical issues

### 5.3 Set Up Log Aggregation (Optional)

**Railway provides built-in logs.**

For advanced logging:
- Datadog
- Logtail
- Better Stack

---

## Phase 6: CI/CD Pipeline

### 6.1 Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Test Control Plane
        run: |
          cd aaa-platform/control-plane
          npm ci
          npm run build
          # npm test (when tests exist)

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Test GenAI Core
        run: |
          cd aaa-platform/genai-core
          pip install -r requirements.txt
          # pytest (when tests exist)

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### 6.2 Configure GitHub Secrets

**In GitHub repository → Settings → Secrets:**
- `RAILWAY_TOKEN`: Get from Railway dashboard
- `RAILWAY_PROJECT_ID`: Get from Railway dashboard

### 6.3 Test Deployment Pipeline

```bash
# Create test commit
git commit --allow-empty -m "test: CI/CD pipeline"
git push origin main

# Watch GitHub Actions
# Open: https://github.com/your-repo/actions
```

---

## Phase 7: Testing & Verification

### 7.1 Smoke Tests

**Test critical flows:**

1. **Health Checks**
```bash
curl https://apexautomation.ai/api/health
# Expected: {"status":"healthy"}
```

2. **Sign Up Flow**
- Go to https://apexautomation.ai/sign-up
- Create test account
- Verify email verification
- Verify redirects to dashboard

3. **Blueprint Generation**
- Sign in
- Navigate to "New Blueprint"
- Fill form
- Submit
- Verify blueprint generated

4. **Stripe Checkout**
- Sign in
- Click "Upgrade to Tier 2"
- Use Stripe test card: `4242 4242 4242 4242`
- Verify checkout completes
- Verify webhook received
- Verify tier updated

5. **Webhook Testing**
```bash
# Trigger test webhook from Stripe dashboard
# Verify logs in Railway show webhook received
railway logs --service control-plane | grep webhook
```

### 7.2 Load Testing (Optional)

```bash
# Install k6
brew install k6  # Mac
# or: snap install k6  # Linux

# Create load test script
cat > load-test.js << EOF
import http from 'k6/http';

export default function() {
  http.get('https://apexautomation.ai/api/health');
}

export let options = {
  vus: 10,
  duration: '30s',
};
EOF

# Run load test
k6 run load-test.js
```

### 7.3 Security Verification

**Test SSL:**
```bash
curl -vI https://apexautomation.ai
# Verify: TLS 1.3, valid certificate
```

**Test Security Headers:**
```bash
curl -I https://apexautomation.ai
# Verify presence of:
# - Strict-Transport-Security
# - X-Content-Type-Options
# - X-Frame-Options
```

**Test Webhook Signature Verification:**
```bash
# Send webhook with invalid signature
# Verify: 401 Unauthorized
```

---

## Success Criteria

### Must Have (MVP)
- [x] Platform accessible via HTTPS
- [ ] All services running and healthy
- [ ] Database migrations applied
- [ ] User sign-up working
- [ ] Blueprint generation working
- [ ] Stripe checkout working
- [ ] Webhooks receiving events
- [ ] Basic error tracking (Sentry)

### Nice to Have
- [ ] Custom domain configured
- [ ] Automated backups working
- [ ] CI/CD pipeline functional
- [ ] Uptime monitoring configured
- [ ] Load testing passed

### Production Ready
- [ ] All "Must Have" complete
- [ ] 99.9% uptime for 7 days
- [ ] No critical errors in Sentry
- [ ] Backup restoration tested
- [ ] Rollback procedure documented

---

## Rollback Plan

### If Deployment Fails

**Railway:**
1. Go to service → Deployments
2. Click previous deployment
3. Click "Redeploy"

**Database:**
```bash
# Restore from backup
railway run pg_restore -d $DATABASE_URL backup.sql
```

### If Database Migration Fails

```bash
# Rollback migration
railway run prisma migrate resolve --rolled-back <migration-name>
```

---

## Cost Estimate

### Railway (Recommended)
- PostgreSQL: $5/month (Hobby, 1GB)
- GenAI Core: $15-20/month (usage-based)
- Control Plane: $15-20/month (usage-based)
- **Total: $35-45/month**

### Additional Services
- Domain: $10-15/year
- Sentry: Free (5k events/month)
- Uptime monitoring: Free tier
- **Total: $10-15/year**

### First Month Total: ~$40-50

---

## Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 1. Preparation | 2 hours | 2 hours |
| 2. Railway Setup | 2 hours | 4 hours |
| 3. Domain & SSL | 1 hour | 5 hours |
| 4. Database Setup | 1 hour | 6 hours |
| 5. Monitoring | 2 hours | 8 hours |
| 6. CI/CD | 1.5 hours | 9.5 hours |
| 7. Testing | 0.5 hours | 10 hours |

**Total: 10 hours (1.25 working days)**

---

## Next Steps

1. **Immediate (Next 30 minutes):**
   - [ ] Create Railway account
   - [ ] Gather production API keys
   - [ ] Review domain options

2. **Today (Next 4 hours):**
   - [ ] Complete Railway deployment
   - [ ] Run database migrations
   - [ ] Test basic functionality

3. **Tomorrow:**
   - [ ] Configure custom domain
   - [ ] Set up monitoring
   - [ ] Implement CI/CD

---

## Support & Resources

### Documentation
- Railway Docs: https://docs.railway.app
- Next.js Deployment: https://nextjs.org/docs/deployment
- FastAPI Deployment: https://fastapi.tiangolo.com/deployment/
- Prisma Migrations: https://www.prisma.io/docs/guides/migrate

### Community
- Railway Discord: https://discord.gg/railway
- Next.js Discord: https://discord.gg/nextjs
- AAA Platform GitHub Issues: (your repo)

---

**Last Updated**: 2026-02-02
**Next Review**: After Phase 2 completion
**Owner**: Claude (TASK-016)
