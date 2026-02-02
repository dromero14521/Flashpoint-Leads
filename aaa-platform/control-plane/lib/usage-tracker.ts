/**
 * Usage Tracking Service
 * Tracks user actions for feature gating and analytics
 */

import { prisma } from "./prisma";
import { SubscriptionTier } from "./clerk";
import { getFeatureLimit, UsageLimitError } from "./features";

export type UsageAction =
  | "blueprint"
  | "export_pdf"
  | "integration_deploy"
  | "api_call";

/**
 * Track a usage event
 * @param userId - Clerk user ID
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @param action - Action being tracked
 * @param metadata - Optional metadata (JSON)
 */
export async function trackUsage(
  userId: string,
  tenantId: string,
  action: UsageAction,
  metadata?: Record<string, any>
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  await prisma.usageEvent.create({
    data: {
      userId,
      tenantId,
      action,
      month: currentMonth,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Get monthly usage count for a specific action
 * @param userId - Clerk user ID
 * @param action - Action to count
 * @returns Number of times action was performed this month
 */
export async function getMonthlyUsage(
  userId: string,
  action: UsageAction
): Promise<number> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const count = await prisma.usageEvent.count({
    where: {
      userId,
      action,
      month: currentMonth,
    },
  });

  return count;
}

/**
 * Get usage for all actions this month
 * @param userId - Clerk user ID
 * @returns Object with action counts
 */
export async function getAllMonthlyUsage(
  userId: string
): Promise<Record<UsageAction, number>> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const events = await prisma.usageEvent.groupBy({
    by: ["action"],
    where: {
      userId,
      month: currentMonth,
    },
    _count: {
      action: true,
    },
  });

  const usage: Record<string, number> = {
    blueprint: 0,
    export_pdf: 0,
    integration_deploy: 0,
    api_call: 0,
  };

  events.forEach((event: any) => {
    usage[event.action] = event._count.action;
  });

  return usage as Record<UsageAction, number>;
}

/**
 * Check if user has reached their limit for an action
 * @param userId - Clerk user ID
 * @param userTier - User's subscription tier
 * @param action - Action to check
 * @returns true if limit reached
 */
export async function hasReachedLimit(
  userId: string,
  userTier: SubscriptionTier,
  action: UsageAction
): Promise<boolean> {
  // Map action to feature limit key
  const limit = getActionLimit(userTier, action);

  // Infinity means unlimited
  if (limit === Infinity || limit === 0) {
    return false;
  }

  // Get current usage
  const usage = await getMonthlyUsage(userId, action);

  return usage >= limit;
}

/**
 * Helper to get limit for a specific action
 */
function getActionLimit(tier: SubscriptionTier, action: UsageAction): number {
  if (action === "blueprint") {
    return getFeatureLimit(tier, "blueprint_limit");
  }
  // For other actions, check boolean feature access
  // If feature is enabled, return Infinity (unlimited)
  // If disabled, return 0
  return Infinity; // Default to unlimited for now
}

/**
 * Get remaining usage for an action
 * @param userId - Clerk user ID
 * @param userTier - User's subscription tier
 * @param action - Action to check
 * @returns Remaining usage count (Infinity if unlimited)
 */
export async function getRemainingUsage(
  userId: string,
  userTier: SubscriptionTier,
  action: UsageAction
): Promise<number> {
  const limit = getActionLimit(userTier, action);

  if (limit === Infinity || limit === 0) {
    return Infinity;
  }

  const usage = await getMonthlyUsage(userId, action);
  return Math.max(0, limit - usage);
}

/**
 * Get usage percentage for an action (for progress bars)
 * @param userId - Clerk user ID
 * @param userTier - User's subscription tier
 * @param action - Action to check
 * @returns Percentage (0-100), or null if unlimited
 */
export async function getUsagePercentage(
  userId: string,
  userTier: SubscriptionTier,
  action: UsageAction
): Promise<number | null> {
  const limit = getActionLimit(userTier, action);

  if (limit === Infinity || limit === 0) {
    return null; // Unlimited or disabled
  }

  const usage = await getMonthlyUsage(userId, action);
  return Math.min(100, (usage / limit) * 100);
}

/**
 * Check usage and throw error if limit reached
 * @param userId - Clerk user ID
 * @param userTier - User's subscription tier
 * @param action - Action to check
 * @throws UsageLimitError if limit reached
 */
export async function requireUsageLimit(
  userId: string,
  userTier: SubscriptionTier,
  action: UsageAction
): Promise<void> {
  const limit = getActionLimit(userTier, action);

  // If unlimited, allow
  if (limit === Infinity) {
    return;
  }

  // If disabled (0), deny
  if (limit === 0) {
    throw new UsageLimitError(
      `${action} is not available on your current plan. Please upgrade.`,
      action,
      0,
      0
    );
  }

  const usage = await getMonthlyUsage(userId, action);

  if (usage >= limit) {
    throw new UsageLimitError(
      `You've reached your monthly limit for ${action}. Upgrade to continue.`,
      action,
      limit,
      usage
    );
  }
}

/**
 * Get usage statistics for admin dashboard
 * @param userId - Clerk user ID (optional, omit for all users)
 * @returns Usage statistics
 */
export async function getUsageStats(userId?: string): Promise<{
  total: number;
  byAction: Record<UsageAction, number>;
  byMonth: Record<string, number>;
}> {
  const where = userId ? { userId } : {};

  const total = await prisma.usageEvent.count({ where });

  // Group by action
  const byActionData = await prisma.usageEvent.groupBy({
    by: ["action"],
    where,
    _count: { action: true },
  });

  const byAction: Record<string, number> = {
    blueprint: 0,
    export_pdf: 0,
    integration_deploy: 0,
    api_call: 0,
  };

  byActionData.forEach((item: any) => {
    byAction[item.action] = item._count.action;
  });

  // Group by month
  const byMonthData = await prisma.usageEvent.groupBy({
    by: ["month"],
    where,
    _count: { month: true },
  });

  const byMonth: Record<string, number> = {};
  byMonthData.forEach((item: any) => {
    byMonth[item.month] = item._count.month;
  });

  return {
    total,
    byAction: byAction as Record<UsageAction, number>,
    byMonth,
  };
}

/**
 * Reset usage for a user (for testing or manual overrides)
 * @param userId - Clerk user ID
 * @param action - Optional action to reset (omit for all)
 */
export async function resetUsage(
  userId: string,
  action?: UsageAction
): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7);

  await prisma.usageEvent.deleteMany({
    where: {
      userId,
      month: currentMonth,
      ...(action && { action }),
    },
  });
}

/**
 * Get usage history for a user
 * @param userId - Clerk user ID
 * @param limit - Maximum number of events to return
 * @returns Array of usage events
 */
export async function getUsageHistory(
  userId: string,
  limit: number = 50
): Promise<
  Array<{
    action: UsageAction;
    timestamp: Date;
    metadata: any;
  }>
> {
  const events = await prisma.usageEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      action: true,
      createdAt: true,
      metadata: true,
    },
  });

  return events.map((event: any) => ({
    action: event.action as UsageAction,
    timestamp: event.createdAt,
    metadata: event.metadata ? JSON.parse(event.metadata) : null,
  }));
}
