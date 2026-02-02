# TASK-004: Verify Clerk Authentication Flow

**Status**: TODO
**Priority**: CRITICAL
**Phase**: Month 1-2 Foundation
**Estimated Effort**: 4-6 hours
**Dependencies**: TASK-001
**Assigned To**: Unassigned

---

## Objective

Test and validate the complete Clerk authentication flow, implement role-based access control (RBAC), and add user metadata tracking for subscription tiers.

---

## Description

Authentication is the foundation of the multi-tenant platform. This task ensures:
- Users can sign up and sign in securely
- User sessions persist correctly
- User metadata (subscription tier, tenant_id) is properly stored
- Protected routes are actually protected

**Current State**: Basic Clerk integration exists
**Target State**: Production-ready auth with tier tracking

---

## Acceptance Criteria

- [ ] Sign-up flow tested and working
  - Email/password authentication
  - Social login (Google, GitHub) if enabled
  - Email verification flow
- [ ] Sign-in flow tested and working
  - Correct redirect after login
  - Session persistence across page reloads
- [ ] Sign-out flow tested
- [ ] Protected routes enforce authentication
  - `/dashboard/*` requires login
  - Unauthenticated users redirected to `/sign-in`
- [ ] User metadata implemented:
  - `subscription_tier` (tier1, tier2, tier3)
  - `tenant_id` (for multi-tenant isolation)
  - `onboarding_completed` (boolean flag)
- [ ] Middleware configured correctly in `middleware.ts`
- [ ] Error handling for auth failures
- [ ] Documentation: `docs/AUTHENTICATION-GUIDE.md`

---

## Technical Implementation

### Clerk Middleware Configuration

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/api/webhooks/stripe"],
  ignoredRoutes: ["/api/public"],
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

### User Metadata Management

```typescript
// lib/clerk.ts
import { clerkClient } from "@clerk/nextjs";

export async function updateUserMetadata(
  userId: string,
  metadata: {
    subscription_tier?: "tier1" | "tier2" | "tier3";
    tenant_id?: string;
    onboarding_completed?: boolean;
  }
) {
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      subscription_tier: metadata.subscription_tier || "tier1",
      tenant_id: metadata.tenant_id || userId,
      onboarding_completed: metadata.onboarding_completed || false,
    },
  });
}

export async function getUserTier(userId: string): Promise<string> {
  const user = await clerkClient.users.getUser(userId);
  return user.publicMetadata.subscription_tier || "tier1";
}
```

### Protected API Routes

```typescript
// app/api/blueprints/route.ts
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Proceed with authenticated request
  const tier = await getUserTier(userId);
  // ...
}
```

---

## Testing Steps

### Manual Testing
1. Sign up as new user
2. Verify email received (if email verification enabled)
3. Sign in with credentials
4. Navigate to `/dashboard` - should succeed
5. Sign out
6. Try accessing `/dashboard` while signed out - should redirect to `/sign-in`
7. Sign in again - session should persist on page reload

### Automated Testing
```typescript
// __tests__/auth.test.ts
describe("Authentication Flow", () => {
  it("redirects unauthenticated users to sign-in", async () => {
    const response = await fetch("/dashboard");
    expect(response.redirected).toBe(true);
    expect(response.url).toContain("/sign-in");
  });

  it("allows authenticated users to access dashboard", async () => {
    // Mock authenticated session
    const response = await fetch("/dashboard", {
      headers: { Cookie: "authenticated_session_cookie" },
    });
    expect(response.status).toBe(200);
  });
});
```

---

## Clerk Configuration Checklist

- [ ] Application created in Clerk dashboard
- [ ] Publishable key and secret key added to `.env`
- [ ] Sign-up/sign-in URLs configured:
  - Sign in: `http://localhost:3000/sign-in`
  - Sign up: `http://localhost:3000/sign-up`
  - After sign in: `http://localhost:3000/dashboard`
- [ ] Email verification enabled (optional but recommended)
- [ ] Social logins configured (optional)
- [ ] Webhook endpoint configured for user events

---

## Security Checklist

- [ ] HTTPS enforced in production
- [ ] Session tokens stored securely (httpOnly cookies)
- [ ] CSRF protection enabled
- [ ] Rate limiting on auth endpoints
- [ ] Password requirements configured (min length, complexity)
- [ ] Account lockout after failed attempts

---

## Blockers

- Requires TASK-001 (Environment Configuration) to be completed
- Clerk account must be created and configured

---

## Notes

- Clerk provides built-in UI components - use them to save development time
- User metadata is stored in Clerk, but critical data should also be in our database
- For Tier 3 "white-glove" clients, consider enabling MFA/2FA
- Monitor Clerk usage limits (free tier has restrictions)

---

## Related Tasks

- TASK-001: Environment Configuration (dependency)
- TASK-002: Multi-Tenant Architecture (uses tenant_id from Clerk)
- TASK-005: Configure Stripe Products (tier metadata used for billing)
- TASK-009: Feature Gating (uses tier metadata for restrictions)
