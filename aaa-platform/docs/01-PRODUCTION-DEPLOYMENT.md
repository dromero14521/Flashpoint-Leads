# Production Deployment Guide

This guide covers deploying the AAA Platform to production using various cloud providers.

---

## Prerequisites

Before deploying, ensure you have:

- [ ] **Clerk Account** - [clerk.com](https://clerk.com)
- [ ] **Stripe Account** - [stripe.com](https://stripe.com)
- [ ] **OpenRouter API Key** - [openrouter.ai](https://openrouter.ai)
- [ ] **Domain Name** - For your production URL
- [ ] **Cloud Provider Account** - Railway, Render, AWS, or GCP

---

## Option 1: Railway (Recommended for Speed)

Railway offers the fastest path to production with automatic builds and easy scaling.

### Step 1: Prepare Your Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
gh repo create aaa-platform --private --push
```

### Step 2: Deploy GenAI Core

1. Go to [railway.app](https://railway.app) and create a new project
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Set the root directory to `aaa-platform/genai-core`
5. Add environment variables:

   | Variable | Value |
   |----------|-------|
   | `OPENROUTER_API_KEY` | Your OpenRouter key |
   | `OPENROUTER_MODEL` | `anthropic/claude-3.5-sonnet` |
   | `PORT` | `8000` |

6. Railway will auto-detect the Dockerfile and deploy
7. Copy the generated URL (e.g., `genai-core-production.up.railway.app`)

### Step 3: Deploy Control Plane

1. Create a new service in the same Railway project
2. Set the root directory to `aaa-platform/control-plane`
3. Add environment variables:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk public key |
   | `CLERK_SECRET_KEY` | Your Clerk secret key |
   | `STRIPE_SECRET_KEY` | Your Stripe secret key |
   | `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook secret |
   | `NEXT_PUBLIC_URL` | Your production URL |
   | `NEXT_PUBLIC_GENAI_CORE_URL` | GenAI Core Railway URL |

4. Deploy and copy the Control Plane URL

### Step 4: Configure Custom Domain

1. In Railway, go to Settings → Domains
2. Add your custom domain (e.g., `app.apexautomation.io`)
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_URL` to your custom domain

---

## Option 2: Docker Compose on VPS

For more control, deploy to a VPS (DigitalOcean, Linode, Vultr).

### Step 1: Provision Server

```bash
# Ubuntu 22.04 recommended, minimum 2GB RAM
# SSH into your server

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Log out and back in for group changes
exit
```

### Step 2: Clone and Configure

```bash
# Clone your repository
git clone https://github.com/yourusername/aaa-platform.git
cd aaa-platform

# Create production environment file
cp .env.example .env
nano .env  # Edit with production values
```

### Step 3: Configure Nginx Reverse Proxy

```bash
sudo apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/aaa-platform
```

Add this configuration:

```nginx
server {
    server_name app.apexautomation.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name api.apexautomation.io;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/aaa-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d app.apexautomation.io -d api.apexautomation.io
```

### Step 4: Deploy with Docker Compose

```bash
# Build and start containers
docker compose up -d --build

# Check logs
docker compose logs -f

# Restart if needed
docker compose restart
```

### Step 5: Set Up Automatic Updates

```bash
# Create update script
cat > ~/update-aaa.sh << 'EOF'
#!/bin/bash
cd ~/aaa-platform
git pull
docker compose down
docker compose up -d --build
docker system prune -f
EOF

chmod +x ~/update-aaa.sh
```

---

## Option 3: Vercel + Railway Split

For optimal performance, deploy the Next.js frontend to Vercel.

### Step 1: Deploy GenAI Core to Railway

Follow Option 1, Steps 2 only for GenAI Core.

### Step 2: Deploy Control Plane to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Set the root directory to `aaa-platform/control-plane`
4. Add environment variables (same as Railway Step 3)
5. Deploy

### Step 3: Configure Domain

1. In Vercel, go to Settings → Domains
2. Add your custom domain
3. Update Clerk's allowed origins

---

## Stripe Webhook Configuration

After deployment, configure Stripe webhooks:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://app.apexautomation.io/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Clerk Configuration

Configure Clerk for production:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new **Production** instance
3. Configure:
   - **Allowed origins**: `https://app.apexautomation.io`
   - **Sign-in URL**: `https://app.apexautomation.io/sign-in`
   - **Sign-up URL**: `https://app.apexautomation.io/sign-up`
   - **After sign-in URL**: `https://app.apexautomation.io/dashboard`
4. Copy production keys to your environment

---

## Monitoring & Observability

### Application Monitoring

```bash
# Add to docker-compose.yml for basic monitoring
  uptime-kuma:
    image: louislam/uptime-kuma:1
    volumes:
      - ./uptime-kuma:/app/data
    ports:
      - "3001:3001"
    restart: unless-stopped
```

### Log Aggregation

Consider adding:

- **Sentry** for error tracking (Next.js + Python SDKs)
- **Posthog** for product analytics
- **Grafana + Loki** for log aggregation

---

## Security Checklist

- [ ] All API keys in environment variables (never in code)
- [ ] HTTPS enabled on all endpoints
- [ ] Rate limiting configured on API endpoints
- [ ] CORS configured to allow only your domains
- [ ] Database backups scheduled (if using persistent storage)
- [ ] Firewall rules configured (only ports 80, 443, 22 open)

---

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.yml - scale GenAI Core
docker compose up -d --scale genai-core=3
```

### Vertical Scaling

- **Control Plane**: 1 vCPU, 1GB RAM minimum
- **GenAI Core**: 2 vCPU, 2GB RAM minimum (for concurrent LLM calls)

### CDN

Add Cloudflare in front for:

- DDoS protection
- Edge caching
- SSL termination
- Analytics

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs control-plane
docker compose logs genai-core

# Rebuild from scratch
docker compose down
docker system prune -a
docker compose up -d --build
```

### Clerk authentication issues

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_`
- Verify `CLERK_SECRET_KEY` starts with `sk_`
- Check Clerk dashboard for allowed origins

### OpenRouter API errors

- Verify API key at [openrouter.ai/keys](https://openrouter.ai/keys)
- Check model availability
- Monitor rate limits

---

## Cost Estimates

| Service | Monthly Cost |
|---------|-------------|
| Railway (Hobby) | $5-20 |
| Vercel (Pro) | $20 |
| Clerk (Pro) | $25 |
| Stripe | 2.9% + 30¢ per transaction |
| OpenRouter | Pay-per-use (~$0.003/request) |
| Domain | ~$12/year |

**Estimated Total**: $50-75/month at launch
