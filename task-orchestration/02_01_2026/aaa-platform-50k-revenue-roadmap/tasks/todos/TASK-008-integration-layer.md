# TASK-008: Create Integration Layer Framework

**Status**: TODO
**Priority**: MEDIUM
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 12-16 hours
**Dependencies**: TASK-007
**Assigned To**: Unassigned

---

## Objective

Design and implement a plugin architecture for third-party API integrations (Zapier, Notion, ClickUp) that allows users to deploy generated blueprints as actionable workflows.

---

## Description

The AAA platform's value proposition includes "instant deployment" of automation blueprints. This requires an integration layer that:
- Connects to popular automation platforms
- Translates blueprints into platform-specific configurations
- Handles authentication for each integration
- Provides a consistent interface for adding new integrations

**Current State**: No integration layer exists
**Target State**: Plugin architecture with 2-3 initial integrations

---

## Acceptance Criteria

- [ ] Plugin architecture designed with abstract base class
- [ ] OAuth 2.0 flow implemented for user authorizations
- [ ] Integration storage: Store user's connected accounts securely
- [ ] Initial integrations implemented:
  - **Zapier API** - Create Zaps programmatically
  - **Notion API** - Create pages/databases
  - **ClickUp API** (optional) - Create tasks/workflows
- [ ] Integration management UI:
  - Connect/disconnect integrations
  - View connected accounts
  - Test connections
- [ ] Error handling for API failures
- [ ] Rate limiting per integration provider
- [ ] Webhook endpoints for integration callbacks
- [ ] Documentation: `docs/INTEGRATION-ARCHITECTURE.md`

---

## Technical Implementation

### Plugin Architecture (Abstract Base Class)

```python
# app/integrations/base.py
from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseIntegration(ABC):
    """
    Base class for all third-party integrations
    """

    def __init__(self, credentials: Dict[str, str]):
        self.credentials = credentials

    @abstractmethod
    async def authenticate(self) -> bool:
        """Verify credentials are valid"""
        pass

    @abstractmethod
    async def deploy_blueprint(self, blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deploy a blueprint to this integration
        Returns deployment status and resource IDs
        """
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        """Test if the connection is still valid"""
        pass

    @abstractmethod
    def get_authorization_url(self, redirect_uri: str) -> str:
        """Get OAuth authorization URL"""
        pass

    @abstractmethod
    async def exchange_code_for_token(self, code: str) -> Dict[str, str]:
        """Exchange OAuth code for access token"""
        pass
```

### Zapier Integration

```python
# app/integrations/zapier.py
import httpx
from app.integrations.base import BaseIntegration

class ZapierIntegration(BaseIntegration):
    BASE_URL = "https://api.zapier.com/v1"

    async def authenticate(self) -> bool:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/user",
                headers={"Authorization": f"Bearer {self.credentials['access_token']}"}
            )
            return response.status_code == 200

    async def deploy_blueprint(self, blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a Zap based on blueprint recommendations
        """
        # Parse blueprint for Zapier-compatible steps
        steps = self._parse_blueprint_to_steps(blueprint['content'])

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/zaps",
                headers={"Authorization": f"Bearer {self.credentials['access_token']}"},
                json={
                    "title": f"AAA Blueprint: {blueprint['user_input']['industry']}",
                    "steps": steps
                }
            )

            return {
                "success": response.status_code == 201,
                "zap_id": response.json().get("id"),
                "zap_url": response.json().get("url")
            }

    def _parse_blueprint_to_steps(self, content: str) -> List[Dict]:
        """
        Convert blueprint content into Zapier step format
        Uses AI to extract actionable steps from blueprint
        """
        # TODO: Implement AI-based parsing
        return []

    def get_authorization_url(self, redirect_uri: str) -> str:
        return f"https://zapier.com/oauth/authorize?client_id={self.credentials['client_id']}&redirect_uri={redirect_uri}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, str]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://zapier.com/oauth/token",
                data={
                    "code": code,
                    "client_id": self.credentials['client_id'],
                    "client_secret": self.credentials['client_secret'],
                    "grant_type": "authorization_code"
                }
            )
            return response.json()
```

### Notion Integration

```python
# app/integrations/notion.py
from notion_client import AsyncClient
from app.integrations.base import BaseIntegration

class NotionIntegration(BaseIntegration):
    async def authenticate(self) -> bool:
        try:
            client = AsyncClient(auth=self.credentials['access_token'])
            await client.users.me()
            return True
        except Exception:
            return False

    async def deploy_blueprint(self, blueprint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a Notion page with blueprint content
        """
        client = AsyncClient(auth=self.credentials['access_token'])

        # Create page in user's Notion workspace
        page = await client.pages.create(
            parent={"page_id": self.credentials['parent_page_id']},
            properties={
                "title": {
                    "title": [
                        {
                            "text": {
                                "content": f"AAA Blueprint: {blueprint['user_input']['industry']}"
                            }
                        }
                    ]
                }
            },
            children=self._convert_blueprint_to_blocks(blueprint['content'])
        )

        return {
            "success": True,
            "page_id": page['id'],
            "page_url": page['url']
        }

    def _convert_blueprint_to_blocks(self, content: str) -> List[Dict]:
        """Convert markdown blueprint to Notion blocks"""
        blocks = []
        lines = content.split('\n')

        for line in lines:
            if line.startswith('# '):
                blocks.append({
                    "object": "block",
                    "type": "heading_1",
                    "heading_1": {"rich_text": [{"type": "text", "text": {"content": line[2:]}}]}
                })
            elif line.startswith('## '):
                blocks.append({
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {"rich_text": [{"type": "text", "text": {"content": line[3:]}}]}
                })
            else:
                blocks.append({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {"rich_text": [{"type": "text", "text": {"content": line}}]}
                })

        return blocks

    def get_authorization_url(self, redirect_uri: str) -> str:
        return f"https://api.notion.com/v1/oauth/authorize?client_id={self.credentials['client_id']}&response_type=code&owner=user&redirect_uri={redirect_uri}"
```

### Integration Manager Service

```python
# app/services/integration_service.py
from typing import Dict, List
from app.integrations.base import BaseIntegration
from app.integrations.zapier import ZapierIntegration
from app.integrations.notion import NotionIntegration

class IntegrationService:
    INTEGRATIONS = {
        "zapier": ZapierIntegration,
        "notion": NotionIntegration,
    }

    async def get_user_integrations(self, tenant_id: str) -> List[Dict]:
        """Get all connected integrations for a user"""
        return await db.integrations.find({"tenant_id": tenant_id}).to_list(100)

    async def connect_integration(
        self,
        tenant_id: str,
        provider: str,
        credentials: Dict[str, str]
    ) -> Dict:
        """Store integration credentials after OAuth"""
        integration_class = self.INTEGRATIONS.get(provider)
        if not integration_class:
            raise ValueError(f"Unknown integration: {provider}")

        # Verify credentials work
        integration = integration_class(credentials)
        if not await integration.authenticate():
            raise ValueError("Invalid credentials")

        # Store encrypted credentials
        integration_doc = {
            "tenant_id": tenant_id,
            "provider": provider,
            "credentials": encrypt(credentials),  # TODO: Implement encryption
            "connected_at": datetime.utcnow(),
            "status": "active"
        }

        result = await db.integrations.insert_one(integration_doc)
        return {"integration_id": str(result.inserted_id)}

    async def deploy_to_integration(
        self,
        tenant_id: str,
        blueprint_id: str,
        provider: str
    ) -> Dict:
        """Deploy a blueprint to a specific integration"""
        # Get blueprint
        blueprint = await db.blueprints.find_one({
            "id": blueprint_id,
            "tenant_id": tenant_id
        })

        # Get integration credentials
        integration_doc = await db.integrations.find_one({
            "tenant_id": tenant_id,
            "provider": provider,
            "status": "active"
        })

        if not integration_doc:
            raise ValueError(f"No active {provider} integration found")

        # Deploy
        integration_class = self.INTEGRATIONS[provider]
        integration = integration_class(decrypt(integration_doc['credentials']))

        result = await integration.deploy_blueprint(blueprint)

        # Log deployment
        await db.deployments.insert_one({
            "tenant_id": tenant_id,
            "blueprint_id": blueprint_id,
            "provider": provider,
            "result": result,
            "deployed_at": datetime.utcnow()
        })

        return result
```

---

## OAuth Flow Implementation

### Authorization Endpoint

```typescript
// control-plane/app/api/integrations/[provider]/authorize/route.ts
export async function GET(
  req: Request,
  { params }: { params: { provider: string } }
) {
  const { userId } = auth();
  const provider = params.provider;

  // Get authorization URL from genai-core
  const response = await fetch(
    `${process.env.GENAI_CORE_URL}/integrations/${provider}/authorize`,
    {
      headers: { "X-Tenant-ID": userId },
    }
  );

  const { authorization_url } = await response.json();

  // Redirect user to OAuth provider
  return Response.redirect(authorization_url);
}
```

### Callback Endpoint

```typescript
// control-plane/app/api/integrations/[provider]/callback/route.ts
export async function GET(
  req: Request,
  { params }: { params: { provider: string } }
) {
  const { userId } = auth();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  // Exchange code for token via genai-core
  const response = await fetch(
    `${process.env.GENAI_CORE_URL}/integrations/${provider}/connect`,
    {
      method: "POST",
      headers: { "X-Tenant-ID": userId },
      body: JSON.stringify({ code }),
    }
  );

  if (response.ok) {
    return Response.redirect("/dashboard/integrations?success=true");
  } else {
    return Response.redirect("/dashboard/integrations?error=auth_failed");
  }
}
```

---

## Testing Steps

1. **OAuth Flow**
   - Click "Connect Zapier" button
   - Redirected to Zapier authorization page
   - Approve access
   - Redirected back to AAA platform
   - Verify integration appears in "Connected Integrations" list

2. **Blueprint Deployment**
   - Generate a blueprint
   - Click "Deploy to Zapier"
   - Verify Zap created in Zapier dashboard
   - Test Zap functionality

3. **Error Handling**
   - Revoke integration access externally
   - Try to deploy blueprint
   - Verify error message displayed
   - Verify user prompted to reconnect

---

## Blockers

- Requires API credentials for each integration (Zapier, Notion)
- Requires SSL certificate for OAuth callbacks
- May need approval from integration providers (some require app review)

---

## Notes

- Start with 2 integrations (Zapier, Notion)
- Add more based on user demand
- Consider using integration platforms like Tray.io or Workato for broader coverage
- Future: Add two-way sync (changes in Zapier reflect back in AAA)

---

## Related Tasks

- TASK-007: Enhance Blueprint Service (generates blueprints to deploy)
- TASK-009: Feature Gating (integration deployments may be Tier 2+ only)
- TASK-017: Security & Compliance (credential encryption)
