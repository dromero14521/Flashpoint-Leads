import os
from typing import List, Dict

class PromptArchitect:
    """
    Engineers the complex prompts required to generate bespoke automation architectures.
    Follows the 'Diagnostic Engine' mandate from the AAA roadmap.
    """
    
    @staticmethod
    def build_system_prompt() -> str:
        return """You are the Apex Automation Architect (AAA), a world-class systems engineer and business strategist. 
Your goal is to transform manual business pain points into automated, scalable "Digital Products as a Service".
You do not provide generic advice. You provide specific, technical, and actionable architectural blueprints.
"""

    @staticmethod
    def build_user_prompt(industry: str, revenue_goal: str, tech_stack: List[str], pain_points: str) -> str:
        stack_str = ", ".join(tech_stack)
        return f"""
PLEASE ANALYZE THE FOLLOWING CLIENT CONTEXT:

1. **Industry**: {industry}
2. **Revenue Goal**: {revenue_goal}
3. **Current Tech Stack**: {stack_str}
4. **Core Pain Points**: {pain_points}

REQUIRED OUTPUT:
Generate a JSON blueprint containing:
- "strategic_diagnosis": A ruthlessly honest analysis of why their current setup is failing.
- "proposed_architecture": A step-by-step technical workflow using their stack + GenAI.
- "automation_steps": An ordered list of implementation steps.
- "estimated_impact": Projected time/money saved.

The tone should be professional, authoritative, and focused on "High-Ticket" value.
"""
