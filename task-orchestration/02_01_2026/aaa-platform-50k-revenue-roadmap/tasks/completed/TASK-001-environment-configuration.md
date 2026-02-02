# TASK-001: Complete Environment Configuration

**Status**: TODO
**Priority**: CRITICAL
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 2-4 hours
**Dependencies**: None
**Assigned To**: Unassigned

---

## Objective

Configure all required environment variables and API keys for both control-plane (Next.js) and genai-core (Python/FastAPI) services to enable local development and testing.

---

## Description

The AAA platform requires multiple third-party services to function. This task ensures all API keys are properly configured, validated, and documented for team onboarding.

**Services Required**:
- Clerk (Authentication)
- Stripe (Billing)
- OpenRouter (LLM/GenAI)

---

## Acceptance Criteria

- [ ] `.env` file created in both `control-plane/` and `genai-core/` directories
- [ ] All Clerk keys added and validated:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
- [ ] All Stripe keys added and validated:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- [ ] OpenRouter keys added and validated:
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL` (default: `anthropic/claude-3.5-sonnet`)
- [ ] Environment variable loading verified in both services
- [ ] `.env.example` files updated with all required variables
- [ ] Documentation created: `docs/API-KEY-SETUP.md`

---

## Technical Notes

**Clerk Setup**:
- Sign up at https://clerk.com
- Create new application
- Copy publishable key (starts with `pk_`)
- Copy secret key (starts with `sk_`)

**Stripe Setup**:
- Sign up at https://stripe.com
- Get API keys from Dashboard → Developers → API keys
- Set up webhook endpoint for `/api/webhooks/stripe`
- Copy webhook signing secret

**OpenRouter Setup**:
- Sign up at https://openrouter.ai
- Generate API key
- Select model (recommend `anthropic/claude-3.5-sonnet`)

---

## Testing Steps

1. Start control-plane: `cd control-plane && npm run dev`
2. Verify Clerk auth redirects work
3. Start genai-core: `cd genai-core && python main.py`
4. Test blueprint generation endpoint
5. Verify no "missing environment variable" errors in logs

---

## Blockers

None

---

## Notes

- Store `.env` files in 1Password or equivalent secrets manager
- Never commit `.env` to git
- Update `.gitignore` to exclude `.env` files
- Consider using dotenv-vault for production deployments

---

## Related Tasks

- TASK-004: Verify Clerk Authentication Flow
- TASK-005: Configure Stripe Products & Pricing
- TASK-007: Enhance Blueprint Service
