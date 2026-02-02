-- Migration: Add Multi-Tenant Isolation
-- Date: 2026-02-02
-- Description: Adds tenantId columns to all user-data tables for multi-tenant isolation

-- Add tenantId to User table (for future B2B multi-user tenants)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT '';

-- Add tenantId to Blueprint table
ALTER TABLE "Blueprint" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT '';

-- Add tenantId to UserSettings table
ALTER TABLE "UserSettings" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT '';

-- Add tenantId to SubscriptionHistory table
ALTER TABLE "SubscriptionHistory" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT '';

-- Create indexes for efficient tenant filtering
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "Blueprint_tenantId_idx" ON "Blueprint"("tenantId");
CREATE INDEX IF NOT EXISTS "Blueprint_userId_tenantId_idx" ON "Blueprint"("userId", "tenantId");
CREATE INDEX IF NOT EXISTS "UserSettings_tenantId_idx" ON "UserSettings"("tenantId");
CREATE INDEX IF NOT EXISTS "SubscriptionHistory_tenantId_idx" ON "SubscriptionHistory"("tenantId");
CREATE INDEX IF NOT EXISTS "SubscriptionHistory_userId_tenantId_idx" ON "SubscriptionHistory"("userId", "tenantId");

-- Update existing records to set tenantId = userId (B2C model)
UPDATE "User" SET "tenantId" = "id" WHERE "tenantId" = '';
UPDATE "Blueprint" SET "tenantId" = "userId" WHERE "tenantId" = '';
UPDATE "UserSettings" SET "tenantId" = "userId" WHERE "tenantId" = '';
UPDATE "SubscriptionHistory" SET "tenantId" = "userId" WHERE "tenantId" = '';

-- Enable Row-Level Security (PostgreSQL only)
ALTER TABLE "Blueprint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubscriptionHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UsageEvent" ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies (PostgreSQL only)
-- These policies ensure that users can only access their own data

-- Blueprint policy
CREATE POLICY IF NOT EXISTS "tenant_isolation_policy_blueprint" ON "Blueprint"
  USING ("tenantId" = current_setting('app.current_tenant')::text);

-- UserSettings policy
CREATE POLICY IF NOT EXISTS "tenant_isolation_policy_usersettings" ON "UserSettings"
  USING ("tenantId" = current_setting('app.current_tenant')::text);

-- SubscriptionHistory policy
CREATE POLICY IF NOT EXISTS "tenant_isolation_policy_subscriptionhistory" ON "SubscriptionHistory"
  USING ("tenantId" = current_setting('app.current_tenant')::text);

-- UsageEvent policy
CREATE POLICY IF NOT EXISTS "tenant_isolation_policy_usageevent" ON "UsageEvent"
  USING ("tenantId" = current_setting('app.current_tenant')::text);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON "Blueprint" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON "UserSettings" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON "SubscriptionHistory" TO PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON "UsageEvent" TO PUBLIC;
