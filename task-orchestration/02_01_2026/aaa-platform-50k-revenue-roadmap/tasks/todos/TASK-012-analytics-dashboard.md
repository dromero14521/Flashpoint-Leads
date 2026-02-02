# TASK-012: Build Analytics Dashboard

**Status**: TODO
**Priority**: MEDIUM
**Phase**: Month 3-4 Market Entry
**Estimated Effort**: 8-12 hours
**Dependencies**: TASK-007, TASK-009
**Assigned To**: Unassigned

---

## Objective

Implement an analytics dashboard to track key metrics: user engagement, blueprint generations, conversion funnel, revenue, and feature usage across tiers.

---

## Description

Data-driven decision making requires visibility into:
- User acquisition and activation
- Feature usage by tier
- Conversion funnel (visitor → sign-up → paid)
- Revenue metrics (MRR, churn, LTV)
- Blueprint generation trends

**Strategic Goal**: Identify optimization opportunities to reach $50k/month faster

---

## Acceptance Criteria

- [ ] Admin analytics dashboard page
- [ ] Key metrics displayed:
  - Total users (by tier)
  - Monthly Recurring Revenue (MRR)
  - Churn rate
  - Blueprint generations (total, by tier, by industry)
  - Conversion rates (visitor → Tier 1, Tier 1 → Tier 2, bookings → Tier 3)
  - Feature usage (integrations, exports)
- [ ] Time-series charts (daily, weekly, monthly)
- [ ] Cohort analysis (retention by sign-up month)
- [ ] Revenue forecasting
- [ ] Export to CSV/PDF
- [ ] Real-time updates (optional)
- [ ] Role-based access (admin only)
- [ ] Documentation: `docs/ANALYTICS-SETUP.md`

---

## Technical Implementation

### Analytics Data Model

```typescript
// types/analytics.ts
export interface AnalyticsEvent {
  id: string;
  tenant_id: string;
  event_type: string; // "blueprint_generated", "integration_connected", etc.
  event_data: Record<string, any>;
  timestamp: Date;
}

export interface DailyMetrics {
  date: string;
  new_users: number;
  active_users: number;
  blueprints_generated: number;
  revenue: number;
  conversions: {
    tier1_to_tier2: number;
    strategy_sessions_booked: number;
  };
}
```

### Event Tracking Service

```typescript
// lib/analytics-tracker.ts
export async function trackEvent(
  userId: string,
  eventType: string,
  eventData?: Record<string, any>
) {
  await db.analyticsEvents.create({
    tenant_id: userId,
    event_type: eventType,
    event_data: eventData || {},
    timestamp: new Date(),
  });

  // Also send to external analytics (PostHog, Mixpanel, etc.)
  if (process.env.POSTHOG_API_KEY) {
    posthog.capture({
      distinctId: userId,
      event: eventType,
      properties: eventData,
    });
  }
}

// Example usage
await trackEvent(userId, "blueprint_generated", {
  industry: "ecommerce",
  prompt_version: "v1.2",
  user_tier: "tier2",
});
```

### Metrics Calculation Queries

```typescript
// lib/analytics-queries.ts
export async function getMRR(): Promise<number> {
  const subscriptions = await db.subscriptions.findMany({
    where: {
      status: "active",
      tier: { in: ["tier2", "tier3"] },
    },
  });

  return subscriptions.reduce((sum, sub) => {
    const price = sub.tier === "tier2" ? 99 : 0; // Tier 3 is one-time
    return sum + price;
  }, 0);
}

export async function getChurnRate(period: "month" | "week"): Promise<number> {
  const startDate =
    period === "month"
      ? subMonths(new Date(), 1)
      : subWeeks(new Date(), 1);

  const activeStart = await db.subscriptions.count({
    where: {
      status: "active",
      created_at: { lt: startDate },
    },
  });

  const canceled = await db.subscriptions.count({
    where: {
      status: "canceled",
      canceled_at: { gte: startDate },
    },
  });

  return activeStart > 0 ? (canceled / activeStart) * 100 : 0;
}

export async function getConversionRate(
  from: string,
  to: string,
  period: Date
): Promise<number> {
  const fromCount = await db.users.count({
    where: {
      subscription_tier: from,
      created_at: { gte: period },
    },
  });

  const converted = await db.users.count({
    where: {
      subscription_tier: to,
      upgraded_at: { gte: period },
      previous_tier: from,
    },
  });

  return fromCount > 0 ? (converted / fromCount) * 100 : 0;
}
```

### Dashboard Page

```tsx
// app/admin/analytics/page.tsx
import { getMRR, getChurnRate, getConversionRate } from "@/lib/analytics-queries";
import { AnalyticsChart } from "@/components/AnalyticsChart";

export default async function AnalyticsDashboard() {
  const mrr = await getMRR();
  const churnRate = await getChurnRate("month");
  const tier1ToTier2 = await getConversionRate("tier1", "tier2", subMonths(new Date(), 1));

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Monthly Recurring Revenue"
          value={`$${mrr.toLocaleString()}`}
          trend="+12%"
          trendDirection="up"
        />
        <MetricCard
          title="Active Subscribers"
          value="127"
          trend="+8%"
          trendDirection="up"
        />
        <MetricCard
          title="Churn Rate"
          value={`${churnRate.toFixed(1)}%`}
          trend="-2%"
          trendDirection="down"
        />
        <MetricCard
          title="Tier 1 → Tier 2 Conversion"
          value={`${tier1ToTier2.toFixed(1)}%`}
          trend="+5%"
          trendDirection="up"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Revenue Over Time</h2>
          <AnalyticsChart
            data={revenueData}
            xKey="date"
            yKey="revenue"
            type="line"
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Blueprints Generated by Industry
          </h2>
          <AnalyticsChart
            data={industryData}
            xKey="industry"
            yKey="count"
            type="bar"
          />
        </div>
      </div>

      {/* User Acquisition Funnel */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Conversion Funnel</h2>
        <FunnelChart
          steps={[
            { label: "Website Visitors", value: 10000 },
            { label: "Sign-ups (Tier 1)", value: 500 },
            { label: "Upgraded to Tier 2", value: 75 },
            { label: "Tier 3 Purchases", value: 12 },
          ]}
        />
      </div>

      {/* Cohort Analysis */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Cohort Retention</h2>
        <CohortTable data={cohortData} />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  trend,
  trendDirection,
}: {
  title: string;
  value: string;
  trend: string;
  trendDirection: "up" | "down";
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <div className="flex items-center mt-2">
        {trendDirection === "up" ? (
          <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
        )}
        <span
          className={`text-sm ${
            trendDirection === "up" ? "text-green-600" : "text-red-600"
          }`}
        >
          {trend} vs last month
        </span>
      </div>
    </div>
  );
}
```

---

## Key Metrics to Track

### Revenue Metrics
- **MRR** (Monthly Recurring Revenue): Sum of active Tier 2 subscriptions
- **ARR** (Annual Recurring Revenue): MRR × 12
- **Churn Rate**: % of subscribers who cancel each month
- **LTV** (Lifetime Value): Average revenue per customer over their lifetime
- **CAC** (Customer Acquisition Cost): Marketing spend / new customers

### User Metrics
- **Total Users**: By tier (Tier 1, Tier 2, Tier 3)
- **Active Users**: Users who generated a blueprint in last 30 days
- **DAU/MAU** ratio: Daily Active / Monthly Active (engagement indicator)

### Product Metrics
- **Blueprints Generated**: Total, by tier, by industry
- **Integration Usage**: Which integrations are most popular
- **Export Formats**: PDF vs JSON vs Notion
- **Feature Adoption**: % of users using each feature

### Conversion Metrics
- **Visitor → Sign-up**: Landing page effectiveness
- **Tier 1 → Tier 2**: Upgrade conversion rate (target: 10-15%)
- **Strategy Sessions Booked**: Tier 3 pipeline
- **Strategy Session → Purchase**: Tier 3 close rate (target: 50%+)

---

## Revenue Forecasting

```typescript
// lib/revenue-forecast.ts
export function forecastRevenue(
  currentMRR: number,
  tier2GrowthRate: number,
  tier3MonthlyDeals: number
): MonthlyForecast[] {
  const forecast: MonthlyForecast[] = [];

  let projectedMRR = currentMRR;

  for (let month = 1; month <= 6; month++) {
    // Tier 2 growth (compound)
    projectedMRR *= 1 + tier2GrowthRate / 100;

    // Tier 3 revenue (one-time, assume $2,500 average)
    const tier3Revenue = tier3MonthlyDeals * 2500;

    forecast.push({
      month,
      tier2_mrr: Math.round(projectedMRR),
      tier3_revenue: tier3Revenue,
      total_revenue: Math.round(projectedMRR + tier3Revenue),
    });
  }

  return forecast;
}

// Example: 20% monthly growth in Tier 2, 10 Tier 3 deals/month
const forecast = forecastRevenue(5000, 20, 10);
// Month 6: ~$15,000 MRR + $25,000 Tier 3 = $40,000 total
```

---

## External Analytics Integration

### PostHog (Product Analytics)
```typescript
// lib/posthog.ts
import { PostHog } from 'posthog-node';

export const posthog = new PostHog(
  process.env.POSTHOG_API_KEY!,
  { host: 'https://app.posthog.com' }
);

// Track events
posthog.capture({
  distinctId: userId,
  event: 'blueprint_generated',
  properties: {
    industry: 'ecommerce',
    tier: 'tier2',
  },
});
```

### Google Analytics 4
```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Testing Steps

1. Generate test data (create dummy users, blueprints, subscriptions)
2. Verify metrics calculations are accurate
3. Test chart rendering with various data sets
4. Test date range filters (last 7 days, 30 days, 90 days, all time)
5. Test CSV export functionality
6. Verify real-time updates (if implemented)

---

## Blockers

- Requires sufficient data volume for meaningful insights
- External analytics tools may require paid plans

---

## Notes

- Start simple: Focus on MRR, user count, blueprint generations
- Add complexity over time as needs evolve
- Consider using tools like Metabase or Retool for faster development
- Automate weekly analytics reports (email to founder)

---

## Related Tasks

- TASK-009: Feature Gating (tracks usage limits)
- TASK-005: Stripe Integration (revenue data source)
- TASK-007: Blueprint Service (tracks generations)
