# TASK-007: Enhance Blueprint Service

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 8-12 hours
**Dependencies**: TASK-001, TASK-003
**Assigned To**: Unassigned

---

## Objective

Enhance the GenAI blueprint generation service with input validation, persistent storage, retrieval capabilities, and multiple export formats.

---

## Description

The blueprint service is the core product differentiator. This task transforms the basic generation capability into a production-ready service that:
- Validates user inputs
- Stores generated blueprints with multi-tenant isolation
- Retrieves blueprints by ID or tenant
- Exports blueprints in multiple formats (PDF, JSON, Notion)

**Current State**: Basic blueprint generation in `genai-core/app/services/blueprint_service.py`
**Target State**: Full CRUD operations with export capabilities

---

## Acceptance Criteria

- [ ] Input validation schema implemented (Pydantic models)
- [ ] Blueprint generation handles errors gracefully
- [ ] Blueprints stored in database with:
  - Unique ID
  - Tenant ID (multi-tenant isolation)
  - Generated content
  - User input data
  - Timestamp
  - Prompt version used
- [ ] API endpoints implemented:
  - `POST /generate-blueprint` - Create new blueprint
  - `GET /blueprints` - List user's blueprints
  - `GET /blueprints/{id}` - Retrieve specific blueprint
  - `DELETE /blueprints/{id}` - Delete blueprint
- [ ] Export formats:
  - Markdown (default)
  - PDF generation
  - JSON (structured data)
  - Notion page template
- [ ] Rate limiting per tier:
  - Tier 1: 3 blueprints/month
  - Tier 2: Unlimited
  - Tier 3: Unlimited + priority processing
- [ ] Unit tests for service layer
- [ ] Integration tests for API endpoints
- [ ] Documentation: `docs/BLUEPRINT-SERVICE-API.md`

---

## Technical Implementation

### Input Validation (Pydantic)

```python
# app/models/blueprint_request.py
from pydantic import BaseModel, Field, validator
from typing import List

class BlueprintRequest(BaseModel):
    industry: str = Field(..., min_length=1, max_length=100)
    revenue_goal: str = Field(..., min_length=1)
    tech_stack: List[str] = Field(..., min_items=1)
    pain_points: str = Field(..., min_length=10, max_length=2000)

    @validator('tech_stack')
    def validate_tech_stack(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 tech stack items allowed')
        return v

    @validator('industry')
    def validate_industry(cls, v):
        allowed_industries = [
            'ecommerce', 'professional_services', 'saas',
            'content_creation', 'real_estate', 'other'
        ]
        if v.lower() not in allowed_industries:
            return 'other'
        return v.lower()
```

### Enhanced Service Layer

```python
# app/services/blueprint_service.py
import uuid
from datetime import datetime
from app.prompts.architect import generate_blueprint_prompt
from app.services.openrouter_client import OpenRouterClient

class BlueprintService:
    def __init__(self):
        self.client = OpenRouterClient()

    async def generate_blueprint(
        self,
        request: BlueprintRequest,
        tenant_id: str,
        user_tier: str
    ) -> dict:
        # Check rate limits
        if not await self.check_rate_limit(tenant_id, user_tier):
            raise RateLimitExceeded("Monthly blueprint limit reached")

        # Generate blueprint using LLM
        prompt = generate_blueprint_prompt(request.dict())
        blueprint_content = await self.client.generate(prompt)

        # Store in database
        blueprint_id = str(uuid.uuid4())
        blueprint = {
            "id": blueprint_id,
            "tenant_id": tenant_id,
            "content": blueprint_content,
            "user_input": request.dict(),
            "prompt_version": "v1.0",
            "created_at": datetime.utcnow(),
        }

        await db.blueprints.insert_one(blueprint)

        return blueprint

    async def check_rate_limit(self, tenant_id: str, tier: str) -> bool:
        if tier in ["tier2", "tier3"]:
            return True  # Unlimited

        # Tier 1: 3 per month
        count = await db.blueprints.count_documents({
            "tenant_id": tenant_id,
            "created_at": {"$gte": start_of_month()}
        })

        return count < 3
```

### PDF Export

```python
# app/services/export_service.py
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO

class ExportService:
    def export_to_pdf(self, blueprint: dict) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        story = []
        story.append(Paragraph("Automation Blueprint", styles['Title']))
        story.append(Spacer(1, 12))

        # Add blueprint content
        content = blueprint['content'].split('\n')
        for line in content:
            story.append(Paragraph(line, styles['BodyText']))
            story.append(Spacer(1, 6))

        doc.build(story)
        buffer.seek(0)
        return buffer.read()
```

### Notion Export Template

```python
# app/services/notion_export.py
def export_to_notion_template(blueprint: dict) -> dict:
    """
    Generate Notion API-compatible page structure
    """
    return {
        "parent": {"database_id": "user_database_id"},
        "properties": {
            "Name": {
                "title": [
                    {
                        "text": {
                            "content": f"Blueprint: {blueprint['user_input']['industry']}"
                        }
                    }
                ]
            }
        },
        "children": [
            {
                "object": "block",
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [{"type": "text", "text": {"content": "Automation Blueprint"}}]
                }
            },
            {
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": blueprint['content']}}]
                }
            }
        ]
    }
```

---

## API Endpoints

### FastAPI Routes

```python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from app.models.blueprint_request import BlueprintRequest
from app.services.blueprint_service import BlueprintService

app = FastAPI()
service = BlueprintService()

@app.post("/generate-blueprint")
async def generate_blueprint(
    request: BlueprintRequest,
    tenant_id: str = Depends(get_tenant_id),
    user_tier: str = Depends(get_user_tier)
):
    try:
        blueprint = await service.generate_blueprint(request, tenant_id, user_tier)
        return {"blueprint_id": blueprint['id'], "content": blueprint['content']}
    except RateLimitExceeded as e:
        raise HTTPException(status_code=429, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Blueprint generation failed")

@app.get("/blueprints")
async def list_blueprints(tenant_id: str = Depends(get_tenant_id)):
    blueprints = await db.blueprints.find({"tenant_id": tenant_id}).to_list(100)
    return {"blueprints": blueprints}

@app.get("/blueprints/{blueprint_id}")
async def get_blueprint(
    blueprint_id: str,
    tenant_id: str = Depends(get_tenant_id)
):
    blueprint = await db.blueprints.find_one({
        "id": blueprint_id,
        "tenant_id": tenant_id  # Enforce tenant isolation
    })

    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    return blueprint

@app.get("/blueprints/{blueprint_id}/export")
async def export_blueprint(
    blueprint_id: str,
    format: str = "pdf",  # pdf, json, notion
    tenant_id: str = Depends(get_tenant_id)
):
    blueprint = await get_blueprint(blueprint_id, tenant_id)

    if format == "pdf":
        pdf_bytes = ExportService().export_to_pdf(blueprint)
        return Response(content=pdf_bytes, media_type="application/pdf")
    elif format == "json":
        return blueprint
    elif format == "notion":
        return export_to_notion_template(blueprint)
```

---

## Testing Steps

1. **Input Validation Tests**
   - Send invalid industry → Should reject
   - Send empty tech_stack → Should reject
   - Send excessively long pain_points → Should reject

2. **Generation Tests**
   - Generate blueprint as Tier 1 user (1st, 2nd, 3rd) → Should succeed
   - Generate 4th blueprint as Tier 1 → Should fail (rate limit)
   - Generate as Tier 2 user → Should always succeed

3. **Retrieval Tests**
   - List blueprints as User A → Should see only User A's blueprints
   - Try to access User B's blueprint as User A → Should fail (403)

4. **Export Tests**
   - Export blueprint as PDF → Valid PDF file
   - Export as JSON → Valid JSON structure
   - Export as Notion → Valid Notion API format

---

## Blockers

- Requires database selection and setup (MongoDB, PostgreSQL)
- Requires TASK-001 (OpenRouter API key)
- Requires TASK-003 (prompt engineering)

---

## Notes

- Consider caching blueprint generations to reduce LLM API costs
- For Tier 3, add manual review step before delivery
- Future: Add collaboration features (share blueprints with team)
- Future: Version control for blueprint iterations

---

## Related Tasks

- TASK-001: Environment Configuration (dependency)
- TASK-002: Multi-Tenant Architecture (tenant isolation)
- TASK-003: GenAI Prompt Engineering (uses enhanced prompts)
- TASK-009: Feature Gating (enforces rate limits)
