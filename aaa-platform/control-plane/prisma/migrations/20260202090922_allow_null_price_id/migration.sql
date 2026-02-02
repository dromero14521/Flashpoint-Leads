-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SubscriptionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "oldTier" TEXT,
    "newTier" TEXT NOT NULL,
    "oldPriceId" TEXT,
    "newPriceId" TEXT,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_SubscriptionHistory" ("createdAt", "eventType", "id", "newPriceId", "newTier", "oldPriceId", "oldTier", "status", "stripeSubscriptionId", "userId") SELECT "createdAt", "eventType", "id", "newPriceId", "newTier", "oldPriceId", "oldTier", "status", "stripeSubscriptionId", "userId" FROM "SubscriptionHistory";
DROP TABLE "SubscriptionHistory";
ALTER TABLE "new_SubscriptionHistory" RENAME TO "SubscriptionHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
