# Wise API Technical Reference

**For:** Backend developers implementing Wise payment integration
**Last Updated:** 2026-03-14
**API Version:** Wise v1 REST API

---

## Quick Start

### 1. Installation

```bash
npm install --save-exact wise-api
# OR if using specific package
npm install --save-exact @wise/api
```

### 2. Authentication

```typescript
import Wise from 'wise-api';

const wise = new Wise({
  token: process.env.WISE_API_KEY,
  sandbox: process.env.NODE_ENV !== 'production'
});
```

### 3. Create Payment Link

```typescript
const paymentLink = await wise.paymentLinks.create({
  sourceAmount: 99.00,
  sourceCurrency: 'USD',
  targetCurrency: 'USD',
  customerEmail: user.email,
  externalId: `user_${user.id}_${Date.now()}`, // Unique reference
  redirectUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
  metadata: {
    userId: user.id,
    tier: 'tier2'
  }
});

console.log(paymentLink.url); // https://wise.com/pay/...
```

---

## API Endpoints Reference

### Payment Links (Hosted Checkout)

**Create Payment Link**
```
POST /v1/payment-links
Headers:
  Authorization: Bearer {API_TOKEN}
  Content-Type: application/json

Request:
{
  "sourceAmount": 99.00,
  "sourceCurrency": "USD",
  "targetCurrency": "USD",
  "customerEmail": "user@example.com",
  "externalId": "user_123_1710419520",
  "redirectUrl": "https://myapp.com/dashboard?success=true",
  "metadata": {
    "userId": "user_123",
    "tier": "tier2"
  }
}

Response:
{
  "id": "plnk_1234567890",
  "url": "https://wise.com/pay/plnk_1234567890",
  "status": "CREATED",
  "createdAt": "2026-03-14T10:30:00Z",
  "expiresAt": "2026-03-15T10:30:00Z"
}
```

**Get Payment Link**
```
GET /v1/payment-links/{linkId}
Headers:
  Authorization: Bearer {API_TOKEN}

Response:
{
  "id": "plnk_1234567890",
  "status": "COMPLETED", // or CREATED, EXPIRED, CANCELLED, FAILED
  "url": "https://wise.com/pay/plnk_1234567890",
  "sourceAmount": 99.00,
  "targetAmount": 99.00,
  "transfer": {
    "id": "trnf_1234567890",
    "status": "completed",
    "rate": 1.00,
    "fee": 0.51,
    "amountSent": 99.00,
    "amountReceived": 98.49
  },
  "externalId": "user_123_1710419520",
  "createdAt": "2026-03-14T10:30:00Z",
  "completedAt": "2026-03-14T10:35:00Z"
}
```

### Transfers (Server-Side Only)

**Get Transfer**
```
GET /v1/transfers/{transferId}
Headers:
  Authorization: Bearer {API_TOKEN}

Response:
{
  "id": "trnf_1234567890",
  "status": "completed", // pending, completed, cancelled, failed
  "referenceNumber": "TX123456789",
  "sourceCurrency": "USD",
  "targetCurrency": "USD",
  "sourceAmount": 99.00,
  "targetAmount": 98.49,
  "rate": 1.00,
  "fee": {
    "total": 0.51,
    "breakdown": [
      {
        "name": "Payment processing fee",
        "value": 0.51
      }
    ]
  },
  "recipient": {
    "id": "rcpt_123",
    "type": "bank_account",
    "details": {
      "accountNumber": "****5678",
      "bankCode": "****",
      "currency": "USD"
    }
  },
  "details": {
    "reference": "Payment for Architect Plan",
    "transferPurpose": "subscription_payment",
    "source": "business_software"
  },
  "created": "2026-03-14T10:30:00Z",
  "updated": "2026-03-14T10:35:00Z"
}
```

### Quotes

**Get Quote**
```
GET /v1/quotes?sourceCurrency=USD&targetCurrency=USD&sourceAmount=99
Headers:
  Authorization: Bearer {API_TOKEN}

Response:
{
  "id": "quote_1234567890",
  "sourceCurrency": "USD",
  "targetCurrency": "USD",
  "sourceAmount": 99.00,
  "targetAmount": 98.49,
  "rate": 1.00,
  "fee": 0.51,
  "rateType": "FIXED",
  "validUntil": "2026-03-14T10:35:00Z",
  "paymentOptions": [
    {
      "formattedEstimatedDelivery": "by 2026-03-15",
      "estimatedDeliveryDays": 1
    }
  ]
}
```

---

## Webhook Events

### Event Structure

```json
{
  "id": "evt_1234567890",
  "type": "transfer.completed",
  "createdAt": "2026-03-14T10:35:00Z",
  "data": {
    "transfer": {
      "id": "trnf_1234567890",
      "status": "completed",
      "externalId": "user_123_1710419520",
      "sourceAmount": 99.00,
      "fee": 0.51,
      "rate": 1.00,
      "metadata": {
        "userId": "user_123",
        "tier": "tier2"
      }
    }
  }
}
```

### Event Types

| Event Type | Trigger | Data Available |
|-----------|---------|-----------------|
| `transfer.created` | Payment link created | transfer.id, sourceAmount |
| `transfer.pending` | Payment processing | transfer.id, status |
| `transfer.completed` | Payment successful | transfer.id, targetAmount, fee, rate |
| `transfer.failed` | Payment failed | transfer.id, status, failureReason |
| `transfer.refunded` | Payment refunded | transfer.id, refund details |
| `payment-link.expired` | Link timed out | link.id, expirationTime |

### Webhook Signature Verification

**Header:** `x-wise-signature`

**Algorithm:** HMAC-SHA256

```typescript
import crypto from 'crypto';

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return hash === signature;
}
```

**Example Implementation:**
```typescript
// In /app/api/webhooks/wise/route.ts
const body = await request.text();
const signature = headers().get('x-wise-signature');
const secret = process.env.WISE_WEBHOOK_SECRET;

if (!verifyWebhookSignature(body, signature, secret)) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}

const event = JSON.parse(body);
// Process event...
```

---

## Error Codes & Handling

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process normally |
| 400 | Bad request | Validate input, retry with fix |
| 401 | Unauthorized | Check API key |
| 403 | Forbidden | Check permissions |
| 404 | Not found | Verify ID exists |
| 409 | Conflict | Resource already exists, check idempotency |
| 429 | Too many requests | Implement exponential backoff |
| 500 | Server error | Retry with exponential backoff |
| 503 | Service unavailable | Retry later |

### Common Error Responses

```json
{
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Source account does not have sufficient funds",
    "details": {
      "availableAmount": 50.00,
      "requestedAmount": 99.00
    }
  }
}
```

**Common Error Codes:**
- `INVALID_AMOUNT` - Amount too small, too large, or invalid
- `UNSUPPORTED_CURRENCY` - Currency pair not supported
- `INVALID_EMAIL` - Customer email invalid
- `PAYMENT_METHOD_DECLINED` - Card/payment failed
- `RATE_EXPIRED` - Exchange rate quote expired
- `DUPLICATE_EXTERNAL_ID` - Reference ID already used
- `RECIPIENT_ACCOUNT_CLOSED` - Destination account invalid
- `INSUFFICIENT_FUNDS` - Not enough balance

### Error Handling Pattern

```typescript
try {
  const link = await wise.paymentLinks.create({...});
} catch (error) {
  if (error.code === 'INVALID_AMOUNT') {
    return NextResponse.json(
      { error: 'Amount must be between $1 and $1,000,000' },
      { status: 400 }
    );
  } else if (error.code === 'RATE_EXPIRED') {
    return NextResponse.json(
      { error: 'Exchange rate expired. Please try again.' },
      { status: 400 }
    );
  } else if (error.code === 'DUPLICATE_EXTERNAL_ID') {
    // Already created, return existing link
    const existing = await wise.paymentLinks.get(error.existingLinkId);
    return NextResponse.json({ url: existing.url });
  } else {
    console.error('Wise API error:', error);
    return NextResponse.json(
      { error: 'Payment setup failed. Please try again.' },
      { status: 500 }
    );
  }
}
```

---

## Implementation Patterns

### Pattern 1: Create Checkout Session

```typescript
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { createPaymentLink } from '@/lib/wise';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { tier } = await request.json();

    // Get user
    let user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      // Create user if not exists
      const clerkUser = await currentUser();
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        }
      });
    }

    // Map tier to amount
    const amounts = {
      tier2: 99.00,
      architect: 99.00,
      tier3: 2500.00,
      apex: 2500.00
    };

    const amount = amounts[tier as keyof typeof amounts];
    if (!amount) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Create payment link
    const returnUrl = `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&transfer_id={TRANSFER_ID}`;
    const paymentLink = await createPaymentLink({
      amount,
      reference: `user_${user.id}_${Date.now()}`,
      returnUrl,
      metadata: {
        userId: user.id,
        tier,
        email: user.email
      }
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
```

### Pattern 2: Process Webhook

```typescript
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/wise';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get('x-wise-signature');

    // Verify signature
    if (!verifyWebhookSignature(body, signature, process.env.WISE_WEBHOOK_SECRET!)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Prevent duplicate processing
    const existing = await prisma.webhookEvent.findUnique({
      where: { wiseEventId: event.id }
    });

    if (existing?.processed) {
      console.log(`Webhook ${event.id} already processed`);
      return NextResponse.json({ received: true });
    }

    // Create event record
    await prisma.webhookEvent.upsert({
      where: { wiseEventId: event.id },
      create: {
        wiseEventId: event.id,
        eventType: event.type,
        processed: false
      },
      update: { attempts: { increment: 1 } }
    });

    // Handle event
    if (event.type === 'transfer.completed') {
      const { transfer } = event.data;
      const user = await prisma.user.findFirst({
        where: { id: transfer.metadata.userId }
      });

      if (!user) {
        throw new Error(`User not found: ${transfer.metadata.userId}`);
      }

      // Update user tier
      const newTier = transfer.metadata.tier;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          tier: newTier,
          wiseTransferId: transfer.id,
          wiseAmountUSD: transfer.sourceAmount.toString(),
          wisePaidAt: new Date()
        }
      });

      // Update Clerk metadata
      if (user.clerkId) {
        await updateSubscriptionTier(user.clerkId, newTier);
      }

      console.log(`User ${user.id} upgraded to ${newTier}`);
    } else if (event.type === 'transfer.failed') {
      console.error(`Payment failed for transfer: ${event.data.transfer.id}`);
      // Optionally notify user
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { wiseEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date()
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

### Pattern 3: Wise Library Wrapper

```typescript
// lib/wise.ts

import Wise from 'wise-api';
import crypto from 'crypto';

let wiseInstance: InstanceType<typeof Wise> | null = null;

export function getWise() {
  if (!wiseInstance) {
    if (!process.env.WISE_API_KEY) {
      throw new Error('WISE_API_KEY not configured');
    }

    wiseInstance = new Wise({
      token: process.env.WISE_API_KEY,
      sandbox: process.env.NODE_ENV !== 'production'
    });
  }

  return wiseInstance;
}

export async function createPaymentLink({
  amount,
  reference,
  returnUrl,
  metadata = {}
}: {
  amount: number;
  reference: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}) {
  const wise = getWise();

  const response = await wise.paymentLinks.create({
    sourceAmount: amount,
    sourceCurrency: 'USD',
    targetCurrency: 'USD',
    externalId: reference,
    redirectUrl: returnUrl,
    metadata
  });

  return {
    url: response.url,
    linkId: response.id,
    expiresAt: response.expiresAt
  };
}

export async function getQuote(
  sourceCurrency: string,
  targetCurrency: string,
  sourceAmount: number
) {
  const wise = getWise();

  const response = await wise.quotes.get({
    sourceCurrency,
    targetCurrency,
    sourceAmount
  });

  return {
    rate: response.rate,
    fee: response.fee,
    targetAmount: response.targetAmount,
    validUntil: response.validUntil
  };
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string = process.env.WISE_WEBHOOK_SECRET!
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return hash === signature;
}

export async function getTransfer(transferId: string) {
  const wise = getWise();

  const response = await wise.transfers.get(transferId);

  return {
    id: response.id,
    status: response.status,
    sourceAmount: response.sourceAmount,
    targetAmount: response.targetAmount,
    fee: response.fee.total,
    rate: response.rate,
    createdAt: response.created,
    completedAt: response.updated
  };
}
```

---

## Testing & Sandbox

### Sandbox Credentials

**API Endpoint:** `https://api.sandbox.wise.com`

**Test Cards:**
- Visa: `4242 4242 4242 4242` (any future expiry, any CVC)
- Mastercard: `5200 0222 3010 9903` (any future expiry, any CVC)
- Failed: `4000 0000 0000 0002` (always fails)

**Webhook Testing:**
- Use Wise webhook simulator in sandbox dashboard
- Or use ngrok tunnel: `ngrok http 3000` → configure webhook URL in Wise dashboard

### Mock Webhook Event

```json
{
  "id": "evt_sandbox_123456",
  "type": "transfer.completed",
  "createdAt": "2026-03-14T10:35:00Z",
  "data": {
    "transfer": {
      "id": "trnf_sandbox_123456",
      "status": "completed",
      "externalId": "user_123_1710419520",
      "sourceAmount": 99.00,
      "targetAmount": 98.49,
      "fee": 0.51,
      "rate": 1.00,
      "metadata": {
        "userId": "user_123",
        "tier": "tier2"
      }
    }
  }
}
```

---

## Rate Limits & Quotas

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /payment-links | 100 | Per minute |
| GET /payment-links | 1000 | Per minute |
| GET /transfers | 1000 | Per minute |
| POST /transfers | 100 | Per minute |
| Webhooks | Unlimited | - |

**Backoff Strategy for Rate Limit:**
```typescript
async function callWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Data Models for Database

### User Table (Wise Fields)

```prisma
model User {
  id String @id @default(cuid())
  clerkId String @unique
  email String
  tier String @default("tier1") // tier1, tier2, tier3

  // Wise payment fields
  wiseRecipientId String? // If using bank account management
  wiseTransferId String? // Latest transfer ID
  wiseAmountUSD String? // Amount paid (for records)
  wisePaidAt DateTime? // Payment completion date

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WebhookEvent {
  id String @id @default(cuid())
  wiseEventId String @unique
  eventType String // transfer.completed, transfer.failed, etc.
  processed Boolean @default(false)
  processedAt DateTime?
  attempts Int @default(1)
  lastError String?

  createdAt DateTime @default(now())
}

model SubscriptionHistory {
  id String @id @default(cuid())
  userId String
  wiseTransferId String?
  oldTier String?
  newTier String
  eventType String // subscription_created, payment_completed, etc.
  status String

  createdAt DateTime @default(now())
}
```

---

## Common Implementation Questions

**Q: How do I handle currency conversion?**
A: Wise handles USD→USD (no conversion needed for now). If adding multi-currency, use the quote endpoint to get real-time rates.

**Q: What if webhook delivery fails?**
A: Implement a webhook retry mechanism. Wise will retry failed webhooks 5 times with exponential backoff.

**Q: How do I prevent duplicate payments?**
A: Use idempotency key (reference ID) and check WebhookEvent table before processing.

**Q: Can I refund payments?**
A: Yes, implement refund endpoint using `wise.transfers.refund()` API.

**Q: How do I handle subscription renewals?**
A: Wise doesn't support recurring payments. Trigger a new payment link on renewal date via background job.

**Q: What if the payment link expires before user completes payment?**
A: Generate a new link on retry. Valid for 24 hours by default.

---

## Monitoring & Observability

### Key Metrics to Track

```typescript
// In your monitoring system
metrics.track('payment_link_created', {
  tier: 'tier2',
  amount: 99.00,
  duration_ms: responseTime
});

metrics.track('webhook_received', {
  event_type: 'transfer.completed',
  user_id: userId,
  processed_at_ms: processingTime
});

metrics.track('payment_failed', {
  reason: 'card_declined',
  error_code: 'PAYMENT_METHOD_DECLINED'
});
```

### Alerting Rules

- **Alert if:** Payment link creation fails 10x in 5 minutes
- **Alert if:** Webhook processing fails 5x in 5 minutes
- **Alert if:** Webhook delay > 1 minute
- **Alert if:** Transfer status = "failed" for more than 1% of payments

---

## Deployment Checklist

Before deploying to production:

- [ ] Verify WISE_API_KEY is set correctly in environment
- [ ] Verify WISE_WEBHOOK_SECRET matches Wise dashboard
- [ ] Configure webhook URL in Wise dashboard: `{your-domain}/api/webhooks/wise`
- [ ] Test webhook delivery with simulator
- [ ] Verify database migration ran successfully
- [ ] Test full payment flow in sandbox
- [ ] Verify error handling for all Wise error codes
- [ ] Enable production Wise API keys (remove sandbox mode)
- [ ] Monitor first 24 hours for issues

---

## Support & Resources

- **Wise API Docs:** https://wise.com/api
- **Wise Dashboard:** https://dashboard.wise.com
- **Sandbox:** https://sandbox.wise.com
- **Status Page:** https://status.wise.com

