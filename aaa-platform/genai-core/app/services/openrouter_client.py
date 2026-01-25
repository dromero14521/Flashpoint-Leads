import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

class OpenRouterClient:
    """
    Client for OpenRouter API - provides access to multiple LLM providers.
    https://openrouter.ai/docs
    """
    
    BASE_URL = "https://openrouter.ai/api/v1"
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.model = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")
        
        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
    
    async def chat_completion(self, system_prompt: str, user_prompt: str) -> str:
        """
        Send a chat completion request to OpenRouter.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://apex-automation.io",
            "X-Title": "Apex Automation Architect",
            "Content-Type": "application/json",
        }
        
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
            "max_tokens": 2000,
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            
            return data["choices"][0]["message"]["content"]
    
    async def generate_json(self, system_prompt: str, user_prompt: str) -> dict:
        """
        Generate a JSON response from the LLM.
        Attempts to parse the response as JSON.
        """
        response_text = await self.chat_completion(system_prompt, user_prompt)
        
        # Try to extract JSON from the response
        try:
            # Handle markdown code blocks
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Return as wrapped text if not valid JSON
            return {"raw_response": response_text}
