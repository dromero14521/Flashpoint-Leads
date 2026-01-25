import os
from app.prompts.architect import PromptArchitect
from app.services.openrouter_client import OpenRouterClient

class BlueprintService:
    def __init__(self):
        self.use_mock = os.getenv("USE_MOCK_LLM", "false").lower() == "true"
        if not self.use_mock:
            try:
                self.client = OpenRouterClient()
            except ValueError:
                print("Warning: OpenRouter API key not set. Using mock responses.")
                self.use_mock = True

    async def generate_blueprint(self, industry: str, revenue_goal: str, tech_stack: list[str], pain_points: str) -> dict:
        """
        Orchestrates the LLM call to generate the blueprint.
        Falls back to mock response if API key is not configured.
        """
        
        # 1. Construct the Prompt
        system_prompt = PromptArchitect.build_system_prompt()
        user_prompt = PromptArchitect.build_user_prompt(industry, revenue_goal, tech_stack, pain_points)
        
        if self.use_mock:
            return self._get_mock_response(industry, revenue_goal, pain_points)
        
        # 2. Call OpenRouter API
        try:
            blueprint = await self.client.generate_json(system_prompt, user_prompt)
            return blueprint
        except Exception as e:
            print(f"Error calling OpenRouter: {e}")
            return self._get_mock_response(industry, revenue_goal, pain_points)

    def _get_mock_response(self, industry: str, revenue_goal: str, pain_points: str) -> dict:
        """Mock response for development/testing."""
        return {
            "strategic_diagnosis": f"The client is trapped in a 'Time-for-Money' loop typical of the {industry} sector. Manual handling of '{pain_points}' is creating a bottleneck that prevents scaling to {revenue_goal}.",
            "proposed_architecture": "Hub-and-Spoke Automation Model",
            "components": [
                {"name": "Central Intelligence", "tool": "GenAI Core (Python)"},
                {"name": "Data Ingestion", "tool": "Tally/Typeform"},
                {"name": "Orchestration", "tool": "n8n / Zapier"},
                {"name": "Client Interface", "tool": "Stripe Customer Portal"}
            ],
            "automation_steps": [
                "1. Implement Inquiry Capture form to standardize input data.",
                "2. Webhook data to GenAI Core for immediate processing.",
                "3. Generate bespoke PDF report using Python libraries.",
                "4. Auto-invoice via Stripe upon delivery."
            ],
            "estimated_impact": "Reduction of admin hours by 90%; Potential revenue increase of 300% via scalable productization."
        }

