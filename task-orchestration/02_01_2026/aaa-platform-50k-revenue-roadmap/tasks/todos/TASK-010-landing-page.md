# TASK-010: Build Public Landing Page

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 3-4 Market Entry
**Estimated Effort**: 12-16 hours
**Dependencies**: TASK-009
**Assigned To**: Unassigned

---

## Objective

Create a high-converting public landing page that communicates the AAA platform's value proposition, displays social proof, and captures leads with a "Cost of Pain" calculator.

---

## Description

The landing page is the primary customer acquisition vehicle. It must:
- Clearly articulate the transformation (not just features)
- Demonstrate the financial cost of manual workflows
- Create urgency through social proof and scarcity
- Guide visitors toward sign-up or strategy session booking

**Strategic Goal**: 5% conversion from visitor to Tier 1 sign-up, 2% to strategy session booking

---

## Acceptance Criteria

- [ ] Hero section with compelling headline and CTA
- [ ] Value proposition section (transformation, not tools)
- [ ] "Cost of Pain" calculator widget (interactive)
- [ ] Feature comparison table (Tier 1 vs Tier 2 vs Tier 3)
- [ ] Social proof section:
  - Case studies (2-3 examples)
  - Testimonials
  - Trust badges
- [ ] Pricing section with tier cards
- [ ] FAQ section addressing objections
- [ ] Footer with links to docs, privacy policy, terms
- [ ] Lead capture forms:
  - Sign up for free trial (Tier 1)
  - Book strategy session (Tier 3)
- [ ] Mobile-responsive design
- [ ] Page speed optimized (<3 second load time)
- [ ] SEO optimized (title, meta description, schema markup)
- [ ] Analytics tracking (Google Analytics, Facebook Pixel)
- [ ] Documentation: `docs/LANDING-PAGE-OPTIMIZATION.md`

---

## Technical Implementation

### Page Structure

```
/
├── Hero Section
│   ├── Headline: "From Manual Chaos to Automated Profit in 24 Hours"
│   ├── Subheadline: "AI-powered automation architecture that replaces $10k consultants"
│   ├── Primary CTA: "Get Your Free Blueprint"
│   └── Secondary CTA: "See How It Works" (video/demo)
│
├── Problem Agitation Section
│   ├── "Are you losing $10,000/month to manual workflows?"
│   └── Pain point bullets (time waste, errors, revenue loss)
│
├── Cost of Pain Calculator
│   ├── Input: Hours spent on manual tasks per week
│   ├── Input: Hourly rate
│   ├── Output: Annual cost calculation
│   └── CTA: "Automate This for $99/month" (ROI comparison)
│
├── Solution Section
│   ├── How AAA works (3-step process)
│   └── Visual diagram/animation
│
├── Feature Comparison Table
│   ├── Tier 1 (Free) vs Tier 2 ($99-199) vs Tier 3 ($2,500-5,000)
│   └── Clear upgrade path
│
├── Social Proof
│   ├── Case study cards with metrics
│   ├── Video testimonials (if available)
│   └── Trust badges (secure payment, privacy certified)
│
├── Pricing Section
│   └── Tier cards with CTAs
│
├── FAQ
│   └── Common objections addressed
│
└── Final CTA
    └── "Start Your Free Trial" or "Book Strategy Session"
```

### Cost of Pain Calculator Widget

```tsx
// components/CostOfPainCalculator.tsx
"use client";

import { useState } from "react";

export function CostOfPainCalculator() {
  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);

  const weeklyLoss = hoursPerWeek * hourlyRate;
  const monthlyLoss = weeklyLoss * 4;
  const annualLoss = monthlyLoss * 12;

  const roi = ((monthlyLoss - 99) / 99) * 100; // ROI vs Tier 2

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        💸 Calculate Your Cost of Manual Work
      </h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hours spent on manual tasks per week
          </label>
          <input
            type="range"
            min="1"
            max="40"
            value={hoursPerWeek}
            onChange={(e) => setHoursPerWeek(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-right text-sm text-gray-600">
            {hoursPerWeek} hours/week
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your hourly rate (or cost to hire)
          </label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
            />
            <span className="text-gray-500 ml-2">/hour</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border-2 border-red-300">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">You're losing</p>
            <p className="text-5xl font-bold text-red-600">
              ${annualLoss.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-2">every year</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Monthly</p>
              <p className="text-xl font-semibold text-gray-900">
                ${monthlyLoss.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Weekly</p>
              <p className="text-xl font-semibold text-gray-900">
                ${weeklyLoss.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <p className="text-sm text-green-800 mb-2">
            ✅ Automate this with AAA for just <strong>$99/month</strong>
          </p>
          <p className="text-2xl font-bold text-green-700">
            {roi.toFixed(0)}% ROI
          </p>
          <p className="text-xs text-green-700 mt-1">
            Save ${(monthlyLoss - 99).toLocaleString()}/month
          </p>
        </div>

        <Button size="lg" className="w-full" href="/sign-up">
          Get My Free Blueprint Now
        </Button>
      </div>
    </div>
  );
}
```

### Pricing Section

```tsx
// components/PricingSection.tsx
export function PricingSection() {
  const tiers = [
    {
      name: "Freemium",
      price: "$0",
      description: "Get started with basic automation",
      features: [
        "3 AI blueprints per month",
        "Basic templates",
        "Community support",
      ],
      limitations: [
        "No integrations",
        "No PDF export",
        "AAA watermark",
      ],
      cta: "Start Free",
      href: "/sign-up",
      popular: false,
    },
    {
      name: "Core Subscription",
      price: "$99",
      priceDetail: "/month",
      description: "For serious businesses ready to automate",
      features: [
        "Unlimited AI blueprints",
        "All integrations (Zapier, Notion, ClickUp)",
        "PDF & JSON export",
        "Priority support",
        "No watermarks",
        "API access",
      ],
      limitations: [],
      cta: "Start 14-Day Trial",
      href: "/sign-up?tier=tier2",
      popular: true,
    },
    {
      name: "Apex Implementation",
      price: "$2,500",
      priceDetail: "one-time",
      description: "White-glove implementation service",
      features: [
        "Everything in Core",
        "1-on-1 strategy session",
        "Custom blueprint by experts",
        "Implementation support",
        "30-day follow-up",
        "Dedicated account manager",
      ],
      limitations: [],
      cta: "Book Strategy Session",
      href: "/book-session",
      popular: false,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {tiers.map((tier) => (
        <div
          key={tier.name}
          className={`relative border-2 rounded-xl p-8 ${
            tier.popular
              ? "border-blue-500 shadow-xl scale-105"
              : "border-gray-200"
          }`}
        >
          {tier.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
          )}

          <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
          <div className="mt-4 flex items-baseline">
            <span className="text-5xl font-bold text-gray-900">
              {tier.price}
            </span>
            {tier.priceDetail && (
              <span className="ml-2 text-gray-600">{tier.priceDetail}</span>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-600">{tier.description}</p>

          <ul className="mt-6 space-y-3">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </li>
            ))}
            {tier.limitations.map((limitation) => (
              <li key={limitation} className="flex items-start">
                <XIcon className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-500 line-through">
                  {limitation}
                </span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full mt-8"
            variant={tier.popular ? "primary" : "secondary"}
            href={tier.href}
          >
            {tier.cta}
          </Button>
        </div>
      ))}
    </div>
  );
}
```

---

## Copywriting Framework: "Hurt and Heal"

### Hero Headline Formula
**Problem + Promise + Timeframe**
- ❌ "Automation Platform for Businesses"
- ✅ "From Manual Chaos to Automated Profit in 24 Hours"

### Value Proposition
**Not what it is, but what it transforms**
- ❌ "AI-powered blueprint generator"
- ✅ "Replaces $10k consultants with instant, bespoke automation architecture"

### Social Proof Formula
**Specific Outcome + Industry + Metric**
- "E-commerce store recovered $4,500 in abandoned cart revenue in 30 days"
- "Law firm eliminated 90% of admin work, saving 15 hours/week"

---

## SEO Optimization

```html
<!-- app/page.tsx metadata -->
export const metadata = {
  title: "Automation Architecture Platform | Replace $10k Consultants with AI - AAA",
  description:
    "Generate bespoke workflow automation blueprints in 24 hours using AI. No more expensive consultants or static templates. Start free.",
  keywords:
    "workflow automation, business automation, AI automation, Zapier alternative, automation consulting",
  openGraph: {
    title: "Apex Automation Architect - AI-Powered Business Automation",
    description:
      "Replace manual workflows with instant, AI-generated automation blueprints.",
    images: ["/og-image.png"],
  },
};
```

---

## Testing Steps

1. **Conversion Tracking**
   - Install Google Analytics
   - Set up conversion goals (sign-ups, strategy session bookings)
   - Track button clicks, calculator usage

2. **A/B Testing**
   - Test 2-3 different headlines
   - Test CTA button colors (blue vs green vs orange)
   - Test pricing anchor (show annual cost vs monthly)

3. **Performance**
   - Lighthouse audit (target: 90+ score)
   - Test on mobile devices
   - Test on slow 3G connection

4. **User Testing**
   - Show to 5 target users
   - Ask: "What does this product do?" (clarity test)
   - Track time to first CTA click (should be <30 seconds)

---

## Blockers

- Need case study data (can use placeholder initially)
- Need testimonials (collect from beta users)
- Need video demo (optional, can add later)

---

## Notes

- Keep hero above the fold (no scrolling needed to see value + CTA)
- Use urgency sparingly (don't overdo scarcity tactics)
- Mobile-first design (60%+ traffic will be mobile)
- Fast load time is critical for SEO and conversions

---

## Related Tasks

- TASK-009: Feature Gating (pricing table reflects tiers)
- TASK-011: Case Study Template System
- TASK-013: Sales Framework (strategy session booking)
