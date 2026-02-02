# TASK-009: Implement Feature Gating System

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 3-4 Market Entry
**Estimated Effort**: 6-8 hours
**Dependencies**: TASK-004, TASK-005
**Assigned To**: Unassigned

---

## Objective

Implement a tier-based feature gating system that restricts access to premium features for Tier 1 users while seamlessly upgrading capabilities for Tier 2/3 subscribers.

---

## Description

The "Crippleware" strategy requires deliberately limiting Tier 1 functionality to create upgrade pressure. This task implements:
- Feature flags per tier
- Usage limits (blueprint generations)
- UI components showing locked features
- Upgrade prompts at strategic moments

**Strategic Goal**: Convert 10-15% of Tier 1 users to Tier 2 within 30 days

---

## Acceptance Criteria

- [ ] Feature flag system implemented
- [ ] Tier-specific limitations enforced:
  - **Tier 1**: 3 blueprints/month, no integrations, basic templates only
  - **Tier 2**: Unlimited blueprints, all integrations, premium templates
  - **Tier 3**: Everything in Tier 2 + priority support + white-glove service
- [ ] Usage tracking per user:
  - Blueprint generations this month
  - API calls made
  - Integration deployments
- [ ] UI components:
  - Locked feature indicators (lock icon, "Upgrade to unlock")
  - Usage meters ("2 of 3 blueprints used this month")
  - Upgrade CTAs at limit points
- [ ] Graceful degradation (soft limits vs hard limits)
- [ ] Admin dashboard to adjust limits
- [ ] Analytics tracking for conversion funnel
- [ ] Documentation: `docs/FEATURE-GATING.md`

---

## Technical Implementation

### Feature Flag Configuration

```typescript
// lib/features.ts
export const FEATURE_FLAGS = {
  tier1: {
    blueprint_limit: 3, // per month
    blueprint_export_pdf: false,
    integrations: [],
    priority_support: false,
    custom_templates: false,
    api_access: false,
  },
  tier2: {
    blueprint_limit: Infinity,
    blueprint_export_pdf: true,
    integrations: ["zapier", "notion", "clickup"],
    priority_support: false,
    custom_templates: true,
    api_access: true,
  },
  tier3: {
    blueprint_limit: Infinity,
    blueprint_export_pdf: true,
    integrations: ["zapier", "notion", "clickup", "all"],
    priority_support: true,
    custom_templates: true,
    api_access: true,
    white_glove_service: true,
  },
};

export function hasFeatureAccess(
  userTier: string,
  feature: string
): boolean {
  const tierConfig = FEATURE_FLAGS[userTier] || FEATURE_FLAGS.tier1;
  return tierConfig[feature] === true;
}

export function getFeatureLimit(
  userTier: string,
  feature: string
): number {
  const tierConfig = FEATURE_FLAGS[userTier] || FEATURE_FLAGS.tier1;
  return tierConfig[feature] || 0;
}
```

### Usage Tracking Service

```typescript
// lib/usage-tracker.ts
import { db } from "./db";

export async function trackUsage(
  userId: string,
  action: string
): Promise<void> {
  await db.usageEvents.create({
    tenant_id: userId,
    action,
    timestamp: new Date(),
    month: new Date().toISOString().slice(0, 7), // YYYY-MM
  });
}

export async function getMonthlyUsage(
  userId: string,
  action: string
): Promise<number> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const count = await db.usageEvents.count({
    tenant_id: userId,
    action,
    month: currentMonth,
  });

  return count;
}

export async function hasReachedLimit(
  userId: string,
  userTier: string,
  action: string
): Promise<boolean> {
  const limit = getFeatureLimit(userTier, `${action}_limit`);

  if (limit === Infinity) return false;

  const usage = await getMonthlyUsage(userId, action);
  return usage >= limit;
}
```

### Middleware for Feature Gating

```typescript
// lib/feature-gate.ts
import { auth } from "@clerk/nextjs";
import { getUserTier } from "./clerk";

export async function requireFeature(feature: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const tier = await getUserTier(userId);
  const hasAccess = hasFeatureAccess(tier, feature);

  if (!hasAccess) {
    throw new FeatureLockedError(
      `This feature requires ${getRequiredTier(feature)} or higher`
    );
  }
}

export async function requireUsageLimit(action: string) {
  const { userId } = auth();
  const tier = await getUserTier(userId!);

  const reachedLimit = await hasReachedLimit(userId!, tier, action);

  if (reachedLimit) {
    throw new UsageLimitError(
      `You've reached your monthly limit for ${action}. Upgrade to continue.`
    );
  }
}
```

### API Enforcement Example

```typescript
// app/api/blueprints/route.ts
export async function POST(req: Request) {
  const { userId } = auth();

  try {
    // Check if user has reached blueprint limit
    await requireUsageLimit("blueprint");

    // Generate blueprint
    const blueprint = await generateBlueprint(data);

    // Track usage
    await trackUsage(userId!, "blueprint");

    return Response.json(blueprint);
  } catch (error) {
    if (error instanceof UsageLimitError) {
      return Response.json(
        {
          error: error.message,
          upgrade_url: "/pricing",
        },
        { status: 429 } // Too Many Requests
      );
    }
  }
}
```

### UI Components

#### Locked Feature Badge

```tsx
// components/LockedFeature.tsx
export function LockedFeature({
  feature,
  requiredTier,
}: {
  feature: string;
  requiredTier: string;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
        <div className="text-center">
          <LockIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm text-gray-300">
            Unlock with {requiredTier}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-2"
            href="/pricing"
          >
            Upgrade Now
          </Button>
        </div>
      </div>

      {/* Blurred preview of locked content */}
      <div className="blur-sm pointer-events-none">{/* Feature UI */}</div>
    </div>
  );
}
```

#### Usage Meter

```tsx
// components/UsageMeter.tsx
export function UsageMeter({
  used,
  limit,
  action,
}: {
  used: number;
  limit: number;
  action: string;
}) {
  const percentage = (used / limit) * 100;
  const isNearLimit = percentage >= 80;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>
          {action} this month
        </span>
        <span className={isNearLimit ? "text-orange-500 font-medium" : ""}>
          {used} of {limit}
        </span>
      </div>

      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            isNearLimit ? "bg-orange-500" : "bg-blue-500"
          } transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isNearLimit && (
        <p className="text-xs text-orange-500">
          You're almost at your limit.{" "}
          <a href="/pricing" className="underline">
            Upgrade for unlimited access
          </a>
        </p>
      )}
    </div>
  );
}
```

#### Strategic Upgrade Prompts

```tsx
// components/UpgradePrompt.tsx
export function UpgradePrompt({ trigger }: { trigger: string }) {
  const prompts = {
    blueprint_limit: {
      title: "You've reached your monthly blueprint limit",
      description:
        "Upgrade to Pro for unlimited AI-generated blueprints and unlock integrations with Zapier, Notion, and more.",
      cta: "Upgrade to Pro - $99/month",
    },
    export_pdf: {
      title: "PDF export is a Pro feature",
      description:
        "Get professional PDF exports, unlimited blueprints, and API access with Pro.",
      cta: "Unlock Pro Features",
    },
    integrations: {
      title: "Deploy blueprints instantly with Pro",
      description:
        "Connect Zapier, Notion, and ClickUp to deploy your blueprints in one click.",
      cta: "Activate Integrations - Upgrade Now",
    },
  };

  const prompt = prompts[trigger];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900">
        {prompt.title}
      </h3>
      <p className="mt-2 text-sm text-gray-600">{prompt.description}</p>
      <Button className="mt-4" href="/pricing">
        {prompt.cta}
      </Button>
    </div>
  );
}
```

---

## Conversion Tracking

Track upgrade funnel metrics:

```typescript
// lib/analytics.ts
export async function trackUpgradePromptShown(
  userId: string,
  trigger: string
) {
  await analytics.track({
    userId,
    event: "Upgrade Prompt Shown",
    properties: { trigger },
  });
}

export async function trackUpgradeButtonClicked(
  userId: string,
  trigger: string
) {
  await analytics.track({
    userId,
    event: "Upgrade Button Clicked",
    properties: { trigger },
  });
}

export async function trackUpgradeCompleted(
  userId: string,
  fromTier: string,
  toTier: string
) {
  await analytics.track({
    userId,
    event: "Upgrade Completed",
    properties: { fromTier, toTier },
  });
}
```

---

## Testing Steps

1. **Tier 1 Limits**
   - Create Tier 1 account
   - Generate 3 blueprints → Should succeed
   - Try 4th blueprint → Should show upgrade prompt
   - Try to access integrations → Should show locked feature

2. **Upgrade Flow**
   - Click "Upgrade Now" from limit prompt
   - Complete Stripe checkout
   - Verify tier updated to Tier 2
   - Verify limits removed
   - Generate unlimited blueprints → Should succeed

3. **UI Components**
   - Verify lock icons on premium features
   - Verify usage meter updates in real-time
   - Verify upgrade prompts appear at strategic points

---

## Blockers

- Requires TASK-004 (Clerk user tiers)
- Requires TASK-005 (Stripe products)
- Requires database for usage tracking

---

## Notes

- **Soft limits** (warnings) are better UX than **hard limits** (errors)
- Track which upgrade prompts convert best → optimize messaging
- Consider "grace period" (allow 1 extra blueprint with upgrade prompt)
- A/B test different upgrade messaging

---

## Related Tasks

- TASK-004: Clerk Authentication (user tier data)
- TASK-005: Stripe Products & Pricing (upgrade targets)
- TASK-007: Blueprint Service (enforces limits)
- TASK-010: Landing Page (highlights tier differences)
