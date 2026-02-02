# Apex Automation Architect (AAA) Platform

> **Mission**: Transform static template selling into AI-driven automation architecture, achieving $50k/month by Month 6.

## Project Identity

The **Apex Automation Architect (AAA)** is a multi-tenant SaaS platform that uses Generative AI as a "Consultant-in-a-Box" to displace static template sellers and manual consultants.

### Core Value Proposition
- **Not a tool** → **A transformation**
- **Not templates** → **Bespoke automation blueprints**
- **Not consulting hours** → **Instant AI-generated architecture**

---

## Strategic Context

### Market Gap We're Exploiting

| Model | Pain Point | AAA Advantage |
|-------|------------|---------------|
| Static Template Sellers | Zero customization | AI generates unique blueprints |
| One-Off Consultants | Non-scalable, time-for-money | Infinite scale via GenAI |
| DIY Tools | High friction, user does the work | Platform does the thinking |

### Revenue Model

**Target: $50,000/month by Month 6**

| Tier | Price | Role |
|------|-------|------|
| **Tier 1** (Freemium) | $0 | "Crippleware" - Capture market share |
| **Tier 2** (Core Subscription) | $99-199/mo | Primary recurring revenue driver |
| **Tier 3** (Apex Implementation) | $2,500-5,000 | High-ticket white-glove service |

**Revenue Mix Target**:
- 10 high-ticket clients/month × $2,500 = $25,000
- 250 subscribers × $100/month = $25,000

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AAA Platform                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────────────┐   │
│  │   CONTROL PLANE      │    │       GENAI CORE             │   │
│  │   (Next.js 15)       │───▶│       (Python/FastAPI)       │   │
│  │                      │    │                              │   │
│  │ • Clerk Auth         │    │ • OpenRouter LLM             │   │
│  │ • Stripe Billing     │    │ • Blueprint Generation       │   │
│  │ • User Dashboard     │    │ • Prompt Engineering         │   │
│  │ • Port: 3000         │    │ • Port: 8000                 │   │
│  └──────────────────────┘    └──────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend/Control Plane** | Next.js 15, TypeScript, Tailwind CSS | User experience, dashboard |
| **Authentication** | Clerk | Multi-tenant user management |
| **Billing** | Stripe | Subscriptions & one-time payments |
| **AI Engine** | Python/FastAPI, OpenRouter | Blueprint generation |
| **Deployment** | Docker Compose, Railway/Vercel | Production hosting |

### Project Structure

```
/home/daymon/Businesses/Apex Automation/
├── CLAUDE.md                  # This file - Project context
├── SKILLS.md                  # Automation skills & protocols
├── GEMINI.md                  # Strategic roadmap documentation
├── docker-compose.yml         # Multi-container deployment
├── .env.example               # Environment variables template
└── aaa-platform/
    ├── README.md              # Platform documentation
    ├── control-plane/         # Next.js Application
    │   ├── app/
    │   │   ├── dashboard/     # Protected routes
    │   │   ├── sign-in/       # Clerk sign-in
    │   │   └── sign-up/       # Clerk sign-up
    │   ├── lib/
    │   │   └── stripe.ts      # Stripe helper
    │   └── middleware.ts      # Auth middleware
    ├── genai-core/            # Python AI Service
    │   ├── main.py            # FastAPI entry point
    │   ├── app/
    │   │   ├── prompts/       # Prompt engineering
    │   │   └── services/      # Business logic
    │   └── requirements.txt
    └── docs/
        ├── 01-PRODUCTION-DEPLOYMENT.md
        ├── 02-USER-GUIDE.md
        ├── 03-CUSTOMER-ACQUISITION.md
        └── 04-SALES-CLOSING-GUIDE.md
```

---

## Development Commands

### Local Development

```bash
# Start Control Plane (Terminal 1)
cd aaa-platform/control-plane
npm install
npm run dev

# Start GenAI Core (Terminal 2)
cd aaa-platform/genai-core
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Docker Deployment

```bash
# Production deployment
cp .env.example .env
# Edit .env with production API keys
docker-compose up --build -d

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key (starts with `pk_`) | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key (starts with `sk_`) | ✅ |
| `STRIPE_SECRET_KEY` | Stripe API key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key | ✅ |
| `OPENROUTER_MODEL` | LLM model (default: `anthropic/claude-3.5-sonnet`) | ❌ |
| `USE_MOCK_LLM` | Skip LLM calls for testing | ❌ |

---

## API Endpoints

### GenAI Core (Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/generate-blueprint` | POST | Generate automation blueprint |

**Blueprint Request Schema**:
```json
{
  "industry": "string",
  "revenue_goal": "string",
  "tech_stack": ["string"],
  "pain_points": "string"
}
```

---

## Sales Framework: "Hurt and Heal"

**Principle**: No pain, no sale. Act as a doctor, not a salesperson.

### The 11-Step Strategy Session

1. **Open/Connect** - Small talk, ease the prospect
2. **Take the Lead** - Set the agenda
3. **Explore Motive** - "What made you book this call now?"
4. **Understand Context** - Current pricing, process, ideal client
5. **Examine Pain** - Probing: "How long have you been dealing with this?"
6. **Understand Dreams** - Where do they want to be in 12 months?
7. **Dig Below Surface** - "Why is earning $200k/year important to you?"
8. **Identify the Gap** - Clarify terrain between Now and Future
9. **Professional Advice** - "Would you like to know how we can help?"
10. **State the Offer** - Explain the Branded Method
11. **The Close** - State price (anchored in pain), take payment

**The Gap Methodology**: After stating price, **use silence**. Let them weigh $2,500 vs. the $10,000/month they're losing.

---

## 6-Month Execution Roadmap

### Month 1-2: Foundation
- [ ] PaaS setup and multi-tenant logic
- [ ] GenAI prompt architecture (Python)
- [ ] Control Plane for Stripe onboarding

### Month 3-4: Market Entry
- [ ] Launch Tier 1 "Crippleware"
- [ ] "Cost of Pain" content marketing
- [ ] High-Ticket Sales training

### Month 5-6: Scale to $50k/mo
- [ ] Funnel optimization (founder-led → systems)
- [ ] Aggressive Tier 3 acquisition (10+ monthly)
- [ ] Tier 2 retention optimization (250 subscribers)

---

## Key Documents

- `docs/01-PRODUCTION-DEPLOYMENT.md` - Deployment options (Railway, Docker, Vercel)
- `docs/02-USER-GUIDE.md` - End-user documentation
- `docs/03-CUSTOMER-ACQUISITION.md` - Marketing playbook
- `docs/04-SALES-CLOSING-GUIDE.md` - Sales call framework

---

## Claude Code Assistance Guidelines

When working on this project:

1. **Use TypeScript** for all Control Plane code
2. **Use Python 3.10+** for GenAI Core
3. **Follow existing patterns** - Check existing code before adding new files
4. **Test locally** before committing
5. **Environment variables** - Never hardcode secrets
6. **Prompt Engineering** - All prompts go in `genai-core/app/prompts/`

### Priority Order
1. Revenue-generating features (Stripe integration, blueprints)
2. User experience (dashboard, onboarding)
3. Developer experience (testing, docs)
4. Nice-to-haves (analytics, optimizations)
