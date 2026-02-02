/**
 * Feature Gating Middleware
 * Enforces tier-based access control and usage limits
 */

import { auth } from "@clerk/nextjs/server";
import { getUserTier, getUserTenantId } from "./clerk";
import {
  hasFeatureAccess,
  getRequiredTier,
  getTierDisplayName,
  FeatureLockedError,
  TierFeatures,
} from "./features";
import { requireUsageLimit, trackUsage, UsageAction } from "./usage-tracker";

/**
 * Require a specific feature to be enabled for the user
 * @param feature - Feature key to check
 * @throws FeatureLockedError if user doesn't have access
 */
export async function requireFeature(
  feature: keyof TierFeatures
): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  const tier = await getUserTier(userId);
  const hasAccess = hasFeatureAccess(tier, feature);

  if (!hasAccess) {
    const requiredTier = getRequiredTier(feature);
    const requiredTierName = requiredTier
      ? getTierDisplayName(requiredTier)
      : "higher tier";

    throw new FeatureLockedError(
      `This feature requires ${requiredTierName} or higher. Please upgrade your plan.`,
      requiredTier || "tier2",
      tier
    );
  }
}

/**
 * Require usage limit check for an action
 * @param action - Action to check
 * @throws UsageLimitError if user has reached their limit
 */
export async function requireUsage(action: UsageAction): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  const tier = await getUserTier(userId);
  await requireUsageLimit(userId, tier, action);
}

/**
 * Track usage for an action (call after successful action)
 * @param action - Action to track
 * @param metadata - Optional metadata
 */
export async function recordUsage(
  action: UsageAction,
  metadata?: Record<string, any>
): Promise<void> {
  const { userId } = await auth();

  if (!userId) {
    return; // Silent fail for unauthenticated users
  }

  try {
    const tenantId = await getUserTenantId(userId);
    await trackUsage(userId, tenantId, action, metadata);
  } catch (error) {
    // Log error but don't fail the request
    console.error("Failed to track usage:", error);
  }
}

/**
 * Combined check and track for actions with usage limits
 * Use this in API routes that consume usage quota
 * @param action - Action to check and track
 * @param metadata - Optional metadata
 */
export async function checkAndRecordUsage(
  action: UsageAction,
  metadata?: Record<string, any>
): Promise<void> {
  await requireUsage(action); // Check limit first
  await recordUsage(action, metadata); // Track usage after success
}

/**
 * Get user context for feature gating
 * @returns User context object
 */
export async function getUserContext(): Promise<{
  userId: string;
  tier: string;
  tenantId: string;
}> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }

  const tier = await getUserTier(userId);
  const tenantId = await getUserTenantId(userId);

  return { userId, tier, tenantId };
}

/**
 * Middleware helper to check feature access and return proper error response
 * Use this in API routes for consistent error handling
 */
export async function withFeatureGate(
  feature: keyof TierFeatures,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    await requireFeature(feature);
    return await handler();
  } catch (error) {
    if (error instanceof FeatureLockedError) {
      return Response.json(
        {
          error: error.message,
          requiredTier: error.requiredTier,
          currentTier: error.currentTier,
          upgrade_url: "/pricing",
        },
        { status: 403 } // Forbidden
      );
    }

    throw error;
  }
}

/**
 * Middleware helper to check usage limits and return proper error response
 * Use this in API routes for consistent error handling
 */
export async function withUsageGate(
  action: UsageAction,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    await requireUsage(action);
    const response = await handler();

    // Track usage after successful response
    await recordUsage(action);

    return response;
  } catch (error: any) {
    if (error.name === "UsageLimitError") {
      return Response.json(
        {
          error: error.message,
          action: error.action,
          limit: error.limit,
          used: error.used,
          upgrade_url: "/pricing",
        },
        { status: 429 } // Too Many Requests
      );
    }

    throw error;
  }
}

/**
 * Combined middleware for both feature and usage gating
 */
export async function withGate(
  feature: keyof TierFeatures,
  action: UsageAction,
  handler: () => Promise<Response>
): Promise<Response> {
  try {
    // Check feature access first
    await requireFeature(feature);

    // Then check usage limits
    await requireUsage(action);

    // Execute handler
    const response = await handler();

    // Track usage after success
    await recordUsage(action);

    return response;
  } catch (error: any) {
    if (error instanceof FeatureLockedError) {
      return Response.json(
        {
          error: error.message,
          requiredTier: error.requiredTier,
          currentTier: error.currentTier,
          upgrade_url: "/pricing",
        },
        { status: 403 }
      );
    }

    if (error.name === "UsageLimitError") {
      return Response.json(
        {
          error: error.message,
          action: error.action,
          limit: error.limit,
          used: error.used,
          upgrade_url: "/pricing",
        },
        { status: 429 }
      );
    }

    throw error;
  }
}
