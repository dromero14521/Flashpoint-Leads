-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCurrentPeriodEnd" DATETIME,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "referralCode" TEXT,
    "referredBy" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Blueprint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "revenueGoal" TEXT NOT NULL,
    "techStack" TEXT NOT NULL,
    "painPoints" TEXT NOT NULL,
    "strategicDiagnosis" TEXT,
    "proposedArchitecture" TEXT,
    "components" TEXT,
    "automationSteps" TEXT,
    "estimatedImpact" TEXT,
    "rawBlueprint" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Blueprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "weeklyDigest" BOOLEAN NOT NULL DEFAULT true,
    "defaultModel" TEXT NOT NULL DEFAULT 'anthropic/claude-3.5-sonnet',
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "company" TEXT,
    "industry" TEXT,
    "source" TEXT NOT NULL DEFAULT 'organic',
    "leadMagnet" TEXT,
    "estimatedRevenue" TEXT,
    "painPoints" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StrategyCall" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "company" TEXT,
    "phone" TEXT,
    "industry" TEXT NOT NULL,
    "revenue" TEXT,
    "teamSize" TEXT,
    "biggestChallenge" TEXT NOT NULL,
    "desiredOutcome" TEXT NOT NULL,
    "timeline" TEXT,
    "preferredDate" DATETIME,
    "preferredTime" TEXT,
    "timezone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "outcome" TEXT,
    "dealValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuditSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "monthlyRevenue" TEXT NOT NULL,
    "hoursOnManualTasks" INTEGER NOT NULL,
    "hourlyRate" REAL,
    "topPainPoints" TEXT NOT NULL,
    "currentTools" TEXT NOT NULL,
    "automationAttempts" TEXT,
    "annualCost" REAL,
    "potentialSavings" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stripeEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "oldTier" TEXT,
    "newTier" TEXT NOT NULL,
    "oldPriceId" TEXT,
    "newPriceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_stripeEventId_key" ON "WebhookEvent"("stripeEventId");
