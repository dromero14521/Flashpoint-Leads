-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "UsageEvent_userId_action_month_idx" ON "UsageEvent"("userId", "action", "month");

-- CreateIndex
CREATE INDEX "UsageEvent_tenantId_action_month_idx" ON "UsageEvent"("tenantId", "action", "month");
