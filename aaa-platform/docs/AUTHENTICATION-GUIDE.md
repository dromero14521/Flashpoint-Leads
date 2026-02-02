# Authentication Guide
## AAA Platform - Clerk Integration

**Last Updated**: 2026-02-01
**Status**: ✅ Production Ready

---

## Overview

The AAA Platform uses [Clerk](https://clerk.com) for authentication, user management, and session handling. This guide covers the complete authentication flow, user metadata management, and security best practices.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AAA Platform                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐     ┌────────────┐  │
│  │  Clerk Auth  │─────▶│  Middleware  │────▶│  Protected │  │
│  │              │      │              │     │   Routes   │  │
│  │ • Sign In    │      │ • Auth Check │     │ • Dashboard│  │
│  │ • Sign Up    │      │ • Session    │     │ • API      │  │
│  │ • Sign Out   │      │ • Metadata   │     │            │  │
│  └──────────────┘      └──────────────┘     └────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           User Metadata (Clerk publicMetadata)       │   │
│  │  • subscription_tier: "tier1" | "tier2" | "tier3"    │   │
│  │  • tenant_id: string (for multi-tenant isolation)    │   │
│  │  • onboarding_completed: boolean                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Required Keys

Add these to your `.env` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx

# Clerk URLs (optional, defaults shown)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook Secret (for user.created events)
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

### Getting Your Keys

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Navigate to **API Keys** in the dashboard
4. Copy the publishable key (starts with `pk_`)
5. Copy the secret key (starts with `sk_`)

---

## Authentication Flow

### Sign Up Flow

1. **User visits** `/sign-up`
2. **Clerk UI** captures email/password or social login
3. **Email verification** sent (if enabled)
4. **user.created webhook** triggers → initializes metadata:
   - `subscription_tier`: "tier1" (free)
   - `tenant_id`: user's Clerk ID
   - `onboarding_completed`: false
5. **Database record** created in Prisma (via webhook or first API call)
6. **Redirect** to `/dashboard`

### Sign In Flow

1. **User visits** `/sign-in`
2. **Clerk authenticates** credentials
3. **Session cookie** set (httpOnly, secure)
4. **Redirect** to `/dashboard`
5. **Middleware** validates session on all protected routes

### Sign Out Flow

1. **User clicks** sign out button (Clerk `<UserButton />`)
2. **Clerk clears** session
3. **Redirect** to `/` (home page)

---

## Protected Routes

### Middleware Configuration

All routes are protected by default **except** public routes:

```typescript
// middleware.ts
const isPublicRoute = createRouteMatcher([
  "/",                     // Home page
  "/sign-in(.*)",         // Sign in flow
  "/sign-up(.*)",         // Sign up flow
  "/api/webhooks/(.*)",   // Webhook endpoints
  "/api/leads",           // Public lead capture
  "/audit",               // Public audit tool
  "/book-call",           // Public booking page
]);
```

### Adding Protected Routes

Protected routes automatically enforce authentication. To protect a new route, simply **don't** add it to the public routes list.

Example:
```typescript
// app/admin/page.tsx - automatically protected
export default function AdminPage() {
  // Only authenticated users can access
  return <div>Admin Dashboard</div>;
}
```

---

## User Metadata Management

### Helper Functions

Located in `lib/clerk.ts`:

#### Get User Tier
```typescript
import { getUserTier } from "@/lib/clerk";

const tier = await getUserTier(); // "tier1", "tier2", or "tier3"
```

#### Update Subscription Tier
```typescript
import { updateSubscriptionTier } from "@/lib/clerk";

await updateSubscriptionTier(userId, "tier2");
```

#### Check Onboarding Status
```typescript
import { hasCompletedOnboarding } from "@/lib/clerk";

const isOnboarded = await hasCompletedOnboarding();
```

#### Complete Onboarding
```typescript
import { completeOnboarding } from "@/lib/clerk";

await completeOnboarding(userId);
```

#### Get Tenant ID
```typescript
import { getUserTenantId } from "@/lib/clerk";

const tenantId = await getUserTenantId();
```

#### Get All Metadata
```typescript
import { getUserMetadata } from "@/lib/clerk";

const metadata = await getUserMetadata();
// {
//   subscription_tier: "tier1",
//   tenant_id: "user_xxxxxxxxxxxx",
//   onboarding_completed: false
// }
```

---

## Protected API Routes

### Pattern 1: Manual Auth Check

```typescript
// app/api/example/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Authenticated logic here
  return NextResponse.json({ message: "Success" });
}
```

### Pattern 2: With User Metadata

```typescript
import { auth } from "@clerk/nextjs/server";
import { getUserTier } from "@/lib/clerk";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tier = await getUserTier(userId);

  // Tier-based logic
  if (tier === "tier1") {
    return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
  }

  return NextResponse.json({ message: "Success" });
}
```

---

## Webhooks

### Clerk Webhook Endpoint

**URL**: `/api/webhooks/clerk`

Handles the following events:
- `user.created` - Initializes metadata for new users
- `user.updated` - Syncs user profile changes
- `user.deleted` - Cleanup database records

### Setting Up Webhooks

1. Go to Clerk Dashboard → **Webhooks**
2. Click **Add Endpoint**
3. Enter URL: `https://yourdomain.com/api/webhooks/clerk`
4. Select events: `user.created`, `user.updated`, `user.deleted`
5. Copy the **Signing Secret**
6. Add to `.env` as `CLERK_WEBHOOK_SECRET`

---

## Security Checklist

- [x] **HTTPS enforced** in production (Vercel/Railway auto-handle this)
- [x] **Session tokens** stored as httpOnly cookies (Clerk default)
- [x] **CSRF protection** enabled (Clerk default)
- [x] **Webhook verification** using Svix signatures
- [x] **Rate limiting** on auth endpoints (Clerk handles this)
- [ ] **MFA/2FA** enabled for Tier 3 clients (optional, enable in Clerk dashboard)
- [ ] **Email verification** enabled (optional, configure in Clerk settings)

---

## Testing

### Manual Testing Checklist

1. **Sign Up**
   - [ ] Visit `/sign-up`
   - [ ] Create account with email/password
   - [ ] Verify email received (if verification enabled)
   - [ ] Confirm redirect to `/dashboard`

2. **Sign In**
   - [ ] Sign out
   - [ ] Visit `/sign-in`
   - [ ] Sign in with credentials
   - [ ] Confirm redirect to `/dashboard`
   - [ ] Reload page - session should persist

3. **Protected Routes**
   - [ ] Sign out
   - [ ] Try visiting `/dashboard` - should redirect to `/sign-in`
   - [ ] Sign in - should access `/dashboard` successfully

4. **Metadata**
   - [ ] Open browser console on `/dashboard`
   - [ ] Run: `fetch('/api/user').then(r => r.json()).then(console.log)`
   - [ ] Verify user tier is "free" or "tier1"

### Automated Testing

```typescript
// __tests__/auth.test.ts
describe("Authentication Flow", () => {
  it("redirects unauthenticated users to sign-in", async () => {
    const response = await fetch("http://localhost:3000/dashboard");
    expect(response.redirected).toBe(true);
    expect(response.url).toContain("/sign-in");
  });

  it("allows authenticated users to access dashboard", async () => {
    // This requires mocking Clerk session
    // See: https://clerk.com/docs/testing/overview
  });
});
```

---

## Troubleshooting

### Issue: "Invalid publishable key"

**Cause**: Wrong API key format or environment
**Fix**: Ensure you're using `pk_test_` for development or `pk_live_` for production

### Issue: Redirect loop on sign-in

**Cause**: Middleware protecting sign-in routes
**Fix**: Ensure `/sign-in(.*)` is in `isPublicRoute` matcher

### Issue: Session lost on page reload

**Cause**: Cookie settings or domain mismatch
**Fix**: Check Clerk dashboard → Session settings → Cookie domain

### Issue: Webhook returns 400

**Cause**: Invalid signing secret or headers
**Fix**: Verify `CLERK_WEBHOOK_SECRET` matches Clerk dashboard

---

## Upgrading Users

When a user subscribes via Stripe, update their tier:

```typescript
// In Stripe webhook handler (app/api/webhooks/stripe/route.ts)
import { updateSubscriptionTier } from "@/lib/clerk";

// After successful checkout
await updateSubscriptionTier(userId, "tier2"); // or "tier3"
```

---

## Multi-Tenant Isolation

Each user gets a unique `tenant_id` (defaults to their Clerk user ID). For enterprise clients, you can set a shared `tenant_id`:

```typescript
import { updateUserMetadata } from "@/lib/clerk";

// Assign user to organization's tenant
await updateUserMetadata(userId, {
  tenant_id: "org_enterprise_acme",
});
```

Then filter database queries:

```typescript
const tenantId = await getUserTenantId();

const blueprints = await prisma.blueprint.findMany({
  where: { tenantId }, // Only this tenant's data
});
```

---

## Next Steps

1. [Configure Stripe Products](./STRIPE-SETUP.md) (TASK-005)
2. [Implement Feature Gating](./FEATURE-GATING.md) (TASK-009)
3. [Production Deployment](./01-PRODUCTION-DEPLOYMENT.md) (TASK-016)

---

## Support

- **Clerk Docs**: https://clerk.com/docs
- **Clerk Discord**: https://discord.com/invite/clerk
- **AAA Platform Issues**: Contact your technical lead
