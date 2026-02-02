/**
 * Clerk Helper Functions
 * Manages user metadata for subscription tiers and multi-tenant isolation
 */

import { clerkClient, auth } from "@clerk/nextjs/server";

export type SubscriptionTier = "tier1" | "tier2" | "tier3";

export interface UserMetadata {
  subscription_tier: SubscriptionTier;
  tenant_id: string;
  onboarding_completed: boolean;
}

/**
 * Update user metadata in Clerk
 * @param userId - Clerk user ID
 * @param metadata - Metadata to update
 */
export async function updateUserMetadata(
  userId: string,
  metadata: Partial<UserMetadata>
) {
  const client = await clerkClient();

  await client.users.updateUserMetadata(userId, {
    publicMetadata: metadata,
  });
}

/**
 * Get user's subscription tier from Clerk metadata
 * @param userId - Clerk user ID (optional, uses current user if not provided)
 * @returns Subscription tier (defaults to tier1)
 */
export async function getUserTier(
  userId?: string
): Promise<SubscriptionTier> {
  let targetUserId = userId;

  if (!targetUserId) {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return "tier1"; // Default for unauthenticated
    }
    targetUserId = currentUserId;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(targetUserId);

  return (user.publicMetadata?.subscription_tier as SubscriptionTier) || "tier1";
}

/**
 * Get user's tenant ID from Clerk metadata
 * @param userId - Clerk user ID (optional, uses current user if not provided)
 * @returns Tenant ID (defaults to userId for single-tenant users)
 */
export async function getUserTenantId(userId?: string): Promise<string> {
  let targetUserId = userId;

  if (!targetUserId) {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      throw new Error("No authenticated user");
    }
    targetUserId = currentUserId;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(targetUserId);

  return (user.publicMetadata?.tenant_id as string) || targetUserId;
}

/**
 * Check if user has completed onboarding
 * @param userId - Clerk user ID (optional, uses current user if not provided)
 * @returns true if onboarding is completed
 */
export async function hasCompletedOnboarding(userId?: string): Promise<boolean> {
  let targetUserId = userId;

  if (!targetUserId) {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return false;
    }
    targetUserId = currentUserId;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(targetUserId);

  return user.publicMetadata?.onboarding_completed === true;
}

/**
 * Initialize new user metadata with defaults
 * @param userId - Clerk user ID
 * @param options - Optional initial values
 */
export async function initializeUserMetadata(
  userId: string,
  options?: {
    tier?: SubscriptionTier;
    tenantId?: string;
  }
) {
  await updateUserMetadata(userId, {
    subscription_tier: options?.tier || "tier1",
    tenant_id: options?.tenantId || userId,
    onboarding_completed: false,
  });
}

/**
 * Get complete user metadata
 * @param userId - Clerk user ID (optional, uses current user if not provided)
 * @returns UserMetadata object
 */
export async function getUserMetadata(userId?: string): Promise<UserMetadata> {
  let targetUserId = userId;

  if (!targetUserId) {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      throw new Error("No authenticated user");
    }
    targetUserId = currentUserId;
  }

  const client = await clerkClient();
  const user = await client.users.getUser(targetUserId);

  return {
    subscription_tier: (user.publicMetadata?.subscription_tier as SubscriptionTier) || "tier1",
    tenant_id: (user.publicMetadata?.tenant_id as string) || targetUserId,
    onboarding_completed: user.publicMetadata?.onboarding_completed === true,
  };
}

/**
 * Mark user onboarding as completed
 * @param userId - Clerk user ID (optional, uses current user if not provided)
 */
export async function completeOnboarding(userId?: string) {
  let targetUserId = userId;

  if (!targetUserId) {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      throw new Error("No authenticated user");
    }
    targetUserId = currentUserId;
  }

  await updateUserMetadata(targetUserId, {
    onboarding_completed: true,
  });
}

/**
 * Update user's subscription tier
 * @param userId - Clerk user ID
 * @param tier - New subscription tier
 */
export async function updateSubscriptionTier(
  userId: string,
  tier: SubscriptionTier
) {
  await updateUserMetadata(userId, {
    subscription_tier: tier,
  });
}
