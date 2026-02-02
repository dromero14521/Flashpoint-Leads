# TASK-002: Implement Multi-Tenant Data Architecture

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 8-12 hours
**Dependencies**: TASK-001
**Assigned To**: Unassigned

---

## Objective

Design and implement a multi-tenant database architecture that ensures data isolation between customers while maintaining efficient resource pooling, as mandated by the GEMINI.md strategic roadmap.

---

## Description

The AAA platform must support multiple tenants (customers) on a shared infrastructure. This requires implementing proper data isolation at the database level to prevent data leakage while optimizing for cost efficiency.

**Architecture Approach**: Single database, shared schema with tenant_id column (most cost-effective for early stage).

---

## Acceptance Criteria

- [ ] Database schema designed with tenant isolation in mind
- [ ] `tenant_id` column added to all user-data tables:
  - `users`
  - `blueprints`
  - `subscriptions`
  - `api_usage_logs`
- [ ] Database migration scripts created
- [ ] Row-level security policies implemented (if using PostgreSQL)
- [ ] Middleware/interceptor added to automatically inject tenant context
- [ ] Unit tests for tenant isolation (ensure User A cannot see User B's data)
- [ ] Documentation: `docs/MULTI-TENANT-ARCHITECTURE.md`

---

## Technical Implementation

### Database Schema Changes

```sql
-- Add tenant_id to blueprints table
ALTER TABLE blueprints ADD COLUMN tenant_id VARCHAR(255) NOT NULL;
CREATE INDEX idx_blueprints_tenant_id ON blueprints(tenant_id);

-- Add tenant_id to subscriptions table
ALTER TABLE subscriptions ADD COLUMN tenant_id VARCHAR(255) NOT NULL;
CREATE INDEX idx_subscriptions_tenant_id ON subscriptions(tenant_id);

-- Row-level security (PostgreSQL)
ALTER TABLE blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON blueprints
  USING (tenant_id = current_setting('app.current_tenant')::text);
```

### Middleware Implementation (Next.js)

```typescript
// middleware.ts
export async function middleware(req: NextRequest) {
  const { userId } = auth();

  if (userId) {
    // Inject tenant context for downstream queries
    req.headers.set('X-Tenant-ID', userId);
  }

  return NextResponse.next();
}
```

### Database Query Layer

```typescript
// lib/db.ts
export async function queryWithTenant<T>(
  query: string,
  tenantId: string,
  params: any[]
): Promise<T> {
  // Automatically filter by tenant_id
  const tenantQuery = query.replace(
    'FROM',
    `FROM (SELECT * FROM table WHERE tenant_id = $1) AS filtered`
  );
  return db.query(tenantQuery, [tenantId, ...params]);
}
```

---

## Testing Steps

1. Create two test users (Tenant A, Tenant B)
2. Generate blueprints for both tenants
3. Attempt to fetch Tenant A's blueprints while authenticated as Tenant B
4. Verify query returns empty result (not Tenant A's data)
5. Run integration tests for all CRUD operations
6. Performance test: Ensure tenant filtering doesn't degrade query performance

---

## Security Considerations

- **Threat**: Tenant ID manipulation in API requests
- **Mitigation**: Always derive tenant_id from authenticated session, never from client input
- **Threat**: SQL injection via tenant_id
- **Mitigation**: Use parameterized queries, validate tenant_id format
- **Threat**: Cross-tenant data leakage in error messages
- **Mitigation**: Sanitize error messages, never expose tenant_id in logs

---

## Blockers

- Requires database selection decision (PostgreSQL recommended)
- Requires ORM/query builder selection (Prisma, Drizzle, or raw SQL)

---

## Notes

- This is a **critical security feature** - data leakage would be catastrophic
- Consider implementing database-level audit logging for tenant access
- For Tier 3 "Siloing" upsell, we'll later add dedicated database instances
- Monitor query performance as tenant count grows (plan for sharding at 10k+ tenants)

---

## Related Tasks

- TASK-001: Environment Configuration (must complete first)
- TASK-004: Verify Clerk Authentication Flow
- TASK-007: Enhance Blueprint Service (will use tenant isolation)
- TASK-017: Security & Compliance
