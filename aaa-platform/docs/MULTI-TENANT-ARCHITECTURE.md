# Multi-Tenant Architecture

**AAA Platform - Tenant Isolation & Security**

## Overview

The AAA Platform implements a **single-database, shared-schema** multi-tenant architecture with tenant-level data isolation. In our B2C model, each user is their own tenant (userId = tenantId).

### Why Multi-Tenancy?

- **Data Isolation**: Prevent users from accessing each other's data
- **Security**: Critical for SaaS applications handling sensitive business information
- **Compliance**: Required for SOC 2, GDPR, and enterprise customers
- **Scalability**: Efficient resource pooling with clear separation boundaries

---

## Architecture Model

### B2C Single-Tenant Model (Current)

```
User A (tenantId: user_a) → Blueprints (tenantId: user_a)
User B (tenantId: user_b) → Blueprints (tenantId: user_b)
User C (tenantId: user_c) → Blueprints (tenantId: user_c)
```

Each user is isolated from others. `userId === tenantId` in this model.

### Future B2B Multi-User Tenant Model

```
Organization X (tenantId: org_x)
  ├─ User A (userId: user_a, tenantId: org_x)
  ├─ User B (userId: user_b, tenantId: org_x)
  └─ Blueprints (tenantId: org_x) ← Shared by all users in org_x
```

Multiple users share the same tenant (organization).

---

## Database Schema

### Tables with Tenant Isolation

| Table | tenantId | Purpose |
|-------|----------|---------|
| `User` | Yes | For future B2B (currently `tenantId = userId`) |
| `Blueprint` | Yes | User-generated automation blueprints |
| `UserSettings` | Yes | User preferences and settings |
| `SubscriptionHistory` | Yes | Billing and subscription events |
| `UsageEvent` | Yes | Feature usage tracking |

### Tables WITHOUT Tenant Isolation

| Table | Reason |
|-------|--------|
| `Lead` | Marketing/sales data (pre-auth) |
| `StrategyCall` | Sales funnel (pre-tenant) |
| `AuditSubmission` | Marketing lead magnet |
| `WebhookEvent` | System events |

---

## Implementation

### 1. Database Columns

All user-data tables have a `tenantId` column:

```sql
ALTER TABLE "Blueprint" ADD COLUMN "tenantId" TEXT NOT NULL;
CREATE INDEX "Blueprint_tenantId_idx" ON "Blueprint"("tenantId");
```

### 2. Row-Level Security (PostgreSQL)

PostgreSQL enforces tenant isolation at the database level:

```sql
ALTER TABLE "Blueprint" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_policy" ON "Blueprint"
  USING ("tenantId" = current_setting('app.current_tenant')::text);
```

This ensures that even if application code fails, the database prevents cross-tenant access.

### 3. Application Layer (TypeScript)

#### Tenant Context Utilities (`lib/tenant.ts`)

```typescript
import { getTenantId } from "@/lib/tenant";

// Get current tenant ID from authenticated session
const tenantId = await getTenantId(); // Returns userId from Clerk

// Validate resource belongs to current tenant
await validateTenantAccess(resource.tenantId);

// Check if user has access
const hasAccess = await hasTenantAccess(resource.tenantId);
```

#### Tenant-Aware Database Client (`lib/db.ts`)

```typescript
import { tenantDb } from "@/lib/db";

// All queries automatically filtered by tenant
const blueprints = await tenantDb.blueprint.findMany();
// SELECT * FROM Blueprint WHERE tenantId = 'current_user_id'

// Create with automatic tenantId injection
const blueprint = await tenantDb.blueprint.create({
  data: {
    industry: "SaaS",
    revenueGoal: "100k/mo",
    // tenantId automatically added
  },
});
```

### 4. API Routes

**Correct Usage** (Automatic Tenant Filtering):

```typescript
// app/api/blueprints/route.ts
import { tenantDb } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // tenantDb automatically filters by userId
  const blueprints = await tenantDb.blueprint.findMany();

  return Response.json({ blueprints });
}
```

**Incorrect Usage** (Security Vulnerability):

```typescript
// ❌ NEVER DO THIS - accepts tenantId from client
export async function GET(req: Request) {
  const { tenantId } = await req.json(); // Client can send any tenantId!

  const blueprints = await prisma.blueprint.findMany({
    where: { tenantId }, // SECURITY BREACH
  });

  return Response.json({ blueprints });
}
```

---

## Security Principles

### 1. Never Trust Client Input

```typescript
// ❌ BAD: Accept tenantId from client
const { tenantId } = req.body;

// ✅ GOOD: Derive tenantId from authenticated session
const tenantId = await getTenantId(); // From Clerk userId
```

### 2. Always Filter Database Queries

```typescript
// ❌ BAD: Query without tenant filter
const blueprints = await prisma.blueprint.findMany();

// ✅ GOOD: Use tenantDb for automatic filtering
const blueprints = await tenantDb.blueprint.findMany();
```

### 3. Verify Access on Updates/Deletes

```typescript
// ✅ GOOD: tenantDb verifies access before update
await tenantDb.blueprint.update({
  where: { id: blueprintId },
  data: { status: "published" },
});
// Throws error if blueprint belongs to different tenant
```

### 4. Row-Level Security as Failsafe

PostgreSQL RLS ensures that even if application code has bugs, the database enforces tenant isolation.

---

## Testing

### Automated Tests

Run tenant isolation tests:

```bash
cd aaa-platform/control-plane
npm test -- tenant-isolation.test.ts
```

### Manual Testing Checklist

- [ ] Create blueprint as User A
- [ ] Verify User B cannot see User A's blueprint
- [ ] Try to update User A's blueprint as User B (should fail)
- [ ] Try to delete User A's blueprint as User B (should fail)
- [ ] Verify search queries don't leak data across tenants
- [ ] Check usage events are properly isolated

---

## Migration Guide

### Development (SQLite → PostgreSQL)

```bash
# 1. Update DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/aaa_dev"

# 2. Run migrations
npx prisma migrate deploy

# 3. Apply tenant isolation migration
psql -d aaa_dev -f prisma/migrations/add_multi_tenant_isolation.sql

# 4. Update existing data
psql -d aaa_dev -c "UPDATE \"Blueprint\" SET \"tenantId\" = \"userId\" WHERE \"tenantId\" = '';"
```

### Production Deployment

```bash
# 1. Backup database
pg_dump aaa_production > backup_$(date +%Y%m%d).sql

# 2. Enable maintenance mode
# (Prevents new writes during migration)

# 3. Run migration
psql -d aaa_production -f prisma/migrations/add_multi_tenant_isolation.sql

# 4. Verify row-level security
psql -d aaa_production -c "\d+ Blueprint" | grep "ROW LEVEL SECURITY"

# 5. Smoke test
# - Create test blueprint
# - Verify isolation works

# 6. Disable maintenance mode
```

---

## Performance Considerations

### Indexing

All tenant-filtered tables have indexes:

```sql
CREATE INDEX "Blueprint_tenantId_idx" ON "Blueprint"("tenantId");
CREATE INDEX "Blueprint_userId_tenantId_idx" ON "Blueprint"("userId", "tenantId");
```

### Query Performance

```sql
-- Efficient: Uses index
SELECT * FROM Blueprint WHERE tenantId = 'user_123';

-- Less efficient: Full table scan
SELECT * FROM Blueprint WHERE industry = 'SaaS';

-- Optimal: Combines tenant filter with other filters
SELECT * FROM Blueprint
WHERE tenantId = 'user_123' AND industry = 'SaaS';
```

### Connection Pooling

With PostgreSQL RLS, use connection pooling with tenant context:

```typescript
await prisma.$executeRaw`SET app.current_tenant = ${tenantId}`;
```

---

## Monitoring & Auditing

### Audit Logging

Log all tenant access for security audits:

```typescript
// lib/audit.ts
export async function logTenantAccess(
  tenantId: string,
  action: string,
  resourceId: string
) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      action,
      resourceId,
      timestamp: new Date(),
    },
  });
}
```

### Monitoring Queries

```sql
-- Find potential cross-tenant access attempts
SELECT * FROM AuditLog
WHERE action = 'FORBIDDEN_ACCESS_ATTEMPT'
AND timestamp > NOW() - INTERVAL '24 hours';

-- Monitor query performance by tenant
SELECT tenantId, COUNT(*), AVG(duration_ms)
FROM QueryMetrics
GROUP BY tenantId
ORDER BY COUNT(*) DESC;
```

---

## Common Pitfalls

### 1. Forgetting to Filter Queries

```typescript
// ❌ WRONG: No tenant filter
const count = await prisma.blueprint.count();

// ✅ CORRECT: Use tenantDb
const count = await tenantDb.blueprint.count();
```

### 2. Mixing Direct Prisma and tenantDb

```typescript
// ❌ WRONG: Inconsistent access patterns
const all = await prisma.blueprint.findMany(); // Unfiltered
const filtered = await tenantDb.blueprint.findMany(); // Filtered

// ✅ CORRECT: Use tenantDb consistently
const blueprints = await tenantDb.blueprint.findMany();
```

### 3. Exposing tenantId in API Responses

```typescript
// ❌ WRONG: Leaks internal IDs
return Response.json({
  id: blueprint.id,
  tenantId: blueprint.tenantId, // Internal detail
  industry: blueprint.industry,
});

// ✅ CORRECT: Don't expose internal fields
return Response.json({
  id: blueprint.id,
  industry: blueprint.industry,
  // tenantId omitted
});
```

---

## Future Enhancements

### Phase 2: B2B Multi-User Tenants

When adding team/organization support:

1. Add `Organization` table
2. Update `User` to reference `organizationId`
3. Set `tenantId = organizationId` for team members
4. Implement role-based access control (RBAC) within tenants

### Phase 3: Tenant Sharding

When scaling to 10,000+ tenants:

1. Shard by tenantId range
2. Use connection pooling per shard
3. Implement read replicas for large tenants

---

## Resources

- [Prisma Multi-Tenancy Guide](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Multi-Tenancy Security](https://cheatsheetseries.owasp.org/cheatsheets/Multitenant_Security_Cheat_Sheet.html)

---

## Support

For questions about multi-tenant architecture:

1. Check this documentation first
2. Review `lib/tenant.ts` and `lib/db.ts` for implementation details
3. Run tests: `npm test -- tenant-isolation.test.ts`
4. Consult the team

**Security Issue?** Report immediately to security@apexautomation.ai
