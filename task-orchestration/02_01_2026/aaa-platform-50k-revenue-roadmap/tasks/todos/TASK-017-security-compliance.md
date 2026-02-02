# TASK-017: Security & Compliance

**Status**: TODO
**Priority**: HIGH
**Phase**: Month 1-6 (Ongoing)
**Estimated Effort**: 10-14 hours
**Dependencies**: TASK-002, TASK-016
**Assigned To**: Unassigned

---

## Objective

Implement security best practices, data encryption, audit logging, and compliance measures (GDPR, SOC 2 readiness) to protect customer data and build enterprise trust.

---

## Description

Security is non-negotiable for a SaaS platform handling sensitive business data. This task implements:
- Data encryption (at rest and in transit)
- Authentication security hardening
- Audit logging for compliance
- Privacy policy and terms of service
- GDPR compliance (data portability, right to deletion)
- Security headers and CSRF protection

**Strategic Goal**: Build trust for Tier 3 enterprise clients and comply with regulations

---

## Acceptance Criteria

- [ ] Data encryption at rest implemented (database)
- [ ] Data encryption in transit enforced (HTTPS, TLS 1.3)
- [ ] Sensitive data encrypted in application (credentials, API keys)
- [ ] Audit logging system implemented
- [ ] GDPR compliance features:
  - Data export (JSON download)
  - Account deletion (right to be forgotten)
  - Cookie consent banner
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] CSRF protection enabled
- [ ] Rate limiting on sensitive endpoints
- [ ] Input validation and sanitization
- [ ] Privacy policy and terms of service published
- [ ] Security incident response plan documented
- [ ] Penetration test conducted (or planned)
- [ ] Documentation: `docs/SECURITY-COMPLIANCE.md`

---

## Data Encryption

### Encryption at Rest (Database)

**PostgreSQL Encryption**:
```bash
# Enable transparent data encryption (TDE)
# Most cloud providers (Railway, AWS RDS) encrypt by default

# Verify encryption
SELECT name, setting FROM pg_settings WHERE name LIKE '%encrypt%';
```

**Application-Level Encryption** (for sensitive fields):
```typescript
// lib/encryption.ts
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, "hex"), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Usage: Encrypt integration credentials before storing
const encryptedToken = encrypt(oauthToken);
await db.integrations.create({
  tenant_id: userId,
  provider: "zapier",
  credentials: encryptedToken, // Encrypted in DB
});
```

### Encryption in Transit

**HTTPS/TLS Configuration**:
```nginx
# nginx.conf
ssl_protocols TLSv1.3 TLSv1.2;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;

# HSTS header
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

**API Calls**:
```typescript
// Always use HTTPS for external API calls
const response = await fetch("https://api.openrouter.ai/...", {
  // Never http://
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  },
});
```

---

## Authentication Security

### Password Security (Handled by Clerk)

Clerk provides:
- Bcrypt hashing
- Rate limiting on login attempts
- Account lockout after failed attempts
- Email verification
- MFA/2FA support (enable for Tier 3)

### Session Security

```typescript
// middleware.ts
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Session timeout: 7 days
  sessionClaims: {
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },

  // Refresh token rotation
  // Clerk handles this automatically
});
```

### API Key Management

```typescript
// For API access (Tier 2+)
// lib/api-keys.ts
import { randomBytes } from "crypto";

export function generateAPIKey(): string {
  // Format: aaa_live_[32 random chars]
  const random = randomBytes(16).toString("hex");
  return `aaa_live_${random}`;
}

export async function hashAPIKey(apiKey: string): Promise<string> {
  // Store hashed version in DB
  const hash = crypto.createHash("sha256").update(apiKey).digest("hex");
  return hash;
}

// Verify API key on request
export async function verifyAPIKey(apiKey: string): Promise<boolean> {
  const hash = await hashAPIKey(apiKey);
  const keyRecord = await db.apiKeys.findUnique({
    where: { key_hash: hash },
  });

  return !!keyRecord && keyRecord.status === "active";
}
```

---

## Audit Logging

### Compliance Audit Log

```typescript
// lib/audit-log.ts
export async function logAuditEvent(event: {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
}) {
  await db.auditLogs.create({
    data: {
      ...event,
      timestamp: new Date(),
    },
  });
}

// Example usage
await logAuditEvent({
  user_id: userId,
  action: "blueprint.generated",
  resource_type: "blueprint",
  resource_id: blueprintId,
  metadata: { industry: "ecommerce", prompt_version: "v1.2" },
  ip_address: req.headers.get("x-forwarded-for"),
});

await logAuditEvent({
  user_id: userId,
  action: "subscription.upgraded",
  resource_type: "subscription",
  metadata: { from_tier: "tier1", to_tier: "tier2" },
});

await logAuditEvent({
  user_id: userId,
  action: "data.exported",
  resource_type: "user_data",
  metadata: { format: "json" },
});
```

**Critical Events to Log**:
- User sign-up, sign-in, sign-out
- Password changes, email changes
- Subscription changes (upgrade, downgrade, cancel)
- Payment events
- Blueprint generation
- Integration connections
- Data exports
- Account deletion
- Admin actions

---

## GDPR Compliance

### Data Portability (Right to Access)

```typescript
// app/api/user/export/route.ts
import { auth } from "@clerk/nextjs";

export async function GET() {
  const { userId } = auth();

  // Gather all user data
  const userData = {
    profile: await db.users.findUnique({ where: { id: userId } }),
    blueprints: await db.blueprints.findMany({ where: { tenant_id: userId } }),
    subscriptions: await db.subscriptions.findMany({ where: { tenant_id: userId } }),
    integrations: await db.integrations.findMany({ where: { tenant_id: userId } }),
    audit_logs: await db.auditLogs.findMany({ where: { user_id: userId } }),
  };

  // Return as JSON download
  return new Response(JSON.stringify(userData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="my-aaa-data.json"',
    },
  });
}
```

### Right to Be Forgotten (Account Deletion)

```typescript
// app/api/user/delete/route.ts
export async function DELETE() {
  const { userId } = auth();

  // Log deletion request
  await logAuditEvent({
    user_id: userId,
    action: "account.deletion_requested",
    resource_type: "user",
  });

  // Delete user data (cascade)
  await db.blueprints.deleteMany({ where: { tenant_id: userId } });
  await db.subscriptions.deleteMany({ where: { tenant_id: userId } });
  await db.integrations.deleteMany({ where: { tenant_id: userId } });
  await db.auditLogs.deleteMany({ where: { user_id: userId } });

  // Delete Clerk user
  await clerkClient.users.deleteUser(userId);

  // Cancel Stripe subscription if active
  const subscription = await stripe.subscriptions.list({
    customer: stripeCustomerId,
  });
  if (subscription.data.length > 0) {
    await stripe.subscriptions.cancel(subscription.data[0].id);
  }

  return Response.json({ success: true });
}
```

### Cookie Consent Banner

```tsx
// components/CookieConsent.tsx
"use client";

import { useState, useEffect } from "react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setShowBanner(false);

    // Enable analytics
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
      });
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p className="text-sm">
          We use cookies to improve your experience and analyze site traffic.
          <a href="/privacy" className="underline ml-1">
            Learn more
          </a>
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowBanner(false)}
            className="text-sm text-gray-400 hover:text-white"
          >
            Decline
          </button>
          <button
            onClick={acceptCookies}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Security Headers

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});

// Usage in API route
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";

  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  // Proceed with request
}
```

---

## Input Validation & Sanitization

```typescript
// lib/validation.ts
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

export const BlueprintRequestSchema = z.object({
  industry: z.string().min(1).max(100),
  revenue_goal: z.string().min(1),
  tech_stack: z.array(z.string()).min(1).max(10),
  pain_points: z.string().min(10).max(2000),
});

export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input);
}

// Usage
const validated = BlueprintRequestSchema.parse(req.body);
const sanitized = sanitizeHTML(validated.pain_points);
```

---

## Privacy Policy & Terms

### Privacy Policy Outline

```markdown
# Privacy Policy

Last updated: [Date]

## 1. Information We Collect

- Account information (name, email)
- Usage data (blueprints generated, features used)
- Payment information (processed by Stripe)
- Integration credentials (encrypted)

## 2. How We Use Your Information

- Provide and improve our service
- Send service-related emails
- Process payments
- Comply with legal obligations

## 3. Data Sharing

We do NOT sell your data. We share data only with:
- Service providers (Stripe, Clerk, hosting)
- As required by law

## 4. Your Rights (GDPR)

- Access your data (download JSON export)
- Delete your data (account deletion)
- Opt-out of marketing emails

## 5. Data Security

- Encryption at rest and in transit
- Regular security audits
- Access controls

## 6. Contact

privacy@apexautomation.ai
```

---

## Security Incident Response Plan

### If Breach Detected

1. **Immediate Actions**:
   - Isolate affected systems
   - Revoke compromised credentials
   - Enable maintenance mode if needed

2. **Assessment** (within 24 hours):
   - Identify scope of breach
   - Determine data affected
   - Document timeline

3. **Notification** (within 72 hours):
   - Notify affected users
   - Report to authorities (if required by GDPR)
   - Prepare public statement

4. **Remediation**:
   - Patch vulnerability
   - Reset all API keys
   - Force password resets (if needed)

5. **Post-Incident**:
   - Conduct security audit
   - Update security policies
   - Train team on lessons learned

---

## Testing Steps

- [ ] Verify HTTPS enforced (no mixed content)
- [ ] Test data export (GDPR compliance)
- [ ] Test account deletion (right to be forgotten)
- [ ] Verify audit logs capture critical events
- [ ] Run security header scanner (securityheaders.com)
- [ ] Test rate limiting (automated requests)
- [ ] Penetration test (hire professional or use BugCrowd)

---

## Blockers

- Requires legal review for privacy policy and terms
- Penetration testing may require budget ($1,000-5,000)
- SOC 2 certification is expensive (defer until $1M+ ARR)

---

## Notes

- **Start with basics**: HTTPS, encryption, audit logs
- **Iterate on compliance**: Full SOC 2 is overkill for MVP
- **Get legal help**: Privacy policy and terms should be reviewed by lawyer
- **Insurance**: Consider cyber liability insurance once revenue scales

---

## Related Tasks

- TASK-002: Multi-Tenant Architecture (data isolation)
- TASK-016: Production Deployment (SSL, headers)
- TASK-001: Environment Configuration (secrets management)
