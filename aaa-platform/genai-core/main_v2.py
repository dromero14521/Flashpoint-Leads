"""
Enhanced GenAI Core API v2.0
Integrates v2 prompts, feature gating, and export functionality
"""

from fastapi import FastAPI, HTTPException, Header, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
import json

from app.services.blueprint_service_v2 import BlueprintServiceV2
from app.prompts.architect_v2 import OutputFormat, IndustryVertical

# Initialize FastAPI app
app = FastAPI(
    title="Apex Automation Architect - GenAI Core v2",
    description="AI-powered automation blueprint generation",
    version="2.0.0"
)

# Configure CORS for Control Plane communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize service
blueprint_service = BlueprintServiceV2()


# ============================================================================
# Request/Response Models
# ============================================================================

class BlueprintRequest(BaseModel):
    """
    Request model for blueprint generation with validation.
    """
    industry: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="User's industry (e.g., 'E-commerce', 'SaaS')"
    )
    revenue_goal: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Revenue target (e.g., '$500k/year')"
    )
    tech_stack: List[str] = Field(
        ...,
        min_items=0,
        max_items=10,
        description="Current tools/platforms (max 10)"
    )
    pain_points: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Current challenges and pain points"
    )
    output_format: Optional[str] = Field(
        default="technical",
        description="Output format: 'technical', 'executive', or 'visual'"
    )

    @validator('output_format')
    def validate_output_format(cls, v):
        """Validate output format is supported."""
        valid_formats = ["technical", "executive", "visual"]
        if v not in valid_formats:
            raise ValueError(f"Output format must be one of: {valid_formats}")
        return v

    @validator('tech_stack')
    def validate_tech_stack(cls, v):
        """Validate tech stack items."""
        if len(v) > 10:
            raise ValueError("Maximum 10 tech stack items allowed")
        # Remove empty strings
        return [item for item in v if item.strip()]


class BlueprintResponse(BaseModel):
    """Response model for blueprint generation."""
    blueprint: dict
    metadata: dict
    validation: dict
    user_input: dict


class ErrorResponse(BaseModel):
    """Error response model."""
    error: str
    detail: Optional[str] = None
    error_code: Optional[str] = None


# ============================================================================
# Helper Functions
# ============================================================================

def get_user_tier(x_user_tier: Optional[str] = Header(None)) -> str:
    """
    Extract user tier from request headers.
    Set by Control Plane after authentication.
    """
    if x_user_tier:
        return x_user_tier.lower()
    return "tier1"  # Default to tier1 if not specified


def get_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """
    Extract user ID from request headers.
    Set by Control Plane after authentication.
    """
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized - User ID not provided"
        )
    return x_user_id


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "GenAI Core v2",
        "version": "2.0.0",
        "prompt_version": "2.0",
        "supported_formats": blueprint_service.get_supported_formats(),
        "supported_industries": blueprint_service.get_supported_industries()
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "blueprint_service": "operational",
            "prompt_system": "v2.0"
        }
    }


@app.post(
    "/generate-blueprint",
    response_model=BlueprintResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
        500: {"model": ErrorResponse, "description": "Server error"}
    }
)
async def generate_blueprint(
    request: BlueprintRequest,
    x_user_tier: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None)
):
    """
    Generate a bespoke automation blueprint.

    This endpoint integrates:
    - v2 prompt engineering with industry-specific optimizations
    - Tier-based model selection (Sonnet vs Opus)
    - Quality validation and scoring
    - Prompt versioning for auditing

    **Rate Limits (enforced by Control Plane)**:
    - Tier 1 (Free): 3 blueprints/month
    - Tier 2 (Pro): Unlimited
    - Tier 3 (Apex): Unlimited + priority processing

    **Headers Required**:
    - X-User-Tier: User's subscription tier (tier1, tier2, tier3)
    - X-User-Id: User's unique identifier (for tracking)
    """
    try:
        # Get user context
        user_tier = get_user_tier(x_user_tier)
        user_id = get_user_id(x_user_id)

        # Generate blueprint using v2 service
        result = await blueprint_service.generate_blueprint(
            industry=request.industry,
            revenue_goal=request.revenue_goal,
            tech_stack=request.tech_stack,
            pain_points=request.pain_points,
            output_format=request.output_format,
            user_tier=user_tier
        )

        return BlueprintResponse(**result)

    except ValueError as e:
        # Validation errors
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )
    except Exception as e:
        # Unexpected errors
        print(f"Blueprint generation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Blueprint generation failed. Please try again."
        )


@app.get("/formats")
async def list_formats():
    """List supported output formats."""
    return {
        "formats": blueprint_service.get_supported_formats(),
        "descriptions": {
            "technical": "For developers - includes API details, code snippets, technical architecture",
            "executive": "For business owners - ROI focus, high-level overview, business outcomes",
            "visual": "For visual learners - includes Mermaid diagrams and flowcharts"
        }
    }


@app.get("/industries")
async def list_industries():
    """List supported industry verticals."""
    return {
        "industries": blueprint_service.get_supported_industries(),
        "descriptions": {
            "ecommerce": "E-commerce and retail businesses",
            "professional_services": "Consulting, legal, medical, accounting",
            "saas": "Software as a Service and tech companies",
            "content_creation": "Marketing agencies, content creators, media",
            "real_estate": "Real estate brokerages and property management",
            "general": "General business (fallback for unclassified industries)"
        }
    }


@app.post("/validate-request")
async def validate_request(request: BlueprintRequest):
    """
    Validate a blueprint request without generating.
    Useful for frontend validation before submission.
    """
    return {
        "valid": True,
        "message": "Request is valid and ready for blueprint generation"
    }


# ============================================================================
# Export Endpoints (Future Enhancement)
# ============================================================================

@app.get("/export/formats")
async def list_export_formats():
    """List available export formats (future feature)."""
    return {
        "available": ["json", "markdown"],
        "coming_soon": ["pdf", "notion", "docx"],
        "note": "PDF and Notion exports are Pro features (Tier 2+)"
    }


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors."""
    return Response(
        status_code=400,
        content=json.dumps({
            "error": "Validation Error",
            "detail": str(exc),
            "error_code": "VALIDATION_ERROR"
        }),
        media_type="application/json"
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected errors."""
    print(f"Unexpected error: {exc}")
    return Response(
        status_code=500,
        content=json.dumps({
            "error": "Internal Server Error",
            "detail": "An unexpected error occurred. Please try again.",
            "error_code": "INTERNAL_ERROR"
        }),
        media_type="application/json"
    )


# ============================================================================
# Startup/Shutdown Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    print("🚀 GenAI Core v2.0 starting up...")
    print(f"📊 Prompt Version: 2.0")
    print(f"🏭 Supported Industries: {len(blueprint_service.get_supported_industries())}")
    print(f"📝 Supported Formats: {len(blueprint_service.get_supported_formats())}")
    print("✅ GenAI Core v2.0 ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("🛑 GenAI Core v2.0 shutting down...")


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
