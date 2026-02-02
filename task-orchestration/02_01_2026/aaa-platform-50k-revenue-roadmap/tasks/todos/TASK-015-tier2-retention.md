# TASK-015: Optimize Tier 2 Retention

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 5-6 Scale to $50k/mo
**Estimated Effort**: 8-10 hours
**Dependencies**: TASK-009, TASK-012
**Assigned To**: Unassigned

---

## Objective

Implement retention strategies to reduce Tier 2 churn, increase customer lifetime value (LTV), and achieve the target of 250 active subscribers generating $25,000/month in recurring revenue.

---

## Description

Subscription revenue is only valuable if customers stay subscribed. This task implements:
- Churn prevention triggers (usage monitoring)
- Email engagement campaigns
- Feature adoption nudges
- Success milestones and celebrations
- Win-back campaigns for churned users

**Target Metrics**:
- Churn rate: <5% monthly
- Active subscriber count: 250+
- MRR: $25,000+ ($99-199 avg per subscriber)

---

## Acceptance Criteria

- [ ] Usage monitoring system implemented
- [ ] Churn risk detection algorithm
- [ ] Automated email sequences:
  - Onboarding (Days 1, 3, 7, 14, 30)
  - Low usage alerts
  - Feature adoption nudges
  - Renewal reminders
  - Win-back campaigns
- [ ] In-app notifications for:
  - Feature announcements
  - Usage milestones
  - Upgrade opportunities
- [ ] Customer health score dashboard
- [ ] Exit survey for cancellations
- [ ] Win-back offer strategy
- [ ] Documentation: `docs/RETENTION-STRATEGY.md`

---

## Churn Prevention Framework

### 1. Early Warning Signals

Monitor these churn indicators:

- **No logins in 7+ days**
- **Zero blueprint generations in 14+ days**
- **No integration connected after 30 days**
- **Failed payment (dunning management)**
- **Support ticket with unresolved complaint**
- **Low engagement with emails (no opens in 30 days)**

### 2. Customer Health Score

```typescript
// lib/health-score.ts
export function calculateHealthScore(user: User): number {
  let score = 100;

  // Deduct for inactivity
  const daysSinceLogin = getDaysSince(user.last_login);
  if (daysSinceLogin > 7) score -= 20;
  if (daysSinceLogin > 14) score -= 30;
  if (daysSinceLogin > 30) score -= 50;

  // Deduct for low usage
  const blueprintsThisMonth = await getBlueprintsCount(
    user.id,
    "this_month"
  );
  if (blueprintsThisMonth === 0) score -= 30;
  if (blueprintsThisMonth < 3) score -= 15;

  // Deduct for no integrations
  const integrationsCount = await getIntegrationsCount(user.id);
  if (integrationsCount === 0) score -= 20;

  // Deduct for support issues
  const openTickets = await getOpenTicketsCount(user.id);
  score -= openTickets * 10;

  // Bonus for engagement
  if (blueprintsThisMonth > 10) score += 10;
  if (integrationsCount > 2) score += 10;

  return Math.max(0, Math.min(100, score));
}

// Categorize health
export function getHealthCategory(score: number): string {
  if (score >= 80) return "healthy";
  if (score >= 60) return "at_risk";
  if (score >= 40) return "critical";
  return "churning";
}
```

---

## Email Sequences

### Onboarding Sequence (Days 1-30)

**Day 1: Welcome**
```
Subject: Welcome to AAA - Let's get you automated!

Hi [Name],

Welcome to the Apex Automation Architect!

You've just unlocked unlimited AI-generated automation blueprints. Here's how to get started:

1. Generate your first blueprint (takes 2 minutes)
2. Connect your first integration (Zapier, Notion, or ClickUp)
3. Deploy your automation

[CTA: Create Your First Blueprint]

Need help? Reply to this email - I read every message.

Best,
[Your Name]
Founder, AAA
```

**Day 3: Feature highlight**
```
Subject: Did you know AAA can export to PDF?

Hi [Name],

Quick tip: You can export your blueprints as professional PDFs to share with your team.

[Screenshot of PDF export feature]

[CTA: Try PDF Export]

Also, if you haven't connected an integration yet, I highly recommend starting with Zapier - it's the easiest to get results fast.

Best,
[Your Name]
```

**Day 7: Check-in**
```
Subject: How's your automation journey going?

Hi [Name],

It's been a week since you joined AAA. I wanted to check in - how's it going?

So far, you've:
- Generated [X] blueprints
- Connected [X] integrations

[If 0 blueprints]: I noticed you haven't generated a blueprint yet. Is something blocking you? Reply and let me know how I can help.

[If 1+ blueprints]: Awesome! Want to take it to the next level? Try deploying one of your blueprints to Notion or Zapier.

Best,
[Your Name]
```

**Day 14: Success milestone**
```
Subject: You're crushing it! 🎉

Hi [Name],

Just wanted to celebrate - you've generated [X] blueprints in your first 2 weeks!

Here's what other successful users do next:
1. Connect multiple integrations (Zapier + Notion)
2. Set up recurring automations (not just one-time)
3. Invite team members to collaborate

Keep going!

Best,
[Your Name]
```

**Day 30: Renewal reminder**
```
Subject: Your trial period is ending - let's keep the momentum!

Hi [Name],

You've been with AAA for 30 days, and you've accomplished:
- [X] blueprints generated
- [X] integrations connected
- [Y hours] saved per week (estimated)

Your subscription renews on [date] for $99/month.

Want to make sure you're getting maximum value? Book a free optimization call: [Calendly Link]

Best,
[Your Name]
```

---

### Churn Prevention Sequences

**Low Usage Alert (Trigger: 14 days no activity)**
```
Subject: We miss you! Is everything okay?

Hi [Name],

I noticed you haven't logged in to AAA in a couple weeks. Is everything alright?

Sometimes life gets busy - I get it. But I'd hate for you to miss out on what you're paying for.

Quick question: Is there something blocking you from using AAA? A feature you need? A bug you hit?

Reply and let me know - I'm here to help.

Best,
[Your Name]

P.S. If you need a break, I can pause your subscription instead of canceling.
```

**Payment Failed (Dunning Management)**
```
Subject: Oops - Your payment didn't go through

Hi [Name],

Your credit card on file was declined for your AAA subscription.

This happens sometimes (expired card, bank security, etc.) - no big deal!

Please update your payment info here: [Stripe Portal Link]

Want to avoid interruption? Update within 3 days.

Best,
[Your Name]
```

**Cancellation Win-Back**
```
Subject: We're sorry to see you go...

Hi [Name],

I saw that you canceled your AAA subscription. I'm sorry we didn't meet your expectations.

Would you mind sharing why you left? Your feedback helps us improve.

[Link to exit survey]

Also, if you reconsider in the future, here's a one-time offer:

Come back within 30 days and get 50% off your first month back.

Use code: COMEBACK50

Best,
[Your Name]
```

---

## Feature Adoption Nudges

### In-App Notifications

```tsx
// components/FeaturePrompt.tsx
export function FeaturePrompt({ user }: { user: User }) {
  const hasIntegration = user.integrations_count > 0;
  const hasExportedPDF = user.pdf_exports_count > 0;

  if (!hasIntegration) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <LightbulbIcon className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              Take your automations to the next level
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Connect Zapier or Notion to deploy your blueprints instantly.
            </p>
            <Button size="sm" href="/dashboard/integrations">
              Connect Integration
            </Button>
          </div>
          <button className="text-blue-500 hover:text-blue-700">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  if (!hasExportedPDF) {
    return (
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
        <div className="flex items-start">
          <DocumentIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">
              Pro Tip: Export as PDF
            </h3>
            <p className="text-sm text-green-800 mb-2">
              Share your blueprints with clients or team members as professional PDFs.
            </p>
            <Button size="sm" href="/dashboard/blueprints">
              Try PDF Export
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
```

---

## Exit Survey

### Cancellation Flow

```tsx
// app/cancel/page.tsx
export default function CancelPage() {
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleCancel = async () => {
    // Save feedback
    await saveCancellationFeedback({
      reason,
      feedback,
      user_id: userId,
    });

    // Process cancellation
    await cancelSubscription(userId);

    // Redirect to confirmation
    router.push("/cancel/confirmed");
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        We're sorry to see you go
      </h1>
      <p className="text-gray-600 mb-8">
        Before you cancel, help us understand what went wrong so we can improve.
      </p>

      <div className="space-y-6">
        <div>
          <label className="block font-medium text-gray-900 mb-3">
            Why are you canceling?
          </label>
          <RadioGroup value={reason} onChange={setReason}>
            <Radio value="too_expensive">Too expensive</Radio>
            <Radio value="not_using">Not using it enough</Radio>
            <Radio value="missing_features">Missing features I need</Radio>
            <Radio value="too_complicated">Too complicated to use</Radio>
            <Radio value="switching">Switching to competitor</Radio>
            <Radio value="other">Other</Radio>
          </RadioGroup>
        </div>

        <div>
          <label className="block font-medium text-gray-900 mb-2">
            What could we have done better?
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            placeholder="Your honest feedback helps us improve..."
          />
        </div>

        {/* Retention Attempt */}
        {reason === "too_expensive" && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Wait - would a discount help?
            </h3>
            <p className="text-sm text-yellow-800 mb-4">
              We'd love to keep you. How about 30% off for the next 3 months?
            </p>
            <Button variant="primary" href="/apply-discount">
              Apply Discount & Stay
            </Button>
          </div>
        )}

        {reason === "not_using" && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              Would pausing help instead?
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              You can pause your subscription for up to 3 months instead of canceling.
            </p>
            <Button variant="primary" href="/pause-subscription">
              Pause Instead
            </Button>
          </div>
        )}

        <div className="flex gap-4">
          <Button variant="secondary" href="/dashboard">
            Never Mind, Keep Subscription
          </Button>
          <Button variant="danger" onClick={handleCancel}>
            Proceed with Cancellation
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Testing Steps

1. Create test Tier 2 user
2. Simulate low usage (no logins for 14 days)
3. Verify churn alert email sent
4. Test payment failure flow
5. Test cancellation flow and exit survey
6. Verify win-back email sent after cancellation

---

## Blockers

- Requires email automation platform
- Requires analytics/event tracking
- Requires Stripe subscription management

---

## Notes

- **Prevention is better than win-back**: Focus on onboarding and engagement
- **Personal touch matters**: Founder-written emails convert better than marketing copy
- **Track churn reasons**: Build features to address top cancellation reasons
- **LTV goal**: 12+ months average customer lifetime (12 × $99 = $1,188 LTV)

---

## Related Tasks

- TASK-009: Feature Gating (usage monitoring)
- TASK-012: Analytics Dashboard (churn metrics)
- TASK-006: Stripe Webhooks (payment failures)
