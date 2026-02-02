# TASK-014: Build High-Ticket Sales Pipeline

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 5-6 Scale to $50k/mo
**Estimated Effort**: 6-8 hours
**Dependencies**: TASK-013
**Assigned To**: Unassigned

---

## Objective

Create a systematic pipeline for managing Tier 3 high-ticket prospects from initial booking through close and delivery, targeting 10+ conversions per month.

---

## Description

A high-ticket sales pipeline ensures no leads fall through the cracks. This task implements:
- Lead qualification criteria
- Pipeline stages (booked → qualified → proposed → closed → delivered)
- CRM or tracking system
- Payment collection workflow
- Delivery/fulfillment process

**Revenue Target**: 10 Tier 3 clients/month × $2,500 avg = $25,000/month

---

## Acceptance Criteria

- [ ] Lead qualification checklist implemented
- [ ] Pipeline stages defined with clear criteria
- [ ] CRM system set up (Airtable, Notion, or dedicated CRM)
- [ ] Automated email sequences for each stage
- [ ] Payment collection via Stripe with contract
- [ ] Delivery workflow documented
- [ ] Onboarding process for Tier 3 clients
- [ ] Success metrics dashboard (bookings, close rate, revenue)
- [ ] Documentation: `docs/TIER3-SALES-PIPELINE.md`

---

## Pipeline Stages

```
1. Lead Inquiry
   ↓
2. Questionnaire Submitted
   ↓
3. Session Booked (Calendly)
   ↓
4. Qualified (meets criteria)
   ↓
5. Session Conducted
   ↓
6. Proposal Sent
   ↓
7. Follow-up (Days 1, 3, 7)
   ↓
8. Closed (Payment Received)
   ↓
9. Blueprint Created
   ↓
10. Implementation Complete
   ↓
11. 30-Day Follow-up
```

---

## Lead Qualification Criteria

**Minimum Requirements** (to book strategy session):
- [ ] Annual revenue > $50k (or serious business intent)
- [ ] Clear pain point (not just "exploring")
- [ ] Budget authority (can make $2,500 decision)
- [ ] Timeline within 3 months
- [ ] Not a DIY-er (willing to pay for done-for-you service)

**Disqualify if**:
- Hobbyist or side project (no revenue)
- "Just looking for information" (tire-kicker)
- "I'll build it myself" mindset
- Unrealistic expectations (wants everything for $500)

---

## CRM Schema (Airtable Example)

### Leads Table

| Field | Type | Description |
|-------|------|-------------|
| Name | Text | Lead's full name |
| Email | Email | Contact email |
| Company | Text | Company name |
| Industry | Select | E-commerce, Services, etc. |
| Revenue | Select | $0-50k, $50k-100k, etc. |
| Pain Points | Long Text | From questionnaire |
| Cost of Pain | Number | Monthly $ loss calculated |
| Dream Outcome | Long Text | From questionnaire |
| Stage | Select | Booked, Qualified, Proposed, etc. |
| Session Date | Date | Calendly booking |
| Proposal Sent | Date | When proposal was emailed |
| Close Date | Date | When payment received |
| Amount | Currency | Deal value ($2,500, $5,000) |
| Status | Select | Active, Closed-Won, Closed-Lost |
| Notes | Long Text | Call notes, objections |

### Automation Rules

- **New questionnaire** → Create lead → Send booking confirmation
- **Session booked** → Update stage → Send pre-call email
- **Proposal sent** → Update stage → Schedule follow-up reminders
- **Payment received** → Update stage to "Closed" → Trigger onboarding
- **7 days no response** → Send final follow-up → Mark "Closed-Lost"

---

## Technical Implementation

### Lead Tracking Dashboard

```tsx
// app/admin/pipeline/page.tsx
export default async function PipelineDashboard() {
  const leads = await db.leads.findMany({
    where: { tier: "tier3" },
    orderBy: { created_at: "desc" },
  });

  const stats = {
    total_booked: leads.filter((l) => l.stage === "booked").length,
    total_qualified: leads.filter((l) => l.stage === "qualified").length,
    total_proposed: leads.filter((l) => l.stage === "proposed").length,
    total_closed: leads.filter((l) => l.status === "closed_won").length,
    close_rate:
      (leads.filter((l) => l.status === "closed_won").length /
        leads.filter((l) => l.stage !== "inquiry").length) *
      100,
    revenue_this_month: leads
      .filter((l) => l.status === "closed_won" && isThisMonth(l.close_date))
      .reduce((sum, l) => sum + l.amount, 0),
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Tier 3 Sales Pipeline</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Sessions Booked"
          value={stats.total_booked}
          icon={CalendarIcon}
        />
        <StatCard
          title="Proposals Sent"
          value={stats.total_proposed}
          icon={DocumentIcon}
        />
        <StatCard
          title="Closed This Month"
          value={stats.total_closed}
          icon={CheckCircleIcon}
        />
        <StatCard
          title="Revenue This Month"
          value={`$${stats.revenue_this_month.toLocaleString()}`}
          icon={CurrencyDollarIcon}
        />
      </div>

      {/* Pipeline Kanban Board */}
      <div className="grid grid-cols-5 gap-4">
        {[
          "Booked",
          "Qualified",
          "Proposed",
          "Negotiating",
          "Closed-Won",
        ].map((stage) => (
          <div key={stage} className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">{stage}</h3>
            <div className="space-y-3">
              {leads
                .filter((l) => l.stage === stage.toLowerCase())
                .map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Leads Table */}
      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{lead.name}</div>
                  <div className="text-sm text-gray-500">{lead.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.company}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StageBadge stage={lead.stage} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ${lead.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(lead.updated_at)} ago
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button size="sm" href={`/admin/pipeline/${lead.id}`}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Payment Collection Workflow

```typescript
// app/api/tier3/payment/route.ts
export async function POST(req: Request) {
  const { lead_id, amount, package_type } = await req.json();

  const lead = await db.leads.findUnique({ where: { id: lead_id } });

  // Create Stripe checkout session for one-time payment
  const session = await stripe.checkout.sessions.create({
    customer_email: lead.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Apex Implementation - ${package_type}`,
            description:
              "White-glove automation implementation with strategy session",
          },
          unit_amount: amount * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_URL}/tier3/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/tier3/proposal?lead_id=${lead_id}`,
    metadata: {
      lead_id,
      package_type,
      tier: "tier3",
    },
  });

  // Update lead stage
  await db.leads.update({
    where: { id: lead_id },
    data: {
      stage: "payment_pending",
      stripe_session_id: session.id,
    },
  });

  return Response.json({ checkout_url: session.url });
}
```

### Delivery Workflow

```markdown
## Tier 3 Delivery Process

### Phase 1: Blueprint Creation (Days 1-3)

1. Review questionnaire and call notes
2. Generate custom blueprint using AAA platform
3. Manually refine and enhance blueprint
4. Add industry-specific recommendations
5. Create visual workflow diagrams
6. Send blueprint PDF to client for review

### Phase 2: Implementation (Days 4-10)

1. Set up integrations (Zapier, Notion, etc.)
2. Configure automation workflows
3. Test all automations thoroughly
4. Create documentation and SOPs
5. Record Loom walkthrough videos

### Phase 3: Training (Days 11-12)

1. Schedule training call with client
2. Walk through all automations
3. Answer questions
4. Ensure client can use system independently

### Phase 4: 30-Day Support (Days 13-42)

1. Weekly check-in emails
2. Troubleshoot any issues
3. Optimize based on usage
4. Collect testimonial at end of 30 days
```

---

## Email Sequences

### Post-Proposal Sequence

**Day 0 (Immediately after call)**:
```
Subject: Your Custom Automation Roadmap

Hi [Name],

It was great speaking with you today! As discussed, here's a summary of what we'll deliver:

[Custom proposal details]

Investment: $2,500

Ready to get started? Click here to complete payment: [Stripe Link]

Once payment is complete, we'll begin immediately and have your system live within 2 weeks.

Any questions? Just reply to this email.

Best,
[Your Name]
```

**Day 1 (Follow-up)**:
```
Subject: Quick question about your automation project

Hi [Name],

Just wanted to make sure you received my proposal yesterday.

Do you have any questions about the roadmap or implementation process?

Also, I forgot to mention: We have limited availability this month. If you'd like to lock in your spot, I'd recommend moving forward in the next few days.

Let me know if you'd like to jump on a quick call to discuss anything.

Best,
[Your Name]
```

**Day 3 (Soft close)**:
```
Subject: Still interested in automating [pain point]?

Hi [Name],

I haven't heard back from you, so I wanted to check in.

I know $2,500 is an investment. Here's how I think about it:

You're currently losing $10,000/month to manual inefficiency. This is a one-time investment that solves that permanently.

You'll make back your investment in less than 2 weeks.

Does that make sense? Or is there something else holding you back?

Let me know - happy to answer any questions.

Best,
[Your Name]
```

**Day 7 (Final attempt)**:
```
Subject: Last call - Closing your file

Hi [Name],

I'm going to close your file unless I hear from you.

If now's not the right time, no worries - feel free to reach back out when you're ready.

But if you're still interested, let's move forward this week.

Best,
[Your Name]
```

---

## Success Metrics

Track these KPIs:

- **Booking Rate**: Website visitors → strategy sessions booked
- **Qualification Rate**: Bookings → qualified leads (target: 80%+)
- **Show Rate**: Booked sessions → actually showed up (target: 70%+)
- **Proposal Rate**: Sessions conducted → proposals sent (target: 90%+)
- **Close Rate**: Proposals sent → closed deals (target: 50%+)
- **Average Deal Size**: Target $2,500+
- **Time to Close**: Proposal sent → payment received (target: <7 days)

---

## Testing Steps

1. Create test lead in CRM
2. Move through each pipeline stage
3. Verify automation triggers at each stage
4. Test payment flow via Stripe
5. Conduct mock delivery with test client
6. Measure actual close rate vs target

---

## Blockers

- Requires CRM system (can start with Airtable/Notion)
- Requires email automation tool (Resend, SendGrid, or Loops)
- Requires founder availability for initial implementations (before delegation)

---

## Notes

- First 5 Tier 3 clients: Do delivery yourself to refine process
- Document everything for future delegation to implementation team
- Collect testimonials from every successful client
- Track time spent to price future packages accurately

---

## Related Tasks

- TASK-005: Stripe Products (payment collection)
- TASK-013: Sales Framework (strategy sessions)
- TASK-015: Tier 2 Retention (upsell Tier 2 users to Tier 3)
