# AAA Platform Skills & Automation Protocols

> Behavioral strata for building, deploying, and scaling the Apex Automation Architect platform.

---

## Skill Index

| Skill | Purpose | Trigger |
|-------|---------|---------|
| [Development Setup](#skill-development-setup) | Initialize local dev environment | "Set up development environment" |
| [Blueprint Engineering](#skill-blueprint-engineering) | Create/modify AI prompts | "Create a new blueprint prompt" |
| [Deployment Pipeline](#skill-deployment-pipeline) | Deploy to production | "Deploy to production" |
| [Stripe Integration](#skill-stripe-integration) | Payment flows | "Set up Stripe", "Add subscription" |
| [Testing Protocol](#skill-testing-protocol) | Verify system functionality | "Test the platform" |
| [Content Marketing](#skill-content-marketing) | Generate marketing content | "Create marketing content" |
| [Sales Automation](#skill-sales-automation) | Lead tracking & follow-up | "Set up sales pipeline" |
| [Troubleshooting](#skill-troubleshooting) | Debug issues | "Something is broken" |

---

## Skill: Development Setup

### Purpose
Initialize the complete AAA development environment from scratch.

### Prerequisites
- Node.js 18+
- Python 3.10+
- Docker (optional)

### Protocol

**Phase 0: Environment Detection**
```bash
# Verify we're in the right directory
pwd  # Should be /home/daymon/Businesses/Apex Automation
ls aaa-platform/  # Should see control-plane/ and genai-core/
```

**Phase 1: Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Required variables to configure:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - STRIPE_SECRET_KEY
# - STRIPE_WEBHOOK_SECRET
# - OPENROUTER_API_KEY
```

**Phase 2: Control Plane Setup**
```bash
cd aaa-platform/control-plane
npm install
npm run dev  # Starts on http://localhost:3000
```

**Phase 3: GenAI Core Setup**
```bash
cd aaa-platform/genai-core
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py  # Starts on http://localhost:8000
```

**Phase 4: Verification**
```bash
# Test Control Plane
curl http://localhost:3000  # Should return HTML

# Test GenAI Core
curl http://localhost:8000  # Should return {"status": "online", ...}
```

---

## Skill: Blueprint Engineering

### Purpose
Create, modify, and test AI prompts for generating automation blueprints.

### Prompt Architecture

All prompts live in: `aaa-platform/genai-core/app/prompts/`

### Protocol

**Phase 0: Understand the Use Case**
- What industry is this for?
- What pain points should it address?
- What integrations should it recommend?

**Phase 1: Create Prompt Template**
```python
# Location: aaa-platform/genai-core/app/prompts/

BLUEPRINT_SYSTEM_PROMPT = """
You are an automation architect for {industry} businesses.

Given the following context:
- Revenue Goal: {revenue_goal}
- Current Tech Stack: {tech_stack}
- Pain Points: {pain_points}

Generate a comprehensive automation blueprint that:
1. Identifies quick wins (implement in < 1 week)
2. Recommends tool integrations
3. Estimates time savings
4. Provides step-by-step implementation guide
"""
```

**Phase 2: Test with Mock Data**
```bash
# Use curl to test endpoint
curl -X POST http://localhost:8000/generate-blueprint \
  -H "Content-Type: application/json" \
  -d '{
    "industry": "Real Estate",
    "revenue_goal": "$100k/month",
    "tech_stack": ["Notion", "Calendly"],
    "pain_points": "Manual lead follow-up taking 4+ hours daily"
  }'
```

**Phase 3: Iterate on Output Quality**
- Review generated blueprints for actionability
- Ensure recommendations are specific, not generic
- Add industry-specific examples to prompts

**Phase 4: Document Changes**
- Update prompt version in file header
- Log changes in CHANGELOG.md

---

## Skill: Deployment Pipeline

### Purpose
Deploy AAA Platform to production with zero downtime.

### Deployment Options

| Method | Best For | Time |
|--------|----------|------|
| Railway | Speed, simplicity | ~10 min |
| Docker VPS | Control, cost | ~30 min |
| Vercel + Railway | Performance | ~15 min |

### Protocol: Railway Deployment

**Phase 0: Pre-flight Check**
```bash
# Ensure all changes committed
git status
git add . && git commit -m "Prepare for deployment"
git push origin main
```

**Phase 1: Deploy GenAI Core**
1. Go to railway.app → New Project → Deploy from GitHub
2. Set root directory: `aaa-platform/genai-core`
3. Add environment variables:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL=anthropic/claude-3.5-sonnet`
   - `PORT=8000`
4. Copy generated URL

**Phase 2: Deploy Control Plane**
1. Add new service to same Railway project
2. Set root directory: `aaa-platform/control-plane`
3. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_GENAI_CORE_URL` (from Phase 1)
4. Deploy

**Phase 3: Configure Domain**
1. Add custom domain in Railway settings
2. Update DNS records
3. Update `NEXT_PUBLIC_URL`

**Phase 4: Verification**
```bash
# Test production endpoints
curl https://app.apexautomation.io  # Control Plane
curl https://api.apexautomation.io  # GenAI Core
```

### Protocol: Docker Deployment

**Phase 0: Server Preparation**
```bash
# On fresh Ubuntu 22.04 VPS
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

**Phase 1: Deploy**
```bash
git clone [repo] && cd aaa-platform
cp .env.example .env
# Edit .env with production values
docker-compose up -d --build
```

**Phase 2: Reverse Proxy**
```bash
# Install Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure and get SSL
sudo certbot --nginx -d app.apexautomation.io
```

---

## Skill: Stripe Integration

### Purpose
Configure payment processing for subscriptions and one-time purchases.

### Protocol

**Phase 0: Stripe Dashboard Setup**
1. Create Stripe account at stripe.com
2. Enable test mode for development
3. Create products:
   - Tier 2 Core: $99/month, $199/month options
   - Tier 3 Apex: $2,500 one-time

**Phase 1: Configure Webhooks**
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://app.apexautomation.io/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

**Phase 2: Implement Webhook Handler**
```typescript
// Location: aaa-platform/control-plane/app/api/webhooks/stripe/route.ts

import Stripe from 'stripe';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const sig = headers().get('stripe-signature')!;
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Handle successful payment
      break;
    case 'customer.subscription.deleted':
      // Handle cancellation
      break;
  }
  
  return new Response('OK');
}
```

**Phase 3: Test Payment Flow**
```bash
# Use Stripe CLI for local testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

---

## Skill: Testing Protocol

### Purpose
Verify all system components work correctly.

### Protocol

**Phase 0: Unit Tests**
```bash
# Control Plane
cd aaa-platform/control-plane
npm run test

# GenAI Core
cd aaa-platform/genai-core
source venv/bin/activate
pytest
```

**Phase 1: Integration Tests**
```bash
# Test Control Plane → GenAI Core communication
curl -X POST http://localhost:8000/generate-blueprint \
  -H "Content-Type: application/json" \
  -d '{"industry":"Test","revenue_goal":"$50k","tech_stack":["Notion"],"pain_points":"Manual work"}'
```

**Phase 2: E2E Flow Test**
1. Create new user via Clerk
2. Complete diagnostic form
3. Verify blueprint generation
4. Test Stripe checkout (test mode)
5. Verify subscription status updates

**Phase 3: Load Testing**
```bash
# Optional: Use k6 or similar
k6 run --vus 10 --duration 30s tests/load-test.js
```

---

## Skill: Content Marketing

### Purpose
Generate "Cost of Pain" content to attract high-ticket leads.

### Protocol

**Phase 0: Identify Pain Points**
Target audiences:
- Real estate agents (manual lead follow-up)
- Service businesses (appointment scheduling chaos)
- E-commerce (abandoned cart losses)
- Coaches (manual billing and scheduling)

**Phase 1: Content Templates**

**Blog Post Template: "The $X,XXX/Month Problem"**
```markdown
# The $2,000/Month Tax You're Paying Without Knowing

Every hour spent on [manual task] costs you:
- $X in direct time
- $X in opportunity cost
- $X in customer friction

Here's how our client [Name] eliminated 90% of their admin work...
```

**Case Study Template**
```markdown
# [Industry]: From [Pain] to [Gain]

## The Before
- [Specific pain point with numbers]
- [Time/money being lost]

## The Solution
- [Blueprint component implemented]
- [Integration used]

## The Results
- [Metric 1: e.g., "4 hours/day saved"]
- [Metric 2: e.g., "$4,500 recovered revenue"]
```

**Phase 2: Distribution Channels**
1. LinkedIn articles (target decision-makers)
2. YouTube tutorials (SEO + credibility)
3. Email sequences (nurture leads)
4. Twitter threads (quick wins, tips)

**Phase 3: Conversion Path**
Content → Free Blueprint Assessment → Strategy Call → Close

---

## Skill: Sales Automation

### Purpose
Automate lead tracking and follow-up for high-ticket sales.

### Protocol

**Phase 0: CRM Setup**
Recommended: Notion database or HubSpot free tier

**Lead Pipeline Stages**:
1. New Lead
2. Booked Call
3. Call Completed
4. Proposal Sent
5. Won / Lost

**Phase 1: Automated Follow-up Sequences**

**Sequence: Post-Call Follow-up**
- Immediately: Send call recording + summary
- Day 1: "Any questions about what we discussed?"
- Day 3: Case study relevant to their industry
- Day 7: "Ready to start your transformation?"

**Sequence: No-Show Recovery**
- 5 min after: "Missed you on our call - here's my calendar"
- Day 1: "Let's reschedule - here's what you'll learn"
- Day 3: Final attempt with urgency

**Phase 2: Integration with n8n**
```json
{
  "trigger": "New lead in CRM",
  "actions": [
    "Send welcome email",
    "Create Calendly link",
    "Notify via Slack",
    "Start nurture sequence"
  ]
}
```

---

## Skill: Troubleshooting

### Purpose
Diagnose and fix common issues.

### Protocol

**Phase 0: Identify Symptoms**
- What's broken?
- When did it break?
- What changed recently?

**Phase 1: Common Issues**

**Control Plane won't start**
```bash
# Check logs
cd aaa-platform/control-plane
npm run dev 2>&1 | head -50

# Common fixes
rm -rf node_modules package-lock.json
npm install
```

**GenAI Core errors**
```bash
# Check Python version
python --version  # Should be 3.10+

# Check dependencies
source venv/bin/activate
pip install -r requirements.txt

# Test OpenRouter connection
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-3.5-sonnet","messages":[{"role":"user","content":"Hello"}]}'
```

**Clerk auth issues**
- Verify keys start with `pk_` and `sk_`
- Check Clerk dashboard for allowed origins
- Clear browser cookies

**Stripe webhook failures**
```bash
# View webhook logs
stripe logs tail

# Verify webhook secret matches
stripe webhooks list
```

**Phase 2: Escalation Path**
1. Check documentation in `docs/`
2. Search GitHub issues
3. Check service status pages (Clerk, Stripe, OpenRouter)
4. Contact support if infrastructure issue

---

## Automation Recipes

### Recipe: New Customer Onboarding
```
Trigger: checkout.session.completed

Actions:
1. Create user record in database
2. Send welcome email with dashboard link
3. Create customer in CRM
4. Assign onboarding checklist
5. Schedule 14-day check-in
```

### Recipe: Churn Prevention
```
Trigger: User inactive for 7 days

Actions:
1. Send re-engagement email
2. Log in CRM
3. If no response in 3 days → Send offer
4. If still inactive → Flag for manual outreach
```

### Recipe: High-Ticket Lead Qualification
```
Trigger: Form submission with revenue > $50k/month

Actions:
1. Priority flag in CRM
2. Send calendar link for strategy call
3. Notify founder via Slack
4. Add to VIP sequence
```

---

## Quick Reference Commands

```bash
# Start development
cd aaa-platform/control-plane && npm run dev
cd aaa-platform/genai-core && source venv/bin/activate && python main.py

# Deploy to production
docker-compose up -d --build

# View logs
docker-compose logs -f control-plane
docker-compose logs -f genai-core

# Test API
curl localhost:8000/generate-blueprint -X POST -H "Content-Type: application/json" -d '{...}'

# Stripe testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Database backup (if using PostgreSQL)
docker exec -t [db-container] pg_dump -U postgres > backup.sql
```

---

## Maintenance Schedule

| Task | Frequency | Protocol |
|------|-----------|----------|
| Security updates | Weekly | `npm audit fix`, `pip install --upgrade` |
| Log review | Daily | Check for errors in production |
| Backup verification | Weekly | Restore test to staging |
| Performance check | Monthly | Load testing, response times |
| Stripe reconciliation | Monthly | Match payments to subscriptions |
| Prompt optimization | Bi-weekly | Review blueprint quality |

---

## Emergency Contacts

| Service | Status Page | Support |
|---------|-------------|---------|
| Clerk | status.clerk.com | support@clerk.com |
| Stripe | status.stripe.com | Dashboard chat |
| OpenRouter | status.openrouter.ai | Discord |
| Railway | status.railway.app | Discord |
