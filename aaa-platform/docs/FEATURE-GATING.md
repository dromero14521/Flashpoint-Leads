# Feature Gating System Documentation

## Overview

The AAA Platform implements a comprehensive feature gating system that enforces tier-based access control and usage limits. This system is critical for the "Crippleware" strategy outlined in CLAUDE.md, which drives conversion from Tier 1 (Free) to Tier 2 (Pro) subscribers.

**Strategic Goal**: Convert 10-15% of Tier 1 users to Tier 2 within 30 days.

---

## Architecture

The feature gating system consists of four main components:

### 1. Feature Flags (`lib/features.ts`)
Defines what features are available per tier:
- **Tier 1 (Free)**: 3 blueprints/month, no integrations, no PDF export
- **Tier 2 (Pro)**: Unlimited blueprints, all integrations, PDF export, API access
- **Tier 3 (Apex)**: Everything + priority support + white-glove service

### 2. Usage Tracking (`lib/usage-tracker.ts`)
Tracks user actions against monthly quotas:
- Blueprint generations
- PDF exports
- Integration deployments
- API calls

### 3. Feature Gate Middleware (`lib/feature-gate.ts`)
Enforces access control and usage limits in API routes:
- `requireFeature()` - Check if user has access to a feature
- `requireUsage()` - Check if user has remaining quota
- `recordUsage()` - Track usage after successful action

### 4. UI Components (`components/feature-gating/`)
Display locked features and upgrade prompts:
- `LockedFeature` - Overlay for locked features
- `UsageMeter` - Progress bars for usage limits
- `UpgradePrompt` - Strategic conversion prompts

---

## Tier Configuration

### Tier 1 (Free) - "Crippleware"

**Purpose**: Capture market share, create upgrade pressure

```typescript
{
  blueprint_limit: 3,                    // 3 per month
  blueprint_export_pdf: false,           // ❌ Locked
  blueprint_custom_templates: false,     // ❌ Locked
  integrations: [],                      // ❌ No integrations
  api_access: false,                     // ❌ Locked
  priority_support: false,               // ❌ Locked
}
```

**Conversion Triggers**:
- 3rd blueprint generation → Show upgrade prompt
- Attempt PDF export → Show "PDF Export is a Pro feature"
- Click integration → Show "Deploy instantly with Pro"

### Tier 2 (Pro) - Core Revenue Driver

**Price**: $99-199/month
**Target**: 250 subscribers (Month 6) = $25,000 MRR

```typescript
{
  blueprint_limit: Infinity,             // ✅ Unlimited
  blueprint_export_pdf: true,            // ✅ Enabled
  blueprint_custom_templates: true,      // ✅ Enabled
  integrations: ['zapier', 'notion', 'clickup'],
  api_access: true,                      // ✅ 100 req/min
  custom_branding: true,                 // ✅ Enabled
  team_collaboration: true,              // ✅ Enabled
}
```

### Tier 3 (Apex) - High-Ticket Service

**Price**: $2,500-5,000 (one-time or monthly)
**Target**: 10 clients/month = $25,000

```typescript
{
  blueprint_limit: Infinity,             // ✅ Unlimited
  integrations: ['all'],                 // ✅ All + custom
  api_access: true,                      // ✅ 1000 req/min
  priority_support: true,                // ✅ 24/7 priority
  white_glove_service: true,             // ✅ Dedicated support
}
```

---

## Usage Examples

### Protecting an API Route

```typescript
// app/api/blueprints/generate/route.ts
import { withUsageGate } from "@/lib/feature-gate";

export async function POST(req: NextRequest) {
  // Automatically checks limit and tracks usage
  return withUsageGate("blueprint", async () => {
    const blueprint = await generateBlueprint(data);
    return NextResponse.json(blueprint);
  });
}
```

### Manual Feature Check

```typescript
import { requireFeature } from "@/lib/feature-gate";

export async function POST(req: NextRequest) {
  try {
    // Check if user has PDF export access
    await requireFeature("blueprint_export_pdf");

    const pdf = await exportToPDF(blueprintId);
    return NextResponse.json({ url: pdf });

  } catch (error) {
    if (error instanceof FeatureLockedError) {
      return NextResponse.json({
        error: error.message,
        upgrade_url: "/pricing"
      }, { status: 403 });
    }
    throw error;
  }
}
```

### Displaying Usage in UI

```tsx
import { UsageMeter } from "@/components/feature-gating";

export default async function DashboardPage() {
  const { userId } = await auth();
  const tier = await getUserTier(userId);
  const usage = await getMonthlyUsage(userId, "blueprint");
  const limit = getFeatureLimit(tier, "blueprint_limit");

  return (
    <div>
      <h1>Dashboard</h1>
      <UsageMeter
        used={usage}
        limit={limit}
        action="blueprint"
        displayName="Blueprints this month"
      />
    </div>
  );
}
```

### Locked Feature Overlay

```tsx
import { LockedFeature } from "@/components/feature-gating";

export function IntegrationsSection({ tier }: { tier: SubscriptionTier }) {
  if (tier === "tier1") {
    return (
      <LockedFeature feature="Integrations" requiredTier="tier2">
        <div>
          {/* Preview of integrations (blurred) */}
          <IntegrationsList />
        </div>
      </LockedFeature>
    );
  }

  return <IntegrationsList />;
}
```

### Strategic Upgrade Prompt

```tsx
import { UpgradePrompt } from "@/components/feature-gating";

export function BlueprintGenerator({ usage, limit }: Props) {
  const showPrompt = usage >= limit - 1; // Show on 2nd blueprint

  return (
    <div>
      {showPrompt && (
        <UpgradePrompt
          trigger="blueprint_limit"
          currentTier="tier1"
          requiredTier="tier2"
        />
      )}

      <BlueprintForm />
    </div>
  );
}
```

---

## Database Schema

### UsageEvent Model

```prisma
model UsageEvent {
  id       String @id @default(cuid())
  userId   String
  tenantId String
  action   String   // blueprint, export_pdf, integration_deploy, api_call
  month    String   // YYYY-MM format
  metadata String?  // JSON
  createdAt DateTime @default(now())

  @@index([userId, action, month])
  @@index([tenantId, action, month])
}
```

---

## Error Responses

### 403 Forbidden - Feature Locked

```json
{
  "error": "This feature requires Pro or higher. Please upgrade your plan.",
  "requiredTier": "tier2",
  "currentTier": "tier1",
  "upgrade_url": "/pricing"
}
```

### 429 Too Many Requests - Usage Limit Reached

```json
{
  "error": "You've reached your monthly limit for blueprint. Upgrade to continue.",
  "action": "blueprint",
  "limit": 3,
  "used": 3,
  "upgrade_url": "/pricing"
}
```

---

## Conversion Tracking

Track upgrade funnel metrics with analytics:

```typescript
import { trackUpgradePromptShown, trackUpgradeButtonClicked } from "@/lib/analytics";

// Track when upgrade prompt is shown
await trackUpgradePromptShown(userId, "blueprint_limit");

// Track when user clicks upgrade button
await trackUpgradeButtonClicked(userId, "blueprint_limit");

// Track successful upgrade (handled by Stripe webhook)
await trackUpgradeCompleted(userId, "tier1", "tier2");
```

**Key Metrics to Monitor**:
- Upgrade prompt impressions by trigger type
- Click-through rate on upgrade CTAs
- Conversion rate by prompt trigger
- Time from first prompt to conversion
- Monthly churn by tier

---

## Best Practices

### 1. Soft Limits > Hard Limits

✅ **Good**: Show warning at 80%, prompt at 100%
```tsx
{percentage >= 80 && <UpgradePrompt trigger="blueprint_limit" />}
```

❌ **Bad**: Hard block without warning
```tsx
if (usage >= limit) throw new Error("Limit reached");
```

### 2. Strategic Prompt Timing

Show upgrade prompts at moments of **high intent**:
- ✅ When generating 2nd blueprint (user sees value)
- ✅ When attempting locked feature (clear benefit)
- ❌ Immediately on login (too aggressive)
- ❌ Random popups (annoying)

### 3. Value-First Messaging

✅ **Good**: "Deploy instantly with Pro" (benefit-focused)
❌ **Bad**: "Upgrade now" (generic)

### 4. Grace Periods

Consider allowing 1 extra action with upgrade prompt:
```typescript
const gracePeriod = 1;
if (usage >= limit + gracePeriod) {
  throw new UsageLimitError();
}
```

### 5. A/B Test Messaging

Test different upgrade prompts:
- Variant A: "Unlimited blueprints - $99/mo"
- Variant B: "Just $3.30/day for unlimited access"
- Measure conversion rates

---

## Testing

### Manual Testing

1. **Create Tier 1 Account**
   ```bash
   # Sign up at /sign-up
   # Check tier: should be "tier1"
   ```

2. **Test Blueprint Limit**
   ```bash
   # Generate 3 blueprints → Should succeed
   # Try 4th blueprint → Should show 429 error
   ```

3. **Test Locked Features**
   ```bash
   # Try PDF export → Should show 403 error
   # Try integration → Should show locked overlay
   ```

4. **Upgrade Flow**
   ```bash
   # Click "Upgrade Now" → Redirects to /pricing
   # Complete Stripe checkout
   # Verify tier updated to "tier2"
   # Generate unlimited blueprints → Should succeed
   ```

### Automated Tests

```typescript
// Test usage tracking
describe("Usage Tracking", () => {
  it("should track blueprint generation", async () => {
    await trackUsage(userId, tenantId, "blueprint");
    const usage = await getMonthlyUsage(userId, "blueprint");
    expect(usage).toBe(1);
  });

  it("should enforce tier1 blueprint limit", async () => {
    // Generate 3 blueprints
    for (let i = 0; i < 3; i++) {
      await trackUsage(userId, tenantId, "blueprint");
    }

    // 4th should fail
    await expect(
      requireUsageLimit(userId, "tier1", "blueprint")
    ).rejects.toThrow(UsageLimitError);
  });
});
```

---

## Monitoring

### Key Metrics Dashboard

Track these metrics in your analytics:

```typescript
// Conversion Funnel
- Tier 1 users who see upgrade prompt: X%
- Users who click upgrade button: Y%
- Users who complete upgrade: Z%
- Conversion rate: Z/X = N%

// Usage Patterns
- Average blueprints per Tier 1 user: 2.4
- % hitting limit each month: 45%
- Time to first limit hit: 8 days

// Revenue Impact
- Tier 2 MRR: $14,250 (143 subscribers)
- Tier 3 monthly: $22,500 (9 clients)
- Total MRR: $36,750
```

---

## Troubleshooting

### Issue: User upgraded but still seeing limits

**Solution**: Check Stripe webhook processing

```bash
# Check webhook events
SELECT * FROM WebhookEvent WHERE processed = false;

# Manually sync user tier
UPDATE User SET tier = 'tier2' WHERE clerkId = 'user_xxx';
```

### Issue: Usage not tracking

**Solution**: Check database connection and Prisma client

```bash
# Regenerate Prisma client
npx prisma generate

# Verify database schema
npx prisma db push
```

### Issue: Components not importing

**Solution**: Check TypeScript paths

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview and revenue model
- [AUTHENTICATION-GUIDE.md](./AUTHENTICATION-GUIDE.md) - Clerk user management
- [STRIPE-PRODUCT-REFERENCE.md](./STRIPE-PRODUCT-REFERENCE.md) - Billing integration

---

## Support

For questions or issues:
- Check implementation examples in `app/api/blueprints/generate/route.ts`
- Review UI components in `components/feature-gating/`
- Test locally with different tier configurations
