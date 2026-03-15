# Apex Automation Architect (AAA) Platform

> **Mission**: Transform static template selling into AI-driven automation architecture, achieving $50k/month by Month 6.

The **Apex Automation Architect (AAA)** is a multi-tenant SaaS platform that uses Generative AI as a "Consultant-in-a-Box" to displace static template sellers and manual consultants. Instead of delivering a tool, AAA delivers a **transformation** — bespoke, AI-generated automation blueprints in seconds.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Revenue Model](#revenue-model)
- [Documentation](#documentation)

---

## Overview

| Model | Pain Point | AAA Advantage |
|-------|------------|---------------|
| Static Template Sellers | Zero customization | AI generates unique blueprints |
| One-Off Consultants | Non-scalable, time-for-money | Infinite scale via GenAI |
| DIY Tools | High friction, user does the work | Platform does the thinking |

---

## Architecture

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
│                          ▲                                       │
│                          │                                       │
│              ┌───────────┴──────────┐                           │
│              │   PostgreSQL 15      │                           │
│              │   (Multi-tenant DB)  │                           │
│              └──────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend / Control Plane** | Next.js 15, TypeScript, Tailwind CSS | User experience, dashboard |
| **Authentication** | Clerk | Multi-tenant user management |
| **Billing** | Stripe | Subscriptions & one-time payments |
| **AI Engine** | Python 3.10+, FastAPI, OpenRouter | Blueprint generation |
| **Database** | PostgreSQL 15 | Multi-tenant data storage |
| **Reverse Proxy** | Nginx | SSL/TLS termination |
| **Deployment** | Docker Compose, Railway | Production hosting |

---

## Project Structure

```
Apex-Automation-Agency/
├── aaa-platform/
│   ├── control-plane/       # Next.js 15 application (Port 3000)
│   │   ├── app/
│   │   │   ├── dashboard/   # Protected dashboard routes
│   │   │   ├── sign-in/     # Clerk sign-in page
│   │   │   └── sign-up/     # Clerk sign-up page
│   │   ├── lib/
│   │   │   └── stripe.ts    # Stripe SDK helper
│   │   ├── prisma/          # Database schema & migrations
│   │   └── middleware.ts    # Auth middleware
│   ├── genai-core/          # Python/FastAPI AI service (Port 8000)
│   │   ├── app/
│   │   │   ├── prompts/     # Prompt engineering templates
│   │   │   └── services/    # Business logic & OpenRouter client
│   │   ├── main.py          # FastAPI entry point
│   │   └── requirements.txt
│   └── docs/                # Extended platform documentation
├── docker-compose.yml       # Multi-container production deployment
├── nginx.conf               # Reverse proxy configuration
├── railway.toml             # Railway PaaS deployment config
├── quick-start.sh           # Convenience script for local dev
├── .env.example             # Environment variable template
└── README.md                # This file
```

---

## Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Docker & Docker Compose** (for containerised deployment)
- [Clerk account](https://clerk.com) — authentication
- [Stripe account](https://stripe.com) — billing
- [OpenRouter API key](https://openrouter.ai) — LLM access

---

## Quick Start

### 1. Configure environment variables

```bash
cp .env.example .env
# Open .env and fill in your API keys
```

### 2. Local development (using the helper script)

```bash
chmod +x quick-start.sh
./quick-start.sh dev
```

This starts both services concurrently (containerized deployment also available — see [Deployment](#deployment)):
- **Control Plane** → http://localhost:3000
- **GenAI Core** → http://localhost:8000

### 3. Manual local development

**Terminal 1 — Control Plane:**

```bash
cd aaa-platform/control-plane
npm install
npm run dev
```

**Terminal 2 — GenAI Core:**

```bash
cd aaa-platform/genai-core
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 4. Run tests

```bash
./quick-start.sh test
```

---

## Environment Variables

Copy `.env.example` to `.env` and populate each value:

| Variable | Description | Required |
|----------|-------------|:--------:|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key (`pk_…`) | ✅ |
| `CLERK_SECRET_KEY` | Clerk secret key (`sk_…`) | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret API key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ✅ |
| `STRIPE_PRICE_TIER2_MONTHLY_99` | Stripe Price ID — Tier 2 $99/mo | ✅ |
| `STRIPE_PRICE_TIER2_MONTHLY_199` | Stripe Price ID — Tier 2 $199/mo | ✅ |
| `STRIPE_PRICE_TIER3_ONETIME_2500` | Stripe Price ID — Tier 3 $2,500 | ✅ |
| `STRIPE_PRICE_TIER3_ONETIME_5000` | Stripe Price ID — Tier 3 $5,000 | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `OPENROUTER_API_KEY` | OpenRouter API key | ✅ |
| `OPENROUTER_MODEL` | LLM model (default: `anthropic/claude-3.5-sonnet`) | ❌ |
| `USE_MOCK_LLM` | Set `true` to skip LLM calls during development | ❌ |
| `NEXT_PUBLIC_URL` | Public URL of the Control Plane | ❌ |

---

## API Reference

### GenAI Core (Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/health` | GET | Detailed health status |
| `/generate-blueprint` | POST | Generate an automation blueprint |

**`POST /generate-blueprint` — Request body:**

```json
{
  "industry": "string",
  "revenue_goal": "string",
  "tech_stack": ["string"],
  "pain_points": "string"
}
```

### Control Plane (Port 3000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/dashboard` | GET | Protected user dashboard |
| `/sign-in` | GET | Clerk-powered sign-in |
| `/sign-up` | GET | Clerk-powered sign-up |

---

## Deployment

### Docker Compose (recommended for VPS / self-hosted)

```bash
cp .env.example .env
# Edit .env with production values
docker-compose up --build -d

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

Services started: `postgres`, `genai-core`, `control-plane`, `nginx`.

### Railway (PaaS)

The repository includes a [`railway.toml`](railway.toml) configuration that deploys all three services (Control Plane, GenAI Core, PostgreSQL) automatically. Connect the repository in the [Railway dashboard](https://railway.app) and set the required environment variables.

```bash
./quick-start.sh deploy   # local Docker deploy
./quick-start.sh status   # check running services
```

---

## Revenue Model

**Target: $50,000/month by Month 6**

| Tier | Price | Description |
|------|-------|-------------|
| **Tier 1** (Freemium) | $0 | "Crippleware" — basic templates & limited AI access to capture market share |
| **Tier 2** (Core Subscription) | $99–$199/mo | Full AI Architect access & multi-tool integration |
| **Tier 3** (Apex Implementation) | $2,500–$5,000 | White-glove, done-for-you implementation service |

**Revenue mix target:**
- 10 Tier 3 clients/month × $2,500 = **$25,000**
- 250 Tier 2 subscribers × $100/month = **$25,000**

---

## Documentation

Extended documentation lives in [`aaa-platform/docs/`](aaa-platform/docs/):

| Document | Description |
|----------|-------------|
| [`01-PRODUCTION-DEPLOYMENT.md`](aaa-platform/docs/01-PRODUCTION-DEPLOYMENT.md) | Railway, Docker & Vercel deployment options |
| [`02-USER-GUIDE.md`](aaa-platform/docs/02-USER-GUIDE.md) | End-user guide |
| [`03-CUSTOMER-ACQUISITION.md`](aaa-platform/docs/03-CUSTOMER-ACQUISITION.md) | Marketing playbook |
| [`04-SALES-CLOSING-GUIDE.md`](aaa-platform/docs/04-SALES-CLOSING-GUIDE.md) | High-ticket sales call framework |
| [`STRIPE-SETUP-GUIDE.md`](aaa-platform/docs/STRIPE-SETUP-GUIDE.md) | Stripe product & webhook setup |
| [`MULTI-TENANT-ARCHITECTURE.md`](aaa-platform/docs/MULTI-TENANT-ARCHITECTURE.md) | Multi-tenancy design |
| [`PROMPT-ENGINEERING-GUIDE.md`](aaa-platform/docs/PROMPT-ENGINEERING-GUIDE.md) | LLM prompt engineering patterns |

---

## License

Proprietary — © Apex Automation Architect. All rights reserved.
