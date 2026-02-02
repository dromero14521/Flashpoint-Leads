# TASK-016: Production Deployment Setup

**Status**: TODO
**Priority**: CRITICAL
**Phase**: Month 1-6 (Ongoing)
**Estimated Effort**: 8-12 hours
**Dependencies**: TASK-001
**Assigned To**: Unassigned

---

## Objective

Deploy the AAA platform to production using Docker Compose on Railway (or alternative) with proper SSL, monitoring, backups, and CI/CD pipeline.

---

## Description

Production deployment requires:
- Hosting environment (Railway, Vercel + Railway, or VPS)
- SSL/TLS certificates (HTTPS)
- Environment variable management
- Database setup and backups
- Monitoring and logging
- CI/CD pipeline for automated deployments

**Deployment Options** (per `docs/01-PRODUCTION-DEPLOYMENT.md`):
1. Railway (recommended for MVP)
2. Docker on VPS (DigitalOcean, AWS, Hetzner)
3. Hybrid (Vercel for control-plane + Railway for genai-core)

---

## Acceptance Criteria

- [ ] Production hosting environment selected and configured
- [ ] SSL certificate installed (HTTPS working)
- [ ] Environment variables configured securely
- [ ] Database deployed (PostgreSQL or MongoDB)
- [ ] Database backup strategy implemented
- [ ] Monitoring/logging configured (Sentry, LogRocket, or similar)
- [ ] CI/CD pipeline set up (GitHub Actions)
- [ ] Health check endpoints implemented
- [ ] Deployment rollback strategy documented
- [ ] Custom domain configured (e.g., apexautomation.ai)
- [ ] Production smoke tests passing
- [ ] Documentation: `docs/PRODUCTION-DEPLOYMENT.md` (update existing)

---

## Deployment Architecture

### Option 1: Railway (Recommended)

**Services**:
- `control-plane` (Next.js) - Port 3000
- `genai-core` (Python/FastAPI) - Port 8000
- `postgres` (Database) - Port 5432

**Railway Configuration**:
```yaml
# railway.toml
[build]
builder = "NIXPACKS"

[[build.env]]
NIXPACKS_DOCKER_VERSION = "1.0.0"

[deploy]
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

**Steps**:
1. Create Railway project
2. Connect GitHub repository
3. Create three services: control-plane, genai-core, postgres
4. Set environment variables in Railway dashboard
5. Deploy from `main` branch
6. Configure custom domain

---

### Option 2: Docker Compose on VPS

**docker-compose.yml**:
```yaml
version: "3.8"

services:
  control-plane:
    build: ./control-plane
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - GENAI_CORE_URL=http://genai-core:8000
    depends_on:
      - postgres
      - genai-core

  genai-core:
    build: ./genai-core
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
      - OPENROUTER_MODEL=${OPENROUTER_MODEL}

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_USER=aaa
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=aaa_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - control-plane

volumes:
  postgres_data:
```

**Nginx Configuration**:
```nginx
# nginx.conf
server {
    listen 80;
    server_name apexautomation.ai www.apexautomation.ai;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name apexautomation.ai www.apexautomation.ai;

    ssl_certificate /etc/letsencrypt/live/apexautomation.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apexautomation.ai/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://control-plane:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/genai/ {
        proxy_pass http://genai-core:8000/;
        proxy_set_header Host $host;
    }
}
```

---

## Environment Variables Management

### Production .env Template

```bash
# Control Plane (Next.js)
NODE_ENV=production
NEXT_PUBLIC_URL=https://apexautomation.ai
DATABASE_URL=postgresql://user:pass@postgres:5432/aaa_production

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# GenAI Core URL
GENAI_CORE_URL=https://apexautomation.ai/api/genai

# GenAI Core (Python)
OPENROUTER_API_KEY=sk-or-xxxxx
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Database
POSTGRES_PASSWORD=xxxxx

# Monitoring
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

**Secrets Management**:
- Use Railway's built-in secrets manager
- Or use Doppler, AWS Secrets Manager, or 1Password
- Never commit `.env` to git

---

## Database Setup

### PostgreSQL Production Configuration

```sql
-- Create production database
CREATE DATABASE aaa_production;

-- Create tables (run migrations)
-- Control plane handles this via Prisma/Drizzle migrations

-- Set up read replicas (optional, for scale)
-- Set up connection pooling (PgBouncer)
```

### Backup Strategy

```bash
# Daily automated backups (cron job)
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/var/backups/postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/aaa_backup_$TIMESTAMP.sql.gz"

# Create backup
pg_dump -h postgres -U aaa -d aaa_production | gzip > $BACKUP_FILE

# Upload to S3 (or Backblaze B2)
aws s3 cp $BACKUP_FILE s3://aaa-backups/

# Keep only last 30 days of backups locally
find $BACKUP_DIR -type f -mtime +30 -delete
```

**Cron Schedule**:
```cron
0 2 * * * /usr/local/bin/backup-db.sh # Daily at 2 AM
```

---

## Monitoring & Logging

### Sentry (Error Tracking)

```typescript
// control-plane/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
});
```

```python
# genai-core/main.py
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("ENVIRONMENT", "production"),
    traces_sample_rate=0.1,
)
```

### Health Check Endpoints

```typescript
// control-plane/app/api/health/route.ts
export async function GET() {
  const dbHealthy = await checkDatabaseConnection();
  const genaiHealthy = await checkGenAICoreConnection();

  if (dbHealthy && genaiHealthy) {
    return Response.json({ status: "healthy" }, { status: 200 });
  } else {
    return Response.json(
      {
        status: "unhealthy",
        database: dbHealthy,
        genai_core: genaiHealthy,
      },
      { status: 500 }
    );
  }
}
```

```python
# genai-core/main.py
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
```

---

## CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run tests (control-plane)
        run: |
          cd control-plane
          npm install
          npm test

      - name: Run tests (genai-core)
        run: |
          cd genai-core
          pip install -r requirements.txt
          pytest

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Railway
        run: |
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up

      # Alternative: Deploy via Docker
      - name: Build and push Docker images
        run: |
          docker build -t aaa-control-plane ./control-plane
          docker build -t aaa-genai-core ./genai-core
          docker push aaa-control-plane
          docker push aaa-genai-core

      - name: Deploy to VPS
        run: |
          ssh deploy@your-server.com "cd /app && docker-compose pull && docker-compose up -d"
```

---

## SSL/TLS Certificate Setup

### Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d apexautomation.ai -d www.apexautomation.ai

# Auto-renewal (cron)
0 3 * * * certbot renew --quiet
```

---

## Testing Steps

### Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Environment variables configured in production
- [ ] Database migrations tested
- [ ] SSL certificate valid
- [ ] Health check endpoints responding
- [ ] Error tracking (Sentry) working

### Post-Deployment Smoke Tests

```bash
# Test health endpoints
curl https://apexautomation.ai/api/health
curl https://apexautomation.ai/api/genai/health

# Test critical flows
# 1. Sign up new user
# 2. Generate blueprint
# 3. Subscribe to Tier 2
# 4. Cancel subscription

# Monitor logs for errors
railway logs --service control-plane
railway logs --service genai-core
```

---

## Rollback Strategy

### If Deployment Fails

**Railway**:
- Use "Rollback" button in Railway dashboard
- Or redeploy previous commit

**Docker/VPS**:
```bash
# Rollback to previous version
git log # Find previous working commit
git checkout <previous-commit>
docker-compose up -d --build
```

**Database Migration Rollback**:
```bash
# If using Prisma
npx prisma migrate rollback

# Manual SQL rollback (if needed)
psql -U aaa -d aaa_production < backups/rollback.sql
```

---

## Blockers

- Requires production hosting account (Railway, AWS, etc.)
- Requires domain name purchased
- Requires SSL certificate (can use free Let's Encrypt)
- Requires production API keys (Clerk, Stripe, OpenRouter)

---

## Notes

- **Start simple**: Railway deployment is fastest to production
- **Optimize later**: Don't over-engineer for scale you don't have yet
- **Monitor everything**: Set up alerts for errors, downtime, high CPU
- **Plan for scale**: When you hit 1000+ users, migrate to Kubernetes or multi-region

---

## Related Tasks

- TASK-001: Environment Configuration (production secrets)
- TASK-017: Security & Compliance (SSL, headers, encryption)
