# Production Deployment Guide

Complete guide for deploying the AAA Platform to production with Docker, Railway, or VPS.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Option 1: Railway (Recommended)](#option-1-railway-recommended)
- [Option 2: Docker on VPS](#option-2-docker-on-vps)
- [Option 3: Hybrid (Vercel + Railway)](#option-3-hybrid-vercel--railway)
- [Environment Variables](#environment-variables)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Database Management](#database-management)
- [Monitoring & Logging](#monitoring--logging)
- [CI/CD Pipeline](#cicd-pipeline)
- [Rollback Strategy](#rollback-strategy)
- [Troubleshooting](#troubleshooting)

---

## Overview

The AAA Platform consists of three services:
- **Control Plane** (Next.js) - Port 3000
- **GenAI Core** (Python/FastAPI) - Port 8000
- **PostgreSQL Database** - Port 5432

```
┌─────────────────────────────────────────────────────────────┐
│                  Production Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  Nginx   │─────▶│ Control Plane│─────▶│  GenAI Core  │  │
│  │  (SSL)   │      │   (Next.js)  │      │   (FastAPI)  │  │
│  └──────────┘      └───────┬──────┘      └──────────────┘  │
│                            │                                │
│                            ▼                                │
│                    ┌──────────────┐                         │
│                    │  PostgreSQL  │                         │
│                    └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Accounts
- [x] GitHub account (for CI/CD)
- [x] Clerk account (authentication) - https://dashboard.clerk.com
- [x] Stripe account (payments) - https://dashboard.stripe.com
- [x] OpenRouter account (LLM API) - https://openrouter.ai

### Recommended Accounts
- [x] Railway account (hosting) - https://railway.app
- [x] Sentry account (error tracking) - https://sentry.io
- [x] Domain registrar (e.g., Cloudflare, Namecheap)
- [x] AWS account (for S3 backups)

### Local Tools
```bash
# Docker & Docker Compose
docker --version  # >= 20.10
docker-compose --version  # >= 1.29

# Node.js
node --version  # >= 20

# Python
python --version  # >= 3.11

# Git
git --version
```

---

## Deployment Options

### Comparison

| Feature | Railway | Docker VPS | Hybrid (Vercel + Railway) |
|---------|---------|------------|---------------------------|
| **Setup Time** | 15 minutes | 1-2 hours | 30 minutes |
| **Cost** | $20-50/mo | $10-20/mo | $30-60/mo |
| **Scalability** | Excellent | Manual | Excellent |
| **Control** | Limited | Full | Balanced |
| **Best For** | MVP, fast launch | Cost-conscious, control | Production scale |

---

## Option 1: Railway (Recommended)

Railway provides zero-config PostgreSQL, automatic SSL, and simple deployment.

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to project (creates new if needed)
railway init
```

### Step 2: Configure Services

The `railway.toml` file is already configured:

```toml
# Services: control-plane, genai-core, postgres
# See railway.toml in project root
```

### Step 3: Set Environment Variables

In Railway dashboard (Settings > Variables):

```bash
# Control Plane
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-injected
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
GENAI_CORE_URL=${{genai-core.RAILWAY_PUBLIC_DOMAIN}}

# GenAI Core
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Step 4: Deploy

```bash
# Deploy both services
railway up

# Watch logs
railway logs --service control-plane
railway logs --service genai-core

# Get URLs
railway domain
```

### Step 5: Configure Custom Domain

1. Go to Railway dashboard
2. Select `control-plane` service
3. Click "Settings" > "Domains"
4. Add custom domain: `apexautomation.ai`
5. Update DNS records (CNAME to Railway)

Railway automatically provisions SSL certificate via Let's Encrypt.

### Step 6: Test Deployment

```bash
# Health check
curl https://apexautomation.ai/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2026-02-02T10:30:00Z",
  "services": {
    "database": "operational",
    "genai_core": "operational"
  }
}
```

---

## Option 2: Docker on VPS

Deploy to DigitalOcean, AWS EC2, Hetzner, or any VPS.

### Step 1: Provision VPS

Minimum requirements:
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS

Recommended providers:
- DigitalOcean: $24/month (Basic Droplet)
- Hetzner: €4.51/month (CPX21)
- AWS Lightsail: $20/month

### Step 2: Install Docker

```bash
# SSH into VPS
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 3: Clone Repository

```bash
# Create app directory
mkdir -p /app
cd /app

# Clone repository
git clone https://github.com/your-username/apex-automation.git
cd apex-automation
```

### Step 4: Configure Environment

```bash
# Copy environment template
cp .env.production.example .env.production

# Edit environment variables
nano .env.production

# Set all required secrets (see Environment Variables section)
```

### Step 5: Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Test services
curl http://localhost:3000/api/health
curl http://localhost:8000/health
```

### Step 6: Configure Nginx & SSL

```bash
# Install Certbot for Let's Encrypt
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d apexautomation.ai -d www.apexautomation.ai

# Certificate will auto-renew via cron
sudo certbot renew --dry-run
```

The `nginx.conf` file is already configured in project root. Nginx container will handle reverse proxy and SSL termination.

### Step 7: Set Up Auto-Start

```bash
# Enable Docker service on boot
sudo systemctl enable docker

# Docker Compose services will restart automatically
# (configured with `restart: unless-stopped` in docker-compose.yml)
```

---

## Option 3: Hybrid (Vercel + Railway)

Deploy control-plane to Vercel (optimal Next.js hosting) and genai-core to Railway.

### Control Plane on Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd aaa-platform/control-plane
vercel --prod

# Set environment variables in Vercel dashboard
# GENAI_CORE_URL should point to Railway service
```

### GenAI Core on Railway

```bash
# Deploy only genai-core service
railway up --service genai-core

# Get Railway URL
railway domain --service genai-core
```

Update Vercel environment variable:
```bash
GENAI_CORE_URL=https://genai-core-production.up.railway.app
```

---

## Environment Variables

### Production Secrets Checklist

Copy `.env.production.example` and fill in:

#### Critical (Required)
- [x] `DATABASE_URL` - PostgreSQL connection string
- [x] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- [x] `CLERK_SECRET_KEY` - Clerk secret key
- [x] `STRIPE_SECRET_KEY` - Stripe live key
- [x] `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- [x] `OPENROUTER_API_KEY` - OpenRouter API key

#### Important (Recommended)
- [x] `SENTRY_DSN` - Error tracking
- [x] `GENAI_CORE_URL` - Internal service URL
- [x] `NEXT_PUBLIC_URL` - Public app URL

#### Optional (Enhanced Features)
- [ ] `AWS_ACCESS_KEY_ID` - For S3 backups
- [ ] `SMTP_*` - Email notifications
- [ ] `NEXT_PUBLIC_GA_ID` - Google Analytics

**Security Best Practices:**
1. Never commit `.env.production` to git (in `.gitignore`)
2. Rotate secrets quarterly
3. Use different secrets for staging vs production
4. Use secret managers (Doppler, 1Password, AWS Secrets Manager)
5. Limit access to production secrets

---

## SSL/TLS Configuration

### Let's Encrypt (Free SSL)

For VPS deployments:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate (automatic with nginx.conf)
sudo certbot --nginx -d apexautomation.ai -d www.apexautomation.ai

# Verify auto-renewal
sudo certbot renew --dry-run

# Cron job (auto-installed)
# 0 3 * * * certbot renew --quiet
```

### Railway/Vercel

SSL certificates are automatically provisioned and renewed. No manual configuration needed.

### Verify SSL

```bash
# Check SSL certificate
openssl s_client -connect apexautomation.ai:443 -servername apexautomation.ai

# Test HTTPS
curl -I https://apexautomation.ai
```

---

## Database Management

### Backups

#### Automated Daily Backups

```bash
# Copy backup script to VPS
scp scripts/backup-db.sh root@your-server:/usr/local/bin/

# Make executable
chmod +x /usr/local/bin/backup-db.sh

# Set up cron job (daily at 2 AM)
crontab -e

# Add line:
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/backup.log 2>&1
```

#### Manual Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U aaa -d aaa_production | gzip > backup_$(date +%Y%m%d).sql.gz

# Upload to S3
aws s3 cp backup_20260202.sql.gz s3://aaa-backups-production/
```

### Restore

```bash
# Download backup from S3
aws s3 cp s3://aaa-backups-production/backup_20260202.sql.gz .

# Restore database
scripts/restore-db.sh backup_20260202.sql.gz
```

### Migrations

```bash
# Run migrations (control-plane)
cd aaa-platform/control-plane

# Development
npx prisma migrate dev

# Production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## Monitoring & Logging

### Sentry (Error Tracking)

1. Create Sentry project: https://sentry.io
2. Copy DSN from project settings
3. Set `SENTRY_DSN` environment variable
4. Errors will be automatically tracked

### Docker Logs

```bash
# View all logs
docker-compose logs -f

# Specific service
docker-compose logs -f control-plane
docker-compose logs -f genai-core

# Last 100 lines
docker-compose logs --tail=100 control-plane

# Save logs to file
docker-compose logs > logs_$(date +%Y%m%d).txt
```

### Railway Logs

```bash
# Watch logs
railway logs --service control-plane
railway logs --service genai-core

# Search logs
railway logs --search "error"
```

### Health Monitoring

```bash
# Set up health check monitoring (e.g., UptimeRobot, Pingdom)
# Monitor: https://apexautomation.ai/api/health
# Frequency: Every 5 minutes
# Alert: Email/SMS on failure
```

---

## CI/CD Pipeline

GitHub Actions workflow automatically runs on every push to `main`.

### Workflow Overview

`.github/workflows/deploy.yml`:

1. **Test Control Plane** - Lint, build, type check
2. **Test GenAI Core** - Run pytest suite
3. **Deploy to Railway** - Deploy both services
4. **Smoke Tests** - Verify deployment health

### GitHub Secrets

Required secrets in repository settings:

```bash
RAILWAY_TOKEN          # Railway API token
RAILWAY_DOMAIN         # Your Railway domain
VPS_SSH_KEY            # SSH private key (if using VPS)
VPS_HOST               # VPS IP address
VPS_USER               # SSH username
PRODUCTION_DOMAIN      # Your production domain
```

### Manual Deployment

```bash
# Trigger workflow manually
gh workflow run deploy.yml

# Or use Railway CLI
railway up

# Or SSH to VPS
ssh deploy@your-server "cd /app/apex-automation && git pull && docker-compose up -d --build"
```

---

## Rollback Strategy

### Railway

Use Railway dashboard:
1. Go to Deployments
2. Find previous successful deployment
3. Click "Rollback"

Or via CLI:
```bash
railway rollback
```

### Docker/VPS

```bash
# Find previous working commit
git log --oneline

# Checkout previous commit
git checkout <commit-hash>

# Rebuild and restart
docker-compose up -d --build

# Or restore from backup
scripts/restore-db.sh /var/backups/postgres/aaa_backup_20260201_020000.sql.gz
```

### Database Migration Rollback

```bash
# Prisma rollback
npx prisma migrate rollback

# Manual SQL rollback
psql -U aaa -d aaa_production < rollback.sql
```

---

## Troubleshooting

### Service Not Starting

```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs control-plane
docker-compose logs genai-core

# Restart service
docker-compose restart control-plane

# Rebuild if needed
docker-compose up -d --build
```

### Database Connection Errors

```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Check connection string
echo $DATABASE_URL

# Test connection
docker-compose exec postgres psql -U aaa -d aaa_production -c "SELECT 1"
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates

# Test certificate
openssl s_client -connect apexautomation.ai:443
```

### Health Check Failing

```bash
# Test control-plane health
curl http://localhost:3000/api/health

# Test genai-core health
curl http://localhost:8000/health

# Check service connectivity
docker-compose exec control-plane curl http://genai-core:8000/health
```

### High Memory Usage

```bash
# Check Docker stats
docker stats

# Restart services
docker-compose restart

# Adjust memory limits in docker-compose.yml:
services:
  control-plane:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Slow Response Times

1. Check GenAI Core logs for OpenRouter API delays
2. Increase Uvicorn workers in genai-core
3. Enable caching for blueprint responses
4. Consider upgrading VPS tier

---

## Post-Deployment Checklist

After successful deployment, verify:

- [x] Health checks responding (200 OK)
- [x] SSL certificate valid (HTTPS working)
- [x] Clerk authentication working
- [x] Stripe webhooks receiving events
- [x] GenAI Core generating blueprints
- [x] Database backups running daily
- [x] Error tracking (Sentry) receiving events
- [x] CI/CD pipeline passing
- [x] Custom domain configured
- [x] Monitoring alerts configured

---

## Support & Resources

- **Documentation**: `/docs` folder
- **GitHub Issues**: https://github.com/your-username/apex-automation/issues
- **Railway Docs**: https://docs.railway.app
- **Docker Docs**: https://docs.docker.com

---

## Next Steps

1. Set up monitoring (UptimeRobot, Pingdom)
2. Configure alerting (PagerDuty, Opsgenie)
3. Enable database read replicas (for scale)
4. Set up staging environment
5. Implement blue-green deployments

---

**Deployment completed! 🚀**

Your AAA Platform is now live at: https://apexautomation.ai
