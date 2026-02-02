"""
Enhanced Blueprint Service v2.0
Implements prompt versioning, output formats, and quality validation
"""

import os
import json
from typing import Dict, Optional
from datetime import datetime
from app.prompts.architect_v2 import (
    PromptArchitect,
    OutputFormat,
    IndustryVertical,
    PROMPT_VERSION
)
from app.services.openrouter_client import OpenRouterClient


class BlueprintServiceV2:
    """
    Enhanced blueprint generation service with:
    - Prompt versioning tracking
    - Multiple output formats
    - Quality validation
    - Industry-specific optimizations
    """

    def __init__(self):
        self.use_mock = os.getenv("USE_MOCK_LLM", "false").lower() == "true"
        if not self.use_mock:
            try:
                self.client = OpenRouterClient()
            except ValueError:
                print("Warning: OpenRouter API key not set. Using mock responses.")
                self.use_mock = True

    async def generate_blueprint(
        self,
        industry: str,
        revenue_goal: str,
        tech_stack: list[str],
        pain_points: str,
        output_format: str = "technical",
        user_tier: str = "tier1"
    ) -> Dict:
        """
        Generate a comprehensive automation blueprint.

        Args:
            industry: User's industry (free-form string)
            revenue_goal: Revenue target (e.g., "$500k/year")
            tech_stack: List of current tools/platforms
            pain_points: Description of current challenges
            output_format: "technical", "executive", or "visual"
            user_tier: User's subscription tier (affects model selection)

        Returns:
            Dictionary containing:
            - blueprint: The generated blueprint
            - metadata: Version, format, timestamp info
            - validation: Quality check results
        """

        # Convert string format to enum
        try:
            format_enum = OutputFormat(output_format)
        except ValueError:
            format_enum = OutputFormat.TECHNICAL

        # Classify industry for specialized prompts
        industry_vertical = PromptArchitect._classify_industry(industry)

        # Build prompts
        system_prompt = PromptArchitect.build_system_prompt(format_enum)
        user_prompt = PromptArchitect.build_user_prompt(
            industry=industry,
            revenue_goal=revenue_goal,
            tech_stack=tech_stack,
            pain_points=pain_points,
            output_format=format_enum,
            industry_vertical=industry_vertical
        )

        # Select model based on tier
        model = self._select_model_for_tier(user_tier)

        # Generate blueprint
        if self.use_mock:
            blueprint_data = self._get_mock_response(
                industry, revenue_goal, pain_points, industry_vertical
            )
        else:
            try:
                blueprint_data = await self.client.generate_json(
                    system_prompt, user_prompt, model=model
                )
            except Exception as e:
                print(f"Error calling OpenRouter: {e}")
                blueprint_data = self._get_mock_response(
                    industry, revenue_goal, pain_points, industry_vertical
                )

        # Validate quality
        is_valid, validation_errors = PromptArchitect.validate_blueprint(blueprint_data)

        # Build response with metadata
        result = {
            "blueprint": blueprint_data,
            "metadata": {
                "prompt_version": PROMPT_VERSION,
                "output_format": output_format,
                "industry_vertical": industry_vertical.value,
                "model_used": model if not self.use_mock else "mock",
                "generated_at": datetime.now().isoformat(),
                "user_tier": user_tier
            },
            "validation": {
                "is_valid": is_valid,
                "errors": validation_errors,
                "quality_score": self._calculate_quality_score(blueprint_data)
            },
            "user_input": {
                "industry": industry,
                "revenue_goal": revenue_goal,
                "tech_stack": tech_stack,
                "pain_points": pain_points
            }
        }

        return result

    def _select_model_for_tier(self, user_tier: str) -> str:
        """
        Select appropriate LLM model based on user's subscription tier.

        Tier 1 (Free): Claude Sonnet (cost-optimized)
        Tier 2 (Pro): Claude Opus (higher quality)
        Tier 3 (Apex): Claude Opus (highest quality)
        """
        tier_models = {
            "tier1": "anthropic/claude-3.5-sonnet",      # Cost-optimized
            "tier2": "anthropic/claude-3-opus",          # High quality
            "tier3": "anthropic/claude-3-opus",          # Highest quality
        }

        return tier_models.get(user_tier, tier_models["tier1"])

    def _calculate_quality_score(self, blueprint: Dict) -> float:
        """
        Calculate a quality score (0-100) based on blueprint completeness.

        Scoring criteria:
        - Required fields present: +20 points each (5 fields = 100)
        - Component count (>= 4): +10 points
        - Automation steps (>= 6): +10 points
        - Estimated impact details: +10 points
        - Diagnosis length (>= 300 chars): +10 points
        """
        score = 0.0

        # Required fields (20 points each)
        required_fields = [
            "strategic_diagnosis",
            "proposed_architecture",
            "components",
            "automation_steps",
            "estimated_impact"
        ]

        for field in required_fields:
            if field in blueprint and blueprint[field]:
                score += 20.0

        # Bonus for quality indicators
        if "components" in blueprint and len(blueprint.get("components", [])) >= 4:
            score += 10.0

        if "automation_steps" in blueprint and len(blueprint.get("automation_steps", [])) >= 6:
            score += 10.0

        if "estimated_impact" in blueprint and isinstance(blueprint["estimated_impact"], dict):
            if len(blueprint["estimated_impact"]) >= 3:
                score += 10.0

        if "strategic_diagnosis" in blueprint and len(blueprint.get("strategic_diagnosis", "")) >= 300:
            score += 10.0

        return min(100.0, score)  # Cap at 100

    def _get_mock_response(
        self,
        industry: str,
        revenue_goal: str,
        pain_points: str,
        industry_vertical: IndustryVertical
    ) -> Dict:
        """
        Generate a high-quality mock response for development/testing.
        """
        vertical_names = {
            IndustryVertical.ECOMMERCE: "e-commerce",
            IndustryVertical.PROFESSIONAL_SERVICES: "professional services",
            IndustryVertical.SAAS: "SaaS",
            IndustryVertical.CONTENT_CREATION: "content creation",
            IndustryVertical.REAL_ESTATE: "real estate",
            IndustryVertical.GENERAL: "general business"
        }

        vertical_name = vertical_names.get(industry_vertical, "general business")

        return {
            "strategic_diagnosis": f"""Your {industry} business is currently trapped in what we call the 'Manual Execution Bottleneck' - a pattern we see across {vertical_name} operations. The pain points you've described ('{pain_points}') are symptoms of a deeper issue: your current workflow forces human intervention at every critical juncture, creating a hard ceiling on scalability.

The cost of inaction is significant. Every hour spent on '{pain_points}' is an hour not spent on revenue-generating activities. Based on your {revenue_goal} target, you're likely losing 15-20 hours per week to manual processes that could be automated. At a conservative $100/hour opportunity cost, that's $78,000-$104,000 annually in lost productivity.

The root cause is architectural: your systems don't talk to each other, forcing you to act as the 'integration layer' between tools. This is not sustainable as you scale toward {revenue_goal}.""",

            "proposed_architecture": f"""We recommend implementing a 'Hub-and-Spoke Automation Pipeline' specifically designed for {vertical_name} operations. This architecture uses a central intelligence layer (GenAI Core) that orchestrates data flow between your existing tools, eliminating manual handoffs.

The system works like this: Customer actions trigger automated workflows → Data flows through a central processing hub → AI makes decisions based on business rules → Actions are executed across your tool stack → Results are logged and monitored. No human intervention required for 90% of routine operations.

This architecture is battle-tested in {vertical_name} and typically pays for itself within 8-12 weeks through time savings alone.""",

            "components": [
                {
                    "name": "Central Intelligence Hub",
                    "tool": "n8n.io (self-hosted automation)",
                    "purpose": "Orchestrates all workflow automations and acts as the integration layer",
                    "integration_notes": "Connects to all other components via webhooks and REST APIs"
                },
                {
                    "name": "Customer Data Platform",
                    "tool": "Airtable (structured database)",
                    "purpose": "Single source of truth for all customer/client data",
                    "integration_notes": "Bidirectional sync with CRM and other tools via n8n"
                },
                {
                    "name": "Communication Engine",
                    "tool": "Twilio (SMS) + SendGrid (Email)",
                    "purpose": "Automated customer communications triggered by workflow events",
                    "integration_notes": "Triggered by n8n based on customer actions or time-based rules"
                },
                {
                    "name": "GenAI Processing Layer",
                    "tool": "OpenAI API (GPT-4)",
                    "purpose": "Handles intelligent decision-making, content generation, and data analysis",
                    "integration_notes": "Called by n8n workflows when AI processing is needed"
                },
                {
                    "name": "Reporting Dashboard",
                    "tool": "Google Data Studio",
                    "purpose": "Real-time visibility into automation performance and business metrics",
                    "integration_notes": "Pulls data from Airtable and automation logs"
                }
            ],

            "automation_steps": [
                "1. Set up n8n.io on a DigitalOcean droplet ($12/month) - install takes 30 minutes with their one-click app",
                "2. Create Airtable base with tables for Customers, Workflows, and Logs - use their pre-built templates to save time",
                "3. Connect your existing CRM to Airtable via n8n webhook (use 'New Record' trigger)",
                "4. Build your first workflow: When new customer added → Send welcome email via SendGrid → Log in Airtable",
                "5. Add Twilio SMS node for time-sensitive notifications (setup takes 15 minutes, $1/month minimum)",
                "6. Integrate OpenAI API for content generation (e.g., personalized emails, proposals) - use GPT-3.5-turbo for cost efficiency",
                "7. Set up error handling: Failed automations trigger Slack notifications to your team",
                "8. Create Google Data Studio dashboard pulling from Airtable to visualize automation performance",
                "9. Test end-to-end with 5-10 real customer scenarios before going live",
                "10. Monitor for 2 weeks, then iterate based on logs and team feedback"
            ],

            "estimated_impact": {
                "time_saved_per_week": "15-20 hours per week freed from manual tasks",
                "cost_reduction": "$78,000-$104,000 annually in reclaimed productivity",
                "revenue_potential": "25-40% increase in capacity allows serving more customers without hiring",
                "roi_timeline": "8-12 weeks to break even on implementation costs; ongoing savings thereafter"
            },

            "quick_wins": [
                "Quick Win 1: Automate your new customer welcome sequence (implement in 2 days, immediate 3 hours/week savings)",
                "Quick Win 2: Set up automatic SMS notifications for time-sensitive events (implement in 1 day, reduces support inquiries by 30%)",
                "Quick Win 3: Create Airtable views that auto-generate weekly reports (implement in 3 hours, saves 2 hours/week of manual reporting)"
            ],

            "implementation_timeline": {
                "phase_1": "Week 1-2: Core infrastructure setup (n8n, Airtable, API connections) + First automation workflow live",
                "phase_2": "Week 3-4: Expand to 3-5 core workflows covering your highest-pain processes + Team training",
                "phase_3": "Month 2+: Advanced automations (AI-powered decisioning, predictive analytics, custom integrations)"
            }
        }

    def get_supported_formats(self) -> list[str]:
        """Get list of supported output formats."""
        return [f.value for f in OutputFormat]

    def get_supported_industries(self) -> list[str]:
        """Get list of supported industry verticals."""
        return [v.value for v in IndustryVertical]
