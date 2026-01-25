from fastapi import FastAPI
from pydantic import BaseModel
from app.services.blueprint_service import BlueprintService

app = FastAPI(title="Apex Automation Architect - GenAI Core")
service = BlueprintService()

class PromptRequest(BaseModel):
    industry: str
    revenue_goal: str
    tech_stack: list[str]
    pain_points: str

class BlueprintResponse(BaseModel):
    blueprint: dict
    status: str

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "GenAI Core",
        "version": "1.0.0"
    }

@app.post("/generate-blueprint", response_model=BlueprintResponse)
async def generate_blueprint(request: PromptRequest):
    blueprint = await service.generate_blueprint(
        request.industry,
        request.revenue_goal,
        request.tech_stack,
        request.pain_points
    )
    
    return BlueprintResponse(
        blueprint=blueprint,
        status="success"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
