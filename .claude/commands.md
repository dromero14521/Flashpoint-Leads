# Claude Commands for AAA Platform

Slash commands for quick actions in Claude Desktop.

## /dev-setup

Initialize the development environment for AAA Platform.

**Usage**: `/dev-setup`

**Steps**:
1. Verify Node.js and Python versions
2. Install Control Plane dependencies
3. Set up GenAI Core virtual environment
4. Verify environment variables
5. Start development servers

---

## /deploy

Deploy the AAA Platform to production.

**Usage**: `/deploy [environment]`

**Arguments**:
- `environment`: `staging` or `production` (default: `production`)

**Steps**:
1. Run pre-flight checks (git status, tests)
2. Build Docker images
3. Push to registry
4. Deploy to Railway/VPS
5. Verify deployment health

---

## /new-prompt

Create a new blueprint prompt template.

**Usage**: `/new-prompt [industry]`

**Arguments**:
- `industry`: Target industry (e.g., "real-estate", "e-commerce")

**Steps**:
1. Create prompt file in `genai-core/app/prompts/`
2. Add industry-specific context
3. Test with sample data
4. Document in prompt registry

---

## /test

Run the test suite.

**Usage**: `/test [scope]`

**Arguments**:
- `scope`: `unit`, `integration`, `e2e`, or `all` (default: `all`)

**Steps**:
1. Run Control Plane tests
2. Run GenAI Core tests
3. Run integration tests (if applicable)
4. Generate coverage report

---

## /stripe-setup

Configure Stripe integration.

**Usage**: `/stripe-setup`

**Steps**:
1. Guide through Stripe dashboard configuration
2. Create products and prices
3. Set up webhook endpoints
4. Configure environment variables
5. Test payment flow

---

## /debug

Enter troubleshooting mode for a specific issue.

**Usage**: `/debug [component]`

**Arguments**:
- `component`: `control-plane`, `genai-core`, `stripe`, `clerk`, or `full-stack`

**Steps**:
1. Check component logs
2. Verify dependencies
3. Test connectivity
4. Suggest fixes

---

## /status

Check the health of all AAA Platform services.

**Usage**: `/status`

**Steps**:
1. Check Control Plane (local/production)
2. Check GenAI Core (local/production)
3. Verify Clerk auth status
4. Verify Stripe webhook status
5. Display summary

---

## /content

Generate marketing content.

**Usage**: `/content [type] [topic]`

**Arguments**:
- `type`: `blog`, `case-study`, `email`, `social`
- `topic`: Subject matter for content

**Steps**:
1. Load content templates from SKILLS.md
2. Generate draft based on "Cost of Pain" framework
3. Format for target platform
4. Provide editing suggestions

---

## /lead

Manage sales pipeline actions.

**Usage**: `/lead [action] [email]`

**Arguments**:
- `action`: `add`, `follow-up`, `status`, `close`
- `email`: Lead's email address

**Steps**:
1. Update CRM record
2. Trigger appropriate automation
3. Log activity
4. Suggest next action

---

## /metrics

Display key business metrics.

**Usage**: `/metrics [period]`

**Arguments**:
- `period`: `today`, `week`, `month`, `quarter` (default: `month`)

**Metrics Displayed**:
- MRR (Monthly Recurring Revenue)
- New subscribers
- Churn rate
- High-ticket conversions
- Blueprint generations
- Conversion rates
