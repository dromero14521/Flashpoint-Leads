# GenAI Prompt Engineering Guide

## Overview

The AAA Platform uses sophisticated prompt engineering to generate bespoke automation blueprints that differentiate us from static template sellers. This guide covers the prompt architecture, industry-specific optimizations, and best practices.

**Current Version**: 2.0
**Last Updated**: 2026-02-02

---

## Architecture

### Components

The prompt engineering system consists of three main components:

1. **PromptArchitect** (`app/prompts/architect_v2.py`)
   - System prompt generation
   - Industry-specific context injection
   - User prompt building
   - Quality validation

2. **BlueprintServiceV2** (`app/services/blueprint_service_v2.py`)
   - Orchestrates blueprint generation
   - Handles prompt versioning
   - Manages tier-based model selection
   - Validates output quality

3. **Test Suite** (`tests/test_prompts.py`)
   - Industry classification tests
   - Prompt quality validation
   - Blueprint generation tests
   - Regression testing

---

## Supported Industries

### Industry Verticals

The system includes specialized prompts for:

1. **E-commerce / Retail**
   - Focus: Cart abandonment, inventory, fulfillment
   - Tools: Shopify, Klaviyo, ShipStation

2. **Professional Services** (Consulting, Legal, Medical)
   - Focus: Client onboarding, scheduling, billing
   - Tools: HubSpot, Calendly, DocuSign

3. **SaaS / Software**
   - Focus: User onboarding, churn reduction, support
   - Tools: Intercom, Mixpanel, Customer.io

4. **Content Creation / Marketing Agencies**
   - Focus: Approval workflows, asset management, reporting
   - Tools: Asana, Buffer, Canva

5. **Real Estate**
   - Focus: Lead follow-up, transaction coordination
   - Tools: Follow Up Boss, Dotloop, Zillow

6. **General Business** (fallback)
   - Universal automation patterns
   - Versatile tool recommendations

### Industry Classification

The system automatically classifies user input into industry verticals using keyword matching:

```python
industry_string = "E-commerce store selling widgets"
vertical = PromptArchitect._classify_industry(industry_string)
# Returns: IndustryVertical.ECOMMERCE
```

Classification keywords:
- **E-commerce**: "ecommerce", "e-commerce", "retail", "shop", "shopify"
- **Professional Services**: "consulting", "legal", "medical", "accounting", "coach"
- **SaaS**: "saas", "software", "app", "platform", "tech", "startup"
- **Content**: "content", "marketing", "agency", "media", "creative"
- **Real Estate**: "real estate", "realtor", "property", "broker"

---

## Output Formats

### Three Format Options

1. **Technical** (default)
   - Target audience: Developers, technical users
   - Includes: API details, code snippets, technical architecture
   - Language: Technical terminology, implementation details

2. **Executive**
   - Target audience: Business owners, executives
   - Includes: ROI focus, high-level overview, business outcomes
   - Language: Clear, jargon-free, outcome-focused

3. **Visual**
   - Target audience: Visual learners, project managers
   - Includes: Mermaid diagrams, flowcharts, visual architecture
   - Language: Technical + visual representations

### Selecting Format

```python
from app.services.blueprint_service_v2 import BlueprintServiceV2

service = BlueprintServiceV2()
result = await service.generate_blueprint(
    industry="E-commerce",
    revenue_goal="$500k/year",
    tech_stack=["Shopify"],
    pain_points="Cart abandonment",
    output_format="executive"  # or "technical", "visual"
)
```

---

## Prompt Structure

### System Prompt

The system prompt defines the AI's role and output requirements:

```
You are the Apex Automation Architect (AAA), an elite systems engineer...

Your expertise:
- Analyzing business operations to identify automation opportunities
- Designing scalable, production-ready automation architectures
- ...

Output Style: TECHNICAL
- Use technical terminology and architecture diagrams
- Include API endpoints, data models, and integration details
- ...
```

### Industry Context

Industry-specific context is injected to guide the AI:

```
INDUSTRY FOCUS: E-COMMERCE / RETAIL

Common pain points in this sector:
- Abandoned cart recovery (70% average cart abandonment)
- Manual inventory management and stock alerts
- ...

Key automation opportunities:
- Abandoned cart email sequences (Klaviyo, Mailchimp)
- ...

Recommended tool stack:
- E-commerce platform: Shopify, WooCommerce, BigCommerce
- ...
```

### User Prompt

User-specific context and requirements:

```
CLIENT CONTEXT
================================================================================

Industry: E-commerce
Revenue Goal: $500k/year
Current Tech Stack: Shopify, Klaviyo, Google Analytics
Core Pain Points: Abandoned carts, manual inventory tracking

REQUIRED OUTPUT - JSON STRUCTURE
================================================================================

{
  "strategic_diagnosis": "...",
  "proposed_architecture": "...",
  "components": [...],
  "automation_steps": [...],
  "estimated_impact": {...}
}
```

---

## Quality Validation

### Validation Criteria

Every blueprint is validated against these requirements:

1. **Required Fields**
   - strategic_diagnosis
   - proposed_architecture
   - components (array)
   - automation_steps (array)
   - estimated_impact (object)

2. **Component Count**
   - Minimum 3 components
   - Each component must have: name, tool, purpose

3. **Automation Steps**
   - Minimum 5 steps
   - Steps must be actionable and specific

4. **Diagnosis Length**
   - Minimum 200 characters
   - Must reference user's pain points

5. **Tool Specificity**
   - Must mention at least 3 specific tools by name
   - Avoid generic recommendations

### Quality Score

Blueprints receive a quality score (0-100):

- **100 points**: Perfect blueprint with all criteria met
- **80-99**: High quality with minor issues
- **60-79**: Acceptable quality, some improvements needed
- **<60**: Low quality, regeneration recommended

Scoring breakdown:
- Required fields present: 20 points each (100 max)
- 4+ components: +10 points
- 6+ automation steps: +10 points
- Detailed impact metrics: +10 points
- Diagnosis 300+ chars: +10 points

---

## Tier-Based Model Selection

Different subscription tiers use different LLM models for cost optimization vs. quality:

| Tier | Model | Rationale |
|------|-------|-----------|
| **Tier 1 (Free)** | Claude 3.5 Sonnet | Cost-optimized, good quality |
| **Tier 2 (Pro)** | Claude 3 Opus | Higher quality, worth the cost |
| **Tier 3 (Apex)** | Claude 3 Opus | Highest quality for premium tier |

Model selection happens automatically based on `user_tier` parameter:

```python
result = await service.generate_blueprint(
    industry="SaaS",
    revenue_goal="$1M ARR",
    tech_stack=["Stripe"],
    pain_points="High churn",
    user_tier="tier2"  # Uses Claude Opus
)
```

---

## Prompt Versioning

### Version Tracking

Every blueprint includes metadata with the prompt version used:

```json
{
  "blueprint": {...},
  "metadata": {
    "prompt_version": "2.0",
    "output_format": "technical",
    "industry_vertical": "saas",
    "model_used": "anthropic/claude-3-opus",
    "generated_at": "2026-02-02T10:30:00Z",
    "user_tier": "tier2"
  }
}
```

### Version History

- **v1.0** (Jan 2026): Basic prompt with JSON structure
- **v2.0** (Feb 2026): Industry-specific contexts, output formats, validation

### Why Version?

1. **A/B Testing**: Compare blueprint quality across versions
2. **Regression Testing**: Ensure changes don't degrade quality
3. **Auditing**: Track which prompts generated which blueprints
4. **Rollback**: Revert to previous version if issues arise

---

## Usage Examples

### Basic Usage

```python
from app.services.blueprint_service_v2 import BlueprintServiceV2

# Initialize service
service = BlueprintServiceV2()

# Generate blueprint
result = await service.generate_blueprint(
    industry="E-commerce",
    revenue_goal="$500k/year",
    tech_stack=["Shopify", "Klaviyo"],
    pain_points="Abandoned carts, manual inventory"
)

# Access blueprint
blueprint = result["blueprint"]
print(blueprint["strategic_diagnosis"])
print(blueprint["automation_steps"])

# Check quality
validation = result["validation"]
if validation["is_valid"]:
    print(f"Quality Score: {validation['quality_score']}/100")
else:
    print(f"Validation Errors: {validation['errors']}")
```

### With Output Format

```python
# Generate executive summary
result = await service.generate_blueprint(
    industry="SaaS",
    revenue_goal="$1M ARR",
    tech_stack=["Stripe", "Intercom"],
    pain_points="High churn, low engagement",
    output_format="executive"  # Business-focused output
)
```

### Custom Industry Vertical

```python
from app.prompts.architect_v2 import IndustryVertical

# Force specific vertical (skip auto-classification)
result = await service.generate_blueprint(
    industry="Custom healthcare software",
    revenue_goal="$2M/year",
    tech_stack=["Epic EMR"],
    pain_points="HIPAA compliance burden",
    industry_vertical=IndustryVertical.SAAS  # Treat as SaaS
)
```

---

## Testing

### Running Tests

```bash
cd aaa-platform/genai-core
pytest tests/test_prompts.py -v
```

### Test Coverage

- ✅ System prompt generation for all formats
- ✅ Industry classification accuracy (10 test cases)
- ✅ Industry context completeness
- ✅ User prompt generation
- ✅ Blueprint validation (valid, invalid, edge cases)
- ✅ Model selection by tier
- ✅ Quality score calculation
- ✅ End-to-end blueprint generation (5 industries)

### Adding New Test Cases

```python
# In tests/test_prompts.py

new_test_case = {
    "name": "Healthcare Provider",
    "industry": "Medical practice",
    "revenue_goal": "$800k/year",
    "tech_stack": ["Athenahealth", "Zocdoc"],
    "pain_points": "Appointment no-shows, insurance verification delays"
}

# Add to sample_test_cases fixture
```

---

## Adding New Industries

### Step 1: Define Industry Context

Edit `app/prompts/architect_v2.py`:

```python
IndustryVertical.HEALTHCARE = "healthcare"  # Add enum

contexts = {
    IndustryVertical.HEALTHCARE: """
INDUSTRY FOCUS: HEALTHCARE

Common pain points:
- Patient no-shows (15-30% average)
- Insurance verification bottlenecks
- ...

Key automation opportunities:
- Appointment reminders (SMS via Twilio)
- ...

Recommended tool stack:
- EMR: Epic, Cerner, Athenahealth
- ...
"""
}
```

### Step 2: Update Classification

Add keywords for auto-classification:

```python
def _classify_industry(industry_string: str) -> IndustryVertical:
    if any(keyword in industry_lower for keyword in [
        "healthcare", "medical", "hospital", "clinic", "patient"
    ]):
        return IndustryVertical.HEALTHCARE
```

### Step 3: Add Test Case

```python
def test_healthcare_classification(self):
    assert PromptArchitect._classify_industry("Healthcare provider") == IndustryVertical.HEALTHCARE
```

### Step 4: Test & Deploy

```bash
pytest tests/test_prompts.py -v -k healthcare
```

---

## Best Practices

### 1. Specificity Over Generality

❌ **Bad**: "Use automation tools to improve workflow"
✅ **Good**: "Implement n8n.io to connect Shopify with Klaviyo for abandoned cart emails"

### 2. Reference User Pain Points

Every blueprint must reference the user's specific pain points at least 3 times:

```python
pain_points = "Manual inventory tracking"

# Good diagnosis mentions it directly:
"The pain points you've described ('Manual inventory tracking') are symptoms..."
```

### 3. Quantify Everything

Include numbers for credibility:

- Time saved: "15-20 hours per week"
- Cost reduction: "$78,000-$104,000 annually"
- ROI timeline: "8-12 weeks to break even"

### 4. Recommend Real Tools

Mention 3-5 specific tools by name:

❌ **Bad**: "Use an email marketing platform"
✅ **Good**: "Use Klaviyo, Mailchimp, or ActiveCampaign"

### 5. Include Quick Wins

Always provide 2-3 quick wins that deliver immediate value:

```json
"quick_wins": [
  "Quick Win 1: Automate welcome email (2 days, 3 hours/week saved)",
  "Quick Win 2: SMS notifications (1 day, 30% fewer support tickets)"
]
```

---

## Troubleshooting

### Issue: Industry Misclassification

**Symptom**: Wrong industry context used
**Solution**: Add more keywords to `_classify_industry()` or force vertical:

```python
result = await service.generate_blueprint(
    industry="Custom business",
    ...,
    industry_vertical=IndustryVertical.PROFESSIONAL_SERVICES
)
```

### Issue: Low Quality Score (<60)

**Symptom**: Blueprint missing required elements
**Solution**: Check validation errors:

```python
if not result["validation"]["is_valid"]:
    print(result["validation"]["errors"])
    # Re-generate or manually adjust prompt
```

### Issue: Generic Recommendations

**Symptom**: Blueprint doesn't mention specific tools
**Solution**: Strengthen industry context with more tool examples

### Issue: Doesn't Reference Pain Points

**Symptom**: Validation passes but feels impersonal
**Solution**: Update prompt to explicitly require pain point references:

```
CRITICAL: Reference the user's pain points ('{pain_points}') at least 3 times in your diagnosis.
```

---

## Performance Metrics

### Target Benchmarks

- **Generation Time**: <15 seconds (Sonnet), <25 seconds (Opus)
- **Quality Score**: Average >85/100
- **Validation Pass Rate**: >95%
- **User Satisfaction**: >4.5/5 stars

### Monitoring

Track these metrics in production:

```python
# In blueprint_service_v2.py
import time

start_time = time.time()
blueprint = await self.client.generate_json(...)
generation_time = time.time() - start_time

# Log to analytics
analytics.track("blueprint_generated", {
    "quality_score": result["validation"]["quality_score"],
    "generation_time_seconds": generation_time,
    "industry_vertical": result["metadata"]["industry_vertical"],
    "user_tier": user_tier
})
```

---

## Future Enhancements

### Planned Features

1. **Visual Diagrams**
   - Mermaid diagram generation
   - Architecture flowcharts
   - Gantt chart timelines

2. **Multi-Language Support**
   - Spanish, French, German blueprints
   - Locale-specific tool recommendations

3. **Custom Prompts**
   - Allow Tier 3 users to customize prompts
   - White-label prompt engineering

4. **AI-Powered Iteration**
   - User can request "make it more technical"
   - Refine blueprints based on feedback

5. **Competitive Analysis**
   - Compare blueprint to competitors' templates
   - Highlight differentiation

---

## Related Documentation

- [Feature Gating Guide](./FEATURE-GATING.md) - Tier-based access control
- [Authentication Guide](./AUTHENTICATION-GUIDE.md) - User management
- [API Reference](./API-REFERENCE.md) - API endpoints

---

## Support

For questions or issues:
- Review test suite: `tests/test_prompts.py`
- Check examples: `app/services/blueprint_service_v2.py`
- Test locally with mock mode: `USE_MOCK_LLM=true`
