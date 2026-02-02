"""
Enhanced Prompt Architecture for AAA Platform v2.0
Implements industry-specific prompts, output formats, and quality validation
"""

from typing import List, Dict, Optional
from enum import Enum
from datetime import datetime

class OutputFormat(Enum):
    """Output format options for blueprints"""
    TECHNICAL = "technical"      # For developers/technical users
    EXECUTIVE = "executive"      # For business owners/executives
    VISUAL = "visual"           # Includes Mermaid diagrams

class IndustryVertical(Enum):
    """Supported industry verticals with specialized prompts"""
    ECOMMERCE = "ecommerce"
    PROFESSIONAL_SERVICES = "professional_services"
    SAAS = "saas"
    CONTENT_CREATION = "content_creation"
    REAL_ESTATE = "real_estate"
    GENERAL = "general"

# Version tracking for prompts
PROMPT_VERSION = "2.0"

class PromptArchitect:
    """
    Enhanced prompt engineering system for generating bespoke automation blueprints.
    Implements industry-specific variations, output formats, and quality validation.
    """

    @staticmethod
    def build_system_prompt(output_format: OutputFormat = OutputFormat.TECHNICAL) -> str:
        """
        Build the base system prompt with role definition and output requirements.

        Args:
            output_format: Desired output format (technical, executive, or visual)

        Returns:
            System prompt string
        """
        base_prompt = """You are the Apex Automation Architect (AAA), an elite systems engineer and business strategist specializing in workflow automation and AI integration.

Your expertise:
- Analyzing business operations to identify automation opportunities
- Designing scalable, production-ready automation architectures
- Recommending specific tools, platforms, and integration strategies
- Providing ROI estimates and implementation timelines
- Translating complex technical solutions into business value

Your approach:
- Be ruthlessly specific, not generic
- Reference the user's exact pain points multiple times
- Recommend 3-5 specific tools/platforms by name
- Provide step-by-step implementation guidance
- Focus on "quick wins" that deliver immediate value
- Consider budget constraints and technical sophistication"""

        format_instructions = {
            OutputFormat.TECHNICAL: """
Output Style: TECHNICAL
- Use technical terminology and architecture diagrams
- Include API endpoints, data models, and integration details
- Provide code snippets or pseudocode where helpful
- Reference specific SDKs, libraries, and frameworks
- Include error handling and edge case considerations
""",
            OutputFormat.EXECUTIVE: """
Output Style: EXECUTIVE SUMMARY
- Focus on business outcomes and ROI
- Use clear, jargon-free language
- Emphasize time savings, cost reduction, and revenue impact
- Include high-level architecture overview (not technical details)
- Provide clear next steps and resource requirements
""",
            OutputFormat.VISUAL: """
Output Style: VISUAL + TECHNICAL
- Include Mermaid diagram syntax for workflow visualization
- Use flowcharts to show automation sequences
- Provide visual architecture diagrams
- Combine visuals with technical implementation details
- Make complex flows easy to understand at a glance
"""
        }

        return base_prompt + format_instructions[output_format]

    @staticmethod
    def get_industry_context(industry: IndustryVertical) -> str:
        """
        Get industry-specific context and common automation patterns.

        Args:
            industry: Industry vertical enum

        Returns:
            Industry-specific prompt context
        """
        contexts = {
            IndustryVertical.ECOMMERCE: """
INDUSTRY FOCUS: E-COMMERCE / RETAIL

Common pain points in this sector:
- Abandoned cart recovery (70% average cart abandonment)
- Manual inventory management and stock alerts
- Order fulfillment bottlenecks
- Customer service overwhelm (returns, inquiries)
- Post-purchase email sequences

Key automation opportunities:
- Abandoned cart email sequences (Klaviyo, Mailchimp)
- Inventory sync across channels (Shopify + multichannel)
- Order status notifications (SMS via Twilio)
- Customer segmentation and targeted campaigns
- Review request automation

Recommended tool stack:
- E-commerce platform: Shopify, WooCommerce, BigCommerce
- Email automation: Klaviyo, Mailchimp, ActiveCampaign
- Customer support: Zendesk, Gorgias, Intercom
- Inventory: Skubana, Inventory Planner
- Fulfillment: ShipStation, Shippo
""",
            IndustryVertical.PROFESSIONAL_SERVICES: """
INDUSTRY FOCUS: PROFESSIONAL SERVICES (Consulting, Legal, Medical, Accounting)

Common pain points in this sector:
- Manual client onboarding (forms, contracts, scheduling)
- Time tracking and billing inefficiencies
- Document generation (proposals, invoices, reports)
- Appointment scheduling back-and-forth
- Follow-up and client communication gaps

Key automation opportunities:
- Client intake forms with automatic CRM population
- Contract generation with e-signature automation
- Appointment scheduling with calendar sync
- Time tracking integration with billing systems
- Automated proposal generation from templates

Recommended tool stack:
- CRM: HubSpot, Salesforce, Pipedrive
- Scheduling: Calendly, Acuity Scheduling
- E-signature: DocuSign, HelloSign, PandaDoc
- Time tracking: Harvest, Toggl, Clockify
- Billing: QuickBooks, FreshBooks, Xero
- Document automation: PandaDoc, Proposify
""",
            IndustryVertical.SAAS: """
INDUSTRY FOCUS: SAAS / SOFTWARE

Common pain points in this sector:
- User onboarding drop-off
- Churn due to low product adoption
- Manual customer success outreach
- Support ticket overload
- Lead qualification and routing

Key automation opportunities:
- Behavior-triggered onboarding emails
- In-app messaging based on usage patterns
- Automated health score monitoring
- Support ticket routing and auto-responses
- Lead scoring and sales team notifications

Recommended tool stack:
- Customer data: Segment, Rudderstack
- Email automation: Customer.io, Intercom
- In-app messaging: Intercom, Pendo, Appcues
- Support: Zendesk, Intercom, Help Scout
- Analytics: Mixpanel, Amplitude
- CRM: HubSpot, Salesforce
""",
            IndustryVertical.CONTENT_CREATION: """
INDUSTRY FOCUS: CONTENT CREATION / MARKETING AGENCIES

Common pain points in this sector:
- Content approval bottlenecks
- Asset organization chaos
- Client feedback loops
- Publishing across multiple platforms
- Performance tracking and reporting

Key automation opportunities:
- Content calendar automation with reminders
- Automated approval workflows
- Social media scheduling and cross-posting
- Asset tagging and DAM integration
- Performance report generation

Recommended tool stack:
- Project management: Asana, Monday.com, ClickUp
- Social scheduling: Buffer, Hootsuite, Later
- DAM: Air, Bynder, Brandfolder
- Approval workflows: Filestage, GoVisually
- Analytics: Google Analytics, Supermetrics
- Content creation: Canva API, Figma API
""",
            IndustryVertical.REAL_ESTATE: """
INDUSTRY FOCUS: REAL ESTATE

Common pain points in this sector:
- Lead follow-up delays (speed-to-lead critical)
- Manual property listing updates
- Open house scheduling and reminders
- Document signing delays
- Transaction coordinator overwhelm

Key automation opportunities:
- Instant lead assignment and SMS follow-up
- Automated property listing syndication
- Open house RSVP and reminder sequences
- Document checklist automation
- Transaction milestone notifications

Recommended tool stack:
- CRM: Follow Up Boss, LionDesk, kvCORE
- Lead routing: Zillow integration, Realtor.com
- E-signature: DocuSign, Dotloop
- SMS automation: Twilio, SimpleTexting
- Transaction management: Dotloop, SkySlope
- Calendar: Calendly, Acuity
""",
            IndustryVertical.GENERAL: """
INDUSTRY FOCUS: GENERAL BUSINESS

Since no specific industry was identified, focus on universal business automation patterns:
- Email follow-up sequences
- Data entry and manual reporting
- Internal team notifications
- File organization and tagging
- Approval workflows

Recommended versatile tools:
- Automation: Zapier, Make.com, n8n
- Workflow: Airtable, Monday.com, ClickUp
- Email: Gmail + filters, Superhuman
- Storage: Google Drive, Dropbox
- Notifications: Slack, Microsoft Teams
"""
        }

        return contexts.get(industry, contexts[IndustryVertical.GENERAL])

    @staticmethod
    def build_user_prompt(
        industry: str,
        revenue_goal: str,
        tech_stack: List[str],
        pain_points: str,
        output_format: OutputFormat = OutputFormat.TECHNICAL,
        industry_vertical: Optional[IndustryVertical] = None
    ) -> str:
        """
        Build the user-specific prompt with context and requirements.

        Args:
            industry: User's industry (free-form string)
            revenue_goal: User's revenue target
            tech_stack: List of tools/platforms currently used
            pain_points: User's described pain points
            output_format: Desired output format
            industry_vertical: Classified industry vertical (if known)

        Returns:
            Complete user prompt string
        """
        # Map free-form industry to vertical if not provided
        if industry_vertical is None:
            industry_vertical = PromptArchitect._classify_industry(industry)

        industry_context = PromptArchitect.get_industry_context(industry_vertical)
        stack_str = ", ".join(tech_stack) if tech_stack else "Not specified"

        prompt = f"""
{industry_context}

================================================================================
CLIENT CONTEXT
================================================================================

Industry: {industry}
Revenue Goal: {revenue_goal}
Current Tech Stack: {stack_str}
Core Pain Points: {pain_points}

================================================================================
REQUIRED OUTPUT - JSON STRUCTURE
================================================================================

Generate a comprehensive automation blueprint with the following JSON structure:

{{
  "strategic_diagnosis": "A ruthlessly honest 2-3 paragraph analysis of why their current setup is failing. Reference their specific pain points: '{pain_points}'. Explain the root cause (manual processes, disconnected tools, etc.) and the cost of inaction.",

  "proposed_architecture": "High-level description of the automation system. Give it a memorable name (e.g., 'Hub-and-Spoke Model', 'Waterfall Automation Pipeline'). Explain the architecture in 2-3 paragraphs.",

  "components": [
    {{
      "name": "Component Name",
      "tool": "Specific Tool/Platform Name",
      "purpose": "What this component does",
      "integration_notes": "How it connects to other components"
    }}
    // Include 4-6 components
  ],

  "automation_steps": [
    "Step 1: [Specific actionable step with tool names]",
    "Step 2: [...]",
    // Include 6-10 implementation steps
  ],

  "estimated_impact": {{
    "time_saved_per_week": "Quantify hours saved",
    "cost_reduction": "Annual cost savings estimate",
    "revenue_potential": "How automation enables revenue growth",
    "roi_timeline": "Timeframe to see positive ROI (weeks/months)"
  }},

  "quick_wins": [
    "Quick win 1: Implement in <1 week for immediate impact",
    "Quick win 2: [...]"
    // Include 2-3 quick wins
  ],

  "implementation_timeline": {{
    "phase_1": "Week 1-2: [What to build first]",
    "phase_2": "Week 3-4: [Next priority]",
    "phase_3": "Month 2+: [Advanced automations]"
  }}
}}

================================================================================
QUALITY REQUIREMENTS
================================================================================

1. **Specificity**: Mention at least 3-5 specific tools/platforms by name
2. **Personalization**: Reference the user's pain points at least 3 times
3. **Actionability**: Every step must be implementable by the user
4. **ROI Focus**: Quantify time/money saved wherever possible
5. **Realistic**: Recommend tools that integrate with their current stack ({stack_str})

================================================================================
TONE & STYLE
================================================================================

- Authoritative but not condescending
- Focus on business outcomes, not just features
- Use the "Cost of Pain" framework: emphasize what they're losing by NOT automating
- Be specific about numbers, timelines, and tools
- Professional language appropriate for a ${revenue_goal} business

Generate the blueprint now.
"""

        return prompt

    @staticmethod
    def _classify_industry(industry_string: str) -> IndustryVertical:
        """
        Classify free-form industry string into a supported vertical.

        Args:
            industry_string: User's industry description

        Returns:
            IndustryVertical enum
        """
        industry_lower = industry_string.lower()

        # E-commerce keywords
        if any(keyword in industry_lower for keyword in [
            "ecommerce", "e-commerce", "retail", "online store", "shopify", "shop"
        ]):
            return IndustryVertical.ECOMMERCE

        # Professional services keywords
        if any(keyword in industry_lower for keyword in [
            "consulting", "legal", "law", "medical", "doctor", "accounting",
            "cpa", "attorney", "coach", "professional services"
        ]):
            return IndustryVertical.PROFESSIONAL_SERVICES

        # SaaS keywords
        if any(keyword in industry_lower for keyword in [
            "saas", "software", "app", "platform", "tech", "startup"
        ]):
            return IndustryVertical.SAAS

        # Content creation keywords
        if any(keyword in industry_lower for keyword in [
            "content", "marketing", "agency", "media", "creative", "design"
        ]):
            return IndustryVertical.CONTENT_CREATION

        # Real estate keywords
        if any(keyword in industry_lower for keyword in [
            "real estate", "realtor", "property", "broker", "realty"
        ]):
            return IndustryVertical.REAL_ESTATE

        return IndustryVertical.GENERAL

    @staticmethod
    def validate_blueprint(blueprint: Dict) -> tuple[bool, List[str]]:
        """
        Validate blueprint quality against acceptance criteria.

        Args:
            blueprint: Generated blueprint dictionary

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        # Check required fields exist
        required_fields = [
            "strategic_diagnosis",
            "proposed_architecture",
            "components",
            "automation_steps",
            "estimated_impact"
        ]

        for field in required_fields:
            if field not in blueprint:
                errors.append(f"Missing required field: {field}")

        # Validate components
        if "components" in blueprint:
            if not isinstance(blueprint["components"], list):
                errors.append("'components' must be a list")
            elif len(blueprint["components"]) < 3:
                errors.append("Blueprint must include at least 3 components")
            else:
                # Check each component has required fields
                for i, component in enumerate(blueprint["components"]):
                    if "name" not in component:
                        errors.append(f"Component {i+1} missing 'name'")
                    if "tool" not in component:
                        errors.append(f"Component {i+1} missing 'tool'")

        # Validate automation steps
        if "automation_steps" in blueprint:
            if not isinstance(blueprint["automation_steps"], list):
                errors.append("'automation_steps' must be a list")
            elif len(blueprint["automation_steps"]) < 5:
                errors.append("Blueprint must include at least 5 automation steps")

        # Validate diagnosis length (should be substantial)
        if "strategic_diagnosis" in blueprint:
            if len(blueprint["strategic_diagnosis"]) < 200:
                errors.append("Strategic diagnosis too short (min 200 characters)")

        return (len(errors) == 0, errors)

    @staticmethod
    def get_prompt_metadata() -> Dict:
        """
        Get metadata about the current prompt version.

        Returns:
            Dictionary with version info
        """
        return {
            "version": PROMPT_VERSION,
            "created_at": "2026-02-02",
            "supported_industries": [v.value for v in IndustryVertical],
            "supported_formats": [f.value for f in OutputFormat]
        }
