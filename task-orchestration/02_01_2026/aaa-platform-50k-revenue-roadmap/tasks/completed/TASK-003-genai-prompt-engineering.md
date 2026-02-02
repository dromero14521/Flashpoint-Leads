# TASK-003: Complete GenAI Prompt Engineering

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 12-16 hours
**Dependencies**: TASK-001
**Assigned To**: Unassigned

---

## Objective

Refine and expand the GenAI prompt architecture to generate high-quality, bespoke automation blueprints that differentiate AAA from static template sellers.

---

## Description

The core value proposition of AAA is instant, AI-generated automation architecture. This requires sophisticated prompt engineering that can:
- Accept diverse business contexts (industry, revenue goals, tech stack)
- Generate actionable, specific blueprints (not generic advice)
- Adapt output format based on user's technical sophistication

**Current State**: Basic blueprint generation exists in `genai-core/app/prompts/architect.py`
**Target State**: Industry-specific, contextual prompts with versioning

---

## Acceptance Criteria

- [ ] Refine base prompt in `architect.py` for clarity and specificity
- [ ] Create industry-specific prompt variations:
  - E-commerce/Retail
  - Professional Services (Consulting, Legal, Medical)
  - SaaS/Software
  - Content Creation/Marketing
  - Real Estate
- [ ] Implement prompt versioning system (track which prompt generated which blueprint)
- [ ] Add output format options:
  - Technical (for developers)
  - Executive (for business owners)
  - Visual (Mermaid diagrams, flowcharts)
- [ ] Add validation layer to ensure blueprint quality:
  - Must include specific tool recommendations
  - Must include step-by-step implementation guide
  - Must reference user's stated pain points
- [ ] Create prompt testing suite with sample inputs
- [ ] Documentation: `docs/PROMPT-ENGINEERING-GUIDE.md`

---

## Technical Implementation

### Prompt Structure Template

```python
# app/prompts/architect.py

SYSTEM_PROMPT = """
You are the Apex Automation Architect, an expert in designing bespoke workflow automation systems.

Your role:
1. Analyze the user's business context (industry, revenue goals, pain points)
2. Generate a production-ready automation blueprint
3. Provide specific tool recommendations and integration steps

Output Requirements:
- Be specific, not generic
- Reference user's exact pain points
- Recommend 3-5 specific tools/platforms
- Include implementation timeline
- Provide ROI estimation
"""

INDUSTRY_PROMPTS = {
    "ecommerce": """
    Focus areas for e-commerce automation:
    - Abandoned cart recovery
    - Inventory management
    - Order fulfillment workflows
    - Customer segmentation
    - Email marketing automation
    """,
    "professional_services": """
    Focus areas for professional services:
    - Client onboarding
    - Appointment scheduling
    - Document generation
    - Time tracking and billing
    - CRM automation
    """,
    # ... more industries
}

def generate_blueprint_prompt(user_data: dict) -> str:
    industry = user_data.get("industry", "general")
    industry_context = INDUSTRY_PROMPTS.get(industry, "")

    return f"""
    {SYSTEM_PROMPT}

    {industry_context}

    User Context:
    - Industry: {user_data['industry']}
    - Revenue Goal: {user_data['revenue_goal']}
    - Current Tech Stack: {', '.join(user_data['tech_stack'])}
    - Pain Points: {user_data['pain_points']}

    Generate a comprehensive automation blueprint.
    """
```

### Prompt Versioning

```python
# app/models/blueprint.py

class Blueprint(BaseModel):
    id: str
    tenant_id: str
    content: str
    prompt_version: str  # e.g., "v1.2-ecommerce"
    generated_at: datetime
    user_input: dict
```

---

## Testing Steps

1. Create test cases for each industry vertical
2. Generate blueprints with identical inputs across prompt versions
3. Qualitatively assess output quality:
   - Specificity (does it mention exact tools?)
   - Actionability (can user implement this?)
   - Personalization (does it reference their pain points?)
4. A/B test different prompt structures with real users
5. Measure user satisfaction scores per prompt version

---

## Quality Metrics

- Blueprint must include at least 3 specific tool/platform names
- Blueprint must reference user's pain points at least twice
- Blueprint must include numbered implementation steps
- Blueprint length: 800-1500 words (not too short, not overwhelming)
- Reading level: 10th-12th grade (accessible but professional)

---

## Blockers

- Requires OpenRouter API access (TASK-001)
- May need to upgrade to higher-tier LLM models (cost consideration)

---

## Notes

- Consider using Claude Opus for Tier 2/3 users (higher quality)
- Use Claude Sonnet for Tier 1 (cost optimization)
- Store prompt versions in git for auditing
- Plan for future: AI-generated Mermaid diagrams embedded in blueprints
- Competitor research: What do Zapier, Make.com, n8n provide? We must exceed this.

---

## Related Tasks

- TASK-001: Environment Configuration (dependency)
- TASK-007: Enhance Blueprint Service (will use these prompts)
- TASK-009: Feature Gating (Tier 1 gets basic prompts, Tier 2/3 get advanced)
