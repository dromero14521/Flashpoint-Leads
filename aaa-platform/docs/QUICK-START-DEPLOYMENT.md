# Quick Start Deployment Guide

**Get AAA Platform deployed to Railway in under 1 hour**

---

## 🚀 Super Quick Deploy (15 minutes)

### Prerequisites
- ✅ GitHub account
- ✅ Test environment working locally
- ✅ Have your API keys ready (Clerk test, Stripe test, OpenRouter)

### Steps

1. **Sign up for Railway**
   ```
   Go to: https://railway.app/
   Sign in with GitHub
   ```

2. **Create New Project**
   ```
   Click "New Project"
   Select "Empty Project"
   Name: aaa-platform-production
   ```

3. **Add PostgreSQL**
   ```
   Click "+ New Service" → Database → PostgreSQL
   Wait 1 minute for provisioning
   ```

4. **Deploy Control Plane**
   ```
   Click "+ New Service" → GitHub Repo
   Select: Apex Automation/aaa-platform
   Root Directory: aaa-platform/control-plane
   ```

5. **Deploy GenAI Core**
   ```
   Click "+ New Service" → GitHub Repo (same repo)
   Root Directory: aaa-platform/genai-core
   ```

6. **Add Environment Variables**

   **Control Plane** - Click service → Variables → Add all:
   ```bash
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   NEXT_PUBLIC_URL=${{RAILWAY_PUBLIC_DOMAIN}}
   NEXT_PUBLIC_GENAI_CORE_URL=${{genai-core.RAILWAY_PUBLIC_DOMAIN}}
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY
   CLERK_SECRET_KEY=sk_test_YOUR_KEY
   STRIPE_SECRET_KEY=sk_test_YOUR_KEY
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY
   STRIPE_PRICE_TIER2_MONTHLY_99=price_YOUR_KEY
   NODE_ENV=production
   ```

   **GenAI Core** - Click service → Variables → Add:
   ```bash
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
   ```

7. **Run Database Migrations**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login
   railway login

   # Link project
   cd aaa-platform/control-plane
   railway link  # Select: aaa-platform-production → control-plane

   # Run migrations
   railway run npx prisma migrate deploy
   railway run psql $DATABASE_URL -f prisma/migrations/add_multi_tenant_isolation.sql
   ```

8. **Test Your Deployment**
   ```
   Visit: https://aaa-platform-production.up.railway.app
   Sign up, test blueprint generation
   ```

**Done! You're live!** 🎉

---

## 📖 Full Documentation

For detailed instructions, see:
- **[Railway Deployment Guide](./RAILWAY-DEPLOYMENT-GUIDE.md)** (Complete step-by-step)
- **[API Keys Guide](./API-KEYS-SETUP.md)** (Get production keys)

---

## 🛠️ Automated Deployment Script

Use our automated script for easier deployment:

```bash
cd /home/daymon/Businesses/Apex\ Automation/aaa-platform
./scripts/deploy-railway.sh
```

**Menu Options**:
1. Initial Setup (CLI + Login + Link)
2. Run Database Migrations
3. Deploy Latest Changes
4. View Logs
5. Open Railway Dashboard
6. Full Deployment (all-in-one)
7. Verify Deployment

---

## 🔧 Common Commands

```bash
# View logs
railway logs

# Open dashboard
railway open

# Run command in Railway environment
railway run <command>

# Connect to database
railway run psql $DATABASE_URL

# Deploy manually
railway up

# Check status
railway status
```

---

## ⚡ Troubleshooting Quick Fixes

### Build fails?
```bash
# Check logs
railway logs --service control-plane

# Common fix: Regenerate Prisma client
railway run npx prisma generate
```

### Database connection error?
```bash
# Verify DATABASE_URL is set
railway variables

# Should show: DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 502 Bad Gateway?
```bash
# Check if service is running
railway status

# Restart service
railway restart
```

---

## 💰 Costs

**Monthly Estimate**:
- Railway PostgreSQL: ~$5-10
- Railway Hosting (2 services): ~$10-20
- **Total: ~$15-30/month**

**Free Trial**: Railway provides $5/month in free credits

---

## 🎯 Next Steps After Deployment

1. **Test thoroughly** with test credit cards
2. **Get production API keys** (Clerk Pro, Stripe Live)
3. **Add custom domain** (optional)
4. **Set up monitoring** (Sentry, uptime checks)
5. **Launch!** 🚀

---

## 📞 Need Help?

- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app/
- AAA Platform Docs: `/aaa-platform/docs/`

---

**Happy Deploying!** 🚀
