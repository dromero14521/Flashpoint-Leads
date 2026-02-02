# TASK-013: Implement "Hurt and Heal" Sales Framework

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 5-6 Scale to $50k/mo
**Estimated Effort**: 10-14 hours
**Dependencies**: TASK-010
**Assigned To**: Unassigned

---

## Objective

Implement the diagnostic questionnaire and strategy session booking system based on the GEMINI.md "Hurt and Heal" 11-step sales framework for converting high-ticket Tier 3 clients.

---

## Description

The "Hurt and Heal" methodology positions AAA as a doctor diagnosing business pain, not a salesperson. This task implements:
- Pre-session diagnostic questionnaire
- Strategy session booking with Calendly integration
- Call script/framework for founder-led sales
- Post-session follow-up automation

**Revenue Target**: 10 Tier 3 clients/month × $2,500 = $25,000/month

---

## Acceptance Criteria

- [ ] Diagnostic questionnaire page implemented
- [ ] Questionnaire captures:
  - Business context (industry, revenue, team size)
  - Current pain points
  - Monthly cost of pain (calculated)
  - Dream outcome (12-month vision)
  - Emotional drivers
- [ ] Calendly/Cal.com integration for booking
- [ ] Booking confirmation email with questionnaire answers
- [ ] Call script document based on 11-step framework
- [ ] Post-session follow-up sequence:
  - Day 0: Thank you email
  - Day 1: Proposal/quote sent
  - Day 3: Follow-up if no response
  - Day 7: Final follow-up
- [ ] CRM integration (optional: Airtable, Notion, or HubSpot)
- [ ] Payment collection via Stripe for accepted proposals
- [ ] Documentation: `docs/SALES-FRAMEWORK.md`

---

## Technical Implementation

### Diagnostic Questionnaire

```tsx
// app/book-session/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BookSessionPage() {
  const [formData, setFormData] = useState({
    // Business Context
    name: "",
    email: "",
    company: "",
    industry: "",
    revenue: "",
    team_size: "",

    // Pain Points
    current_situation: "",
    pain_points: "",
    manual_hours_per_week: 10,
    hourly_rate: 50,

    // Dreams & Drivers
    revenue_goal: "",
    dream_outcome: "",
    why_important: "",

    // Timeline
    urgency: "",
  });

  const monthlyCostOfPain =
    formData.manual_hours_per_week * formData.hourly_rate * 4;
  const annualCostOfPain = monthlyCostOfPain * 12;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Save questionnaire answers
    await fetch("/api/questionnaire", {
      method: "POST",
      body: JSON.stringify(formData),
    });

    // Redirect to Calendly with pre-filled data
    window.location.href = getCalendlyUrl(formData);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Book Your Strategy Session
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Before we meet, help us understand your business so we can provide the
        most value during our time together.
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Business Context */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            1. About Your Business
          </h2>

          <div className="space-y-4">
            <Input
              label="Your Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />

            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              label="Company Name"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            />

            <Select
              label="Industry"
              value={formData.industry}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
              options={[
                "E-commerce",
                "Professional Services",
                "SaaS",
                "Content Creation",
                "Real Estate",
                "Other",
              ]}
              required
            />

            <Select
              label="Annual Revenue"
              value={formData.revenue}
              onChange={(e) =>
                setFormData({ ...formData, revenue: e.target.value })
              }
              options={[
                "Pre-revenue",
                "$0-50k",
                "$50k-100k",
                "$100k-500k",
                "$500k-1M",
                "$1M+",
              ]}
              required
            />
          </div>
        </section>

        {/* Section 2: Pain Points */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            2. Current Challenges
          </h2>

          <TextArea
            label="What made you book this call now? What's not working?"
            value={formData.current_situation}
            onChange={(e) =>
              setFormData({ ...formData, current_situation: e.target.value })
            }
            rows={4}
            required
            placeholder="E.g., I'm spending 15 hours/week on manual data entry and it's preventing me from focusing on growth..."
          />

          <TextArea
            label="What are your biggest pain points with manual workflows?"
            value={formData.pain_points}
            onChange={(e) =>
              setFormData({ ...formData, pain_points: e.target.value })
            }
            rows={4}
            required
            placeholder="E.g., Lost leads, delayed responses, data errors..."
          />

          {/* Cost of Pain Calculator */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-red-900 mb-4">
              Let's calculate the cost of NOT automating:
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours spent on manual work per week
                </label>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={formData.manual_hours_per_week}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      manual_hours_per_week: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-600">
                  {formData.manual_hours_per_week} hours/week
                </div>
              </div>

              <Input
                label="Your hourly rate (or cost to hire)"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourly_rate: Number(e.target.value),
                  })
                }
                prefix="$"
                suffix="/hour"
              />

              <div className="bg-white border-2 border-red-400 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">
                  You're losing approximately
                </p>
                <p className="text-4xl font-bold text-red-600">
                  ${monthlyCostOfPain.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  per month (${annualCostOfPain.toLocaleString()}/year)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Dreams & Emotional Drivers */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            3. Your Vision
          </h2>

          <Input
            label="What's your revenue goal for 12 months from now?"
            value={formData.revenue_goal}
            onChange={(e) =>
              setFormData({ ...formData, revenue_goal: e.target.value })
            }
            placeholder="E.g., $500k/year"
            required
          />

          <TextArea
            label="Describe your ideal business 12 months from now"
            value={formData.dream_outcome}
            onChange={(e) =>
              setFormData({ ...formData, dream_outcome: e.target.value })
            }
            rows={4}
            required
            placeholder="E.g., Running on autopilot, all leads are qualified automatically, I have 20 extra hours per week for strategy..."
          />

          <TextArea
            label="Why is achieving this goal important to you personally?"
            value={formData.why_important}
            onChange={(e) =>
              setFormData({ ...formData, why_important: e.target.value })
            }
            rows={4}
            required
            placeholder="This is about uncovering the deeper 'why' - family time, financial freedom, proving something, etc."
            helpText="Be honest - there's no judgment here. Understanding your deeper motivation helps us serve you better."
          />
        </section>

        {/* Section 4: Urgency */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            4. Timeline
          </h2>

          <Select
            label="When do you want to have this automation in place?"
            value={formData.urgency}
            onChange={(e) =>
              setFormData({ ...formData, urgency: e.target.value })
            }
            options={[
              "ASAP (within 2 weeks)",
              "Within 1 month",
              "Within 3 months",
              "Just exploring",
            ]}
            required
          />
        </section>

        {/* Summary */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Here's what we'll cover in your strategy session:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>✅ Deep-dive into your specific pain points</li>
            <li>✅ Custom automation roadmap for your business</li>
            <li>✅ ROI calculation and timeline</li>
            <li>
              ✅ Tools and integrations recommendations
            </li>
            <li>✅ Pricing and implementation options</li>
          </ul>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Continue to Schedule Session
        </Button>
      </form>
    </div>
  );
}
```

### 11-Step Call Script

```markdown
<!-- docs/SALES-CALL-SCRIPT.md -->

# AAA Strategy Session Call Script

**Duration**: 60-90 minutes
**Objective**: Diagnose pain, present solution, close $2,500-5,000 deal

---

## Step 1: Open/Connect (5 min)

"Hey [Name], great to meet you! How's your day going?"

[Small talk: Weather, their location, something from their LinkedIn]

**Goal**: Put them at ease, build rapport

---

## Step 2: Take the Lead (2 min)

"Awesome. So here's how I'd like to structure our time together today:

1. First, I want to understand where you are now - your current situation
2. Then, we'll talk about where you want to be 12 months from now
3. Finally, if it makes sense, I'll share how we can bridge that gap

Sound good?"

**Goal**: Set expectations, demonstrate professionalism

---

## Step 3: Explore Motive (5 min)

"So I saw in your questionnaire that you're dealing with [pain point]. What made you decide to book this call NOW? Why not 6 months ago?"

[Listen for trigger event: Lost a big lead, hired someone to do it manually, had an error cost them money]

**Goal**: Identify the catalyst, understand urgency

---

## Step 4: Understand Context (10 min)

"Help me understand your business:
- Who's your ideal client?
- What does your sales process look like today?
- How are you currently handling [their pain point]?"

[Take notes on their tech stack, team, revenue]

**Goal**: Gather information for customized solution

---

## Step 5: Examine Pain (15 min)

**This is the most important step. Dig deep.**

"You mentioned you're spending 15 hours/week on manual data entry. How long have you been dealing with this?"

[Let them talk]

"What have you tried so far to solve this?"

[Establishes that DIY hasn't worked]

"How is this affecting your revenue? Have you lost deals because of slow response times?"

[Quantify the pain]

"On a scale of 1-10, how urgent is fixing this for you?"

[Gauge commitment]

**Goal**: Make the pain real and urgent. They should FEEL the cost.

---

## Step 6: Understand Dreams (10 min)

"Okay, let's shift gears. Forget about the pain for a second. What does success look like for you 12 months from now?"

[They'll describe their vision]

"And when you hit that $500k revenue goal, what changes for you personally?"

[Uncover personal stakes: Family time, financial security, proving doubters wrong]

**Goal**: Create contrast between painful present and ideal future

---

## Step 7: Dig Below the Surface (5 min)

"You said hitting $500k would let you spend more time with your kids. Why is that important to you?"

[This is the emotional driver. Listen carefully.]

**Goal**: Understand the deeper 'why' that will overcome price objections

---

## Step 8: Identify the Gap (5 min)

"So if I'm hearing you correctly:
- **Now**: You're spending 15 hours/week on manual work, losing $10k/month to inefficiency, stressed, no family time
- **Future**: You want to hit $500k, have automated systems, work 4-day weeks, be present for your kids

That gap - that's what's standing between you and the life you want. Does that resonate?"

[Pause. Let them sit with it.]

**Goal**: Clarify the cost of inaction

---

## Step 9: Professional Advice (2 min)

"Based on what you've shared, I have a clear picture of what you need. Would you like to hear how we can help you bridge that gap?"

[Always ask permission to pitch. They'll say yes.]

**Goal**: Transition to solution presentation

---

## Step 10: State the Offer (10 min)

"Here's what I recommend:

We'll do a full automation audit of your business and create a custom blueprint. Then, we'll implement it for you. This includes:

1. **Strategy Session Follow-Up**: I'll create a detailed automation roadmap specific to your business
2. **Custom Blueprint**: Our AI will generate a bespoke workflow tailored to your tech stack
3. **Implementation**: We'll set up the integrations (Zapier, Notion, whatever you're using)
4. **Training**: We'll train you and your team on how to use it
5. **30-Day Support**: We'll check in weekly for the first month to ensure it's working

The result? You'll get back those 15 hours/week, stop losing $10k/month, and have the automated system you need to hit $500k.

Timeline: Implemented within 2 weeks.

Any questions so far?"

**Goal**: Paint a clear picture of the transformation

---

## Step 11: The Close (5 min)

"The investment for this is $2,500."

[**SILENCE. Do not speak. Let them process.**]

[They'll either:
- Accept: "That sounds great, how do we get started?"
- Object: "That's more than I expected..."]

**If they accept**:
"Awesome. I'll send you a Stripe payment link right now and we'll get started this week."

**If they object**:
"I hear you. Let me ask: Is the price the only thing holding you back? If the price was $0, would you move forward?"

[If yes: "So it's not whether this will work, it's about affordability?"]

[If no: "What else is making you hesitate?"]

**Reframe**:
"You're currently losing $10,000 per month. This is a $2,500 one-time investment that solves that problem permanently. You'll make back your investment in less than 2 weeks. Does that make sense?"

[If still hesitant]:
"Fair enough. What if we started smaller? We could do just the blueprint for $500, and if you love it, we can talk about full implementation."

**Goal**: Close the deal or get a commitment to next steps

---

## Post-Call Actions

- Send proposal/quote via email within 2 hours
- Include Stripe payment link
- Set follow-up reminder for 24 hours if no response
- Add to CRM with notes from call
```

---

## Calendly Integration

```typescript
// lib/calendly.ts
export function getCalendlyUrl(formData: QuestionnaireData): string {
  const params = new URLSearchParams({
    name: formData.name,
    email: formData.email,
    a1: formData.company, // Custom answer 1
    a2: formData.industry, // Custom answer 2
    a3: formData.pain_points, // Custom answer 3
  });

  return `https://calendly.com/your-account/strategy-session?${params.toString()}`;
}
```

---

## Post-Session Follow-Up Automation

```typescript
// app/api/session-followup/route.ts
export async function POST(req: Request) {
  const { email, name, sessionDate } = await req.json();

  // Day 0: Thank you email
  await sendEmail({
    to: email,
    template: "session_thank_you",
    data: { name },
  });

  // Schedule Day 1: Proposal
  await scheduleEmail({
    to: email,
    template: "session_proposal",
    data: { name, proposalUrl: "/proposal/abc123" },
    sendAt: addDays(sessionDate, 1),
  });

  // Schedule Day 3: Follow-up
  await scheduleEmail({
    to: email,
    template: "session_followup",
    data: { name },
    sendAt: addDays(sessionDate, 3),
  });

  // Schedule Day 7: Final follow-up
  await scheduleEmail({
    to: email,
    template: "session_final_followup",
    data: { name },
    sendAt: addDays(sessionDate, 7),
  });
}
```

---

## Testing Steps

1. Complete diagnostic questionnaire as test user
2. Book strategy session via Calendly
3. Receive confirmation email with questionnaire answers
4. Conduct mock strategy session using script
5. Send proposal via Stripe
6. Track follow-up emails received

---

## Blockers

- Requires Calendly/Cal.com account
- Requires email service (Resend, SendGrid, or Postmark)
- Requires founder availability for initial calls (before delegation)

---

## Notes

- **Practice the script**: Role-play with a friend before real calls
- **Record calls** (with permission): Review to improve
- **Track close rate**: Aim for 50%+ (bookings → purchases)
- **Qualify leads**: Only book calls with serious prospects (annual revenue >$50k)

---

## Related Tasks

- TASK-005: Stripe Products (payment collection)
- TASK-010: Landing Page (strategy session CTA)
- TASK-014: High-Ticket Sales Pipeline
