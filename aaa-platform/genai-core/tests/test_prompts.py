"""
Test Suite for GenAI Prompt Engineering
Tests prompt quality, industry classification, and blueprint validation
"""

import pytest
import asyncio
from app.prompts.architect_v2 import (
    PromptArchitect,
    OutputFormat,
    IndustryVertical,
    PROMPT_VERSION
)
from app.services.blueprint_service_v2 import BlueprintServiceV2


class TestPromptArchitect:
    """Test the PromptArchitect class"""

    def test_system_prompt_generation(self):
        """Test that system prompts are generated for all formats"""
        for format in OutputFormat:
            prompt = PromptArchitect.build_system_prompt(format)
            assert len(prompt) > 100
            assert "Apex Automation Architect" in prompt

    def test_industry_classification(self):
        """Test industry classification accuracy"""
        test_cases = [
            ("E-commerce store selling widgets", IndustryVertical.ECOMMERCE),
            ("Online retail shop", IndustryVertical.ECOMMERCE),
            ("Legal consulting firm", IndustryVertical.PROFESSIONAL_SERVICES),
            ("Medical practice", IndustryVertical.PROFESSIONAL_SERVICES),
            ("SaaS platform for developers", IndustryVertical.SAAS),
            ("Software company building tools", IndustryVertical.SAAS),
            ("Marketing agency creating content", IndustryVertical.CONTENT_CREATION),
            ("Real estate brokerage", IndustryVertical.REAL_ESTATE),
            ("Property management company", IndustryVertical.REAL_ESTATE),
            ("Manufacturing business", IndustryVertical.GENERAL),
        ]

        for industry_string, expected_vertical in test_cases:
            result = PromptArchitect._classify_industry(industry_string)
            assert result == expected_vertical, f"Failed for: {industry_string}"

    def test_industry_context_exists(self):
        """Test that all industries have context defined"""
        for vertical in IndustryVertical:
            context = PromptArchitect.get_industry_context(vertical)
            assert len(context) > 200
            assert "INDUSTRY FOCUS" in context or "pain points" in context.lower()

    def test_user_prompt_generation(self):
        """Test user prompt generation with various inputs"""
        test_data = {
            "industry": "E-commerce",
            "revenue_goal": "$500k/year",
            "tech_stack": ["Shopify", "Klaviyo", "Google Analytics"],
            "pain_points": "Abandoned carts, manual inventory tracking"
        }

        prompt = PromptArchitect.build_user_prompt(
            industry=test_data["industry"],
            revenue_goal=test_data["revenue_goal"],
            tech_stack=test_data["tech_stack"],
            pain_points=test_data["pain_points"]
        )

        # Verify prompt contains all user data
        assert test_data["industry"] in prompt
        assert test_data["revenue_goal"] in prompt
        assert test_data["pain_points"] in prompt
        for tool in test_data["tech_stack"]:
            assert tool in prompt

        # Verify prompt structure
        assert "CLIENT CONTEXT" in prompt
        assert "REQUIRED OUTPUT" in prompt
        assert "QUALITY REQUIREMENTS" in prompt

    def test_prompt_metadata(self):
        """Test prompt version metadata"""
        metadata = PromptArchitect.get_prompt_metadata()
        assert "version" in metadata
        assert metadata["version"] == PROMPT_VERSION
        assert "supported_industries" in metadata
        assert "supported_formats" in metadata
        assert len(metadata["supported_industries"]) > 0
        assert len(metadata["supported_formats"]) > 0


class TestBlueprintValidation:
    """Test blueprint quality validation"""

    def test_valid_blueprint_passes(self):
        """Test that a valid blueprint passes validation"""
        valid_blueprint = {
            "strategic_diagnosis": "This is a comprehensive diagnosis " * 20,  # Long enough
            "proposed_architecture": "Hub-and-Spoke Model with central intelligence",
            "components": [
                {"name": "Hub", "tool": "n8n", "purpose": "Orchestration"},
                {"name": "CRM", "tool": "HubSpot", "purpose": "Customer data"},
                {"name": "Email", "tool": "SendGrid", "purpose": "Communications"},
                {"name": "Analytics", "tool": "Mixpanel", "purpose": "Tracking"}
            ],
            "automation_steps": [
                "Step 1: Setup infrastructure",
                "Step 2: Connect APIs",
                "Step 3: Build first workflow",
                "Step 4: Test",
                "Step 5: Deploy",
                "Step 6: Monitor"
            ],
            "estimated_impact": {
                "time_saved": "20 hours/week",
                "cost_reduction": "$50k/year",
                "roi_timeline": "8 weeks"
            }
        }

        is_valid, errors = PromptArchitect.validate_blueprint(valid_blueprint)
        assert is_valid, f"Validation failed: {errors}"
        assert len(errors) == 0

    def test_missing_required_fields(self):
        """Test that missing required fields are detected"""
        incomplete_blueprint = {
            "strategic_diagnosis": "Some text",
            # Missing other required fields
        }

        is_valid, errors = PromptArchitect.validate_blueprint(incomplete_blueprint)
        assert not is_valid
        assert len(errors) > 0
        assert any("Missing required field" in error for error in errors)

    def test_insufficient_components(self):
        """Test that blueprints with too few components fail"""
        blueprint = {
            "strategic_diagnosis": "Diagnosis text " * 20,
            "proposed_architecture": "Architecture",
            "components": [
                {"name": "Only", "tool": "One", "purpose": "Tool"},
                {"name": "Two", "tool": "Tools", "purpose": "Here"}
            ],  # Only 2 components
            "automation_steps": ["1", "2", "3", "4", "5"],
            "estimated_impact": {"time": "10h"}
        }

        is_valid, errors = PromptArchitect.validate_blueprint(blueprint)
        assert not is_valid
        assert any("at least 3 components" in error for error in errors)

    def test_short_diagnosis(self):
        """Test that short diagnoses are flagged"""
        blueprint = {
            "strategic_diagnosis": "Too short",  # Less than 200 chars
            "proposed_architecture": "Architecture",
            "components": [
                {"name": "1", "tool": "A", "purpose": "X"},
                {"name": "2", "tool": "B", "purpose": "Y"},
                {"name": "3", "tool": "C", "purpose": "Z"}
            ],
            "automation_steps": ["1", "2", "3", "4", "5"],
            "estimated_impact": {"time": "10h"}
        }

        is_valid, errors = PromptArchitect.validate_blueprint(blueprint)
        assert not is_valid
        assert any("diagnosis too short" in error.lower() for error in errors)


class TestBlueprintService:
    """Test the BlueprintServiceV2 class"""

    @pytest.fixture
    def service(self):
        """Create a blueprint service instance"""
        return BlueprintServiceV2()

    def test_model_selection_by_tier(self, service):
        """Test that correct models are selected based on tier"""
        assert "sonnet" in service._select_model_for_tier("tier1").lower()
        assert "opus" in service._select_model_for_tier("tier2").lower()
        assert "opus" in service._select_model_for_tier("tier3").lower()

    def test_quality_score_calculation(self, service):
        """Test quality score calculation"""
        # Perfect blueprint
        perfect_blueprint = {
            "strategic_diagnosis": "x" * 400,  # Long diagnosis
            "proposed_architecture": "Architecture",
            "components": [{"name": f"C{i}", "tool": f"T{i}", "purpose": "P"} for i in range(5)],
            "automation_steps": [f"Step {i}" for i in range(7)],
            "estimated_impact": {
                "time": "10h",
                "cost": "$50k",
                "revenue": "100k",
                "roi": "8 weeks"
            }
        }

        score = service._calculate_quality_score(perfect_blueprint)
        assert score >= 90.0  # Should be high quality

        # Poor blueprint
        poor_blueprint = {
            "strategic_diagnosis": "Short"
        }

        score = service._calculate_quality_score(poor_blueprint)
        assert score < 50.0  # Should be low quality

    @pytest.mark.asyncio
    async def test_blueprint_generation_mock(self, service):
        """Test blueprint generation with mock responses"""
        service.use_mock = True  # Force mock mode

        result = await service.generate_blueprint(
            industry="E-commerce",
            revenue_goal="$500k/year",
            tech_stack=["Shopify", "Klaviyo"],
            pain_points="Manual inventory, abandoned carts",
            output_format="technical",
            user_tier="tier1"
        )

        # Check structure
        assert "blueprint" in result
        assert "metadata" in result
        assert "validation" in result
        assert "user_input" in result

        # Check metadata
        assert result["metadata"]["prompt_version"] == PROMPT_VERSION
        assert result["metadata"]["output_format"] == "technical"
        assert result["metadata"]["user_tier"] == "tier1"

        # Check blueprint content
        blueprint = result["blueprint"]
        assert "strategic_diagnosis" in blueprint
        assert "proposed_architecture" in blueprint
        assert "components" in blueprint
        assert "automation_steps" in blueprint

        # Check validation
        assert "is_valid" in result["validation"]
        assert "quality_score" in result["validation"]

    def test_supported_formats(self, service):
        """Test that all formats are supported"""
        formats = service.get_supported_formats()
        assert "technical" in formats
        assert "executive" in formats
        assert "visual" in formats

    def test_supported_industries(self, service):
        """Test that all industries are supported"""
        industries = service.get_supported_industries()
        assert "ecommerce" in industries
        assert "professional_services" in industries
        assert "saas" in industries
        assert "content_creation" in industries
        assert "real_estate" in industries


# Test data fixtures
@pytest.fixture
def sample_test_cases():
    """Sample test cases for different industries"""
    return [
        {
            "name": "E-commerce Store",
            "industry": "E-commerce",
            "revenue_goal": "$1M/year",
            "tech_stack": ["Shopify", "Klaviyo", "Google Analytics"],
            "pain_points": "Abandoned cart rate 75%, manual inventory tracking, delayed customer support responses"
        },
        {
            "name": "Legal Firm",
            "industry": "Legal services",
            "revenue_goal": "$500k/year",
            "tech_stack": ["Clio", "DocuSign", "Google Workspace"],
            "pain_points": "Client intake takes 2 hours, document generation is manual, billing errors common"
        },
        {
            "name": "SaaS Startup",
            "industry": "SaaS",
            "revenue_goal": "$2M ARR",
            "tech_stack": ["Stripe", "Intercom", "Mixpanel"],
            "pain_points": "High churn rate, users don't complete onboarding, support tickets overwhelming"
        },
        {
            "name": "Marketing Agency",
            "industry": "Content creation agency",
            "revenue_goal": "$750k/year",
            "tech_stack": ["Asana", "Canva", "Buffer"],
            "pain_points": "Content approval bottlenecks, asset organization chaos, client reporting takes days"
        },
        {
            "name": "Real Estate Brokerage",
            "industry": "Real estate",
            "revenue_goal": "$3M/year in commissions",
            "tech_stack": ["Follow Up Boss", "DocuSign", "Zillow"],
            "pain_points": "Lead follow-up delays, transaction coordination overwhelm, open house no-shows"
        }
    ]


class TestIndustrySpecificPrompts:
    """Test industry-specific prompt quality"""

    @pytest.mark.asyncio
    async def test_all_industry_test_cases(self, sample_test_cases):
        """Generate blueprints for all sample test cases"""
        service = BlueprintServiceV2()
        service.use_mock = True  # Use mock responses for testing

        for test_case in sample_test_cases:
            result = await service.generate_blueprint(
                industry=test_case["industry"],
                revenue_goal=test_case["revenue_goal"],
                tech_stack=test_case["tech_stack"],
                pain_points=test_case["pain_points"],
                output_format="technical"
            )

            # Verify blueprint was generated
            assert result is not None
            assert result["validation"]["is_valid"]
            assert result["validation"]["quality_score"] > 70.0

            # Verify user input is referenced in diagnosis
            diagnosis = result["blueprint"]["strategic_diagnosis"]
            assert test_case["pain_points"][:30] in diagnosis or \
                   any(word in diagnosis.lower() for word in test_case["pain_points"].lower().split()[:3])


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])
