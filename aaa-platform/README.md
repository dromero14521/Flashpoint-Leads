# Apex Automation Architect (AAA) Platform

The **Apex Automation Architect (AAA)** platform is a multi-tenant, AI-driven automation architecture designer. It replaces static templates with generative, bespoke workflow blueprints.

## Architecture

The platform follows a scalable, multi-tenant cloud architecture:

### 1. Control Plane (`/control-plane`)

- **Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Clerk
- **Role**: Manages user onboarding, authentication, billing (Stripe), and the user dashboard
- **Port**: 3000

### 2. GenAI Core (`/genai-core`)

- **Tech Stack**: Python, FastAPI, OpenRouter
- **Role**: The "Diagnostic Engine". Accepts user variables (pain points, industry, stack) and generates automation blueprints via LLM
- **Port**: 8000

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- [Clerk Account](https://clerk.com) (for authentication)
- [OpenRouter API Key](https://openrouter.ai) (for LLM)

### Local Development

1. **Clone and Configure**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start Control Plane**

   ```bash
   cd control-plane
   npm install
   npm run dev
   ```

3. **Start GenAI Core**

   ```bash
   cd genai-core
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   python main.py
   ```

### Docker Deployment

```bash
# From root directory
cp .env.example .env
# Edit .env with your production API keys
docker-compose up --build
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | Model to use (default: `anthropic/claude-3.5-sonnet`) |
| `USE_MOCK_LLM` | Set to `true` to skip LLM calls |

## Project Structure

```text
aaa-platform/
├── control-plane/       # Next.js Application
│   ├── app/
│   │   ├── dashboard/   # Protected dashboard routes
│   │   ├── sign-in/     # Clerk sign-in page
│   │   └── sign-up/     # Clerk sign-up page
│   ├── lib/
│   │   └── stripe.ts    # Stripe SDK helper
│   └── middleware.ts    # Auth middleware
└── genai-core/          # Python AI Service
    └── app/
        ├── prompts/     # Prompt engineering
        └── services/    # Business logic & OpenRouter client
```

## Workflow

1. User signs up via Clerk
2. User fills out the "Diagnostic" form (Industry, Goals, Pain Points)
3. Control Plane sends data to GenAI Core (`POST /generate-blueprint`)
4. GenAI Core calls OpenRouter API and returns a structured blueprint
5. Control Plane renders the blueprint as an interactive roadmap

## License

Proprietary - Apex Automation Architect

