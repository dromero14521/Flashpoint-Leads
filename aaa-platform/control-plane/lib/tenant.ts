/**
 * Multi-Tenant Context Management
 *
 * This module provides utilities for managing tenant isolation
 * in the AAA Platform. In our B2C model, each user is their own tenant.
 *
 * Security Model:
 * - tenantId is ALWAYS derived from authenticated session (Clerk userId)
 * - NEVER accept tenantId from client input
 * - All database queries MUST filter by tenantId
 * - Row-level security enforced at database level (PostgreSQL)
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Get the current tenant ID from the authenticated session
 *
 * @throws {Error} If user is not authenticated
 * @returns {Promise<string>} The tenant ID (same as userId in B2C model)
 */
export async function getTenantId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized: No tenant context");
  }

  // In B2C model: tenantId = userId
  // In future B2B model: lookup user's organization/team
  return userId;
}

/**
 * Get the current tenant ID or redirect to sign-in
 *
 * Use this in Server Components and Server Actions
 *
 * @returns {Promise<string>} The tenant ID
 */
export async function requireTenantId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
}

/**
 * Get optional tenant ID (returns null if not authenticated)
 *
 * Use this for public routes that may have optional auth
 *
 * @returns {Promise<string | null>} The tenant ID or null
 */
export async function getOptionalTenantId(): Promise<string | null> {
  const { userId } = await auth();
  return userId || null;
}

/**
 * Validate that a resource belongs to the current tenant
 *
 * @param resourceTenantId - The tenantId from the database record
 * @throws {Error} If resource doesn't belong to current tenant
 */
export async function validateTenantAccess(resourceTenantId: string): Promise<void> {
  const currentTenantId = await getTenantId();

  if (resourceTenantId !== String(currentTenantId)) {
    throw new Error("Forbidden: Resource belongs to different tenant");
  }
}

/**
 * Check if current user has access to a resource
 *
 * @param resourceTenantId - The tenantId from the database record
 * @returns {Promise<boolean>} True if user has access
 */
export async function hasTenantAccess(resourceTenantId: string): Promise<boolean> {
  try {
    const currentTenantId = await getTenantId();
    return resourceTenantId === String(currentTenantId);
  } catch {
    return false;
  }
}

/**
 * Create tenant context object for database operations
 *
 * @returns {Promise<object>} Object with tenantId for database inserts
 */
export async function getTenantContext(): Promise<{ tenantId: string }> {
  return {
    tenantId: await getTenantId(),
  };
}

/**
 * Middleware helper: Extract tenant ID from request headers
 *
 * Used by API routes to get tenant context
 *
 * @param headers - Request headers
 * @returns {string | null} The tenant ID or null
 */
export function getTenantIdFromHeaders(headers: Headers): string | null {
  return headers.get("X-Tenant-ID");
}

/**
 * Type-safe tenant filtering for Prisma queries
 *
 * Usage:
 * ```ts
 * const tenantId = await getTenantId();
 * const blueprints = await prisma.blueprint.findMany({
 *   where: withTenantFilter({ status: 'published' }, tenantId)
 * });
 * ```
 */
export function withTenantFilter<T extends Record<string, any>>(
  where: T,
  tenantId: string
): T & { tenantId: string } {
  return {
    ...where,
    tenantId,
  };
}

/**
 * Tenant-aware create helper
 *
 * Automatically injects tenantId into create operations
 *
 * Usage:
 * ```ts
 * const tenantId = await getTenantId();
 * const blueprint = await prisma.blueprint.create({
 *   data: withTenantData({
 *     industry: "SaaS",
 *     revenueGoal: "100k/mo"
 *   }, tenantId)
 * });
 * ```
 */
export function withTenantData<T extends Record<string, any>>(
  data: T,
  tenantId: string
): T & { tenantId: string } {
  return {
    ...data,
    tenantId,
  };
}

/**
 * Tenant isolation test helper
 *
 * For use in integration tests to verify tenant isolation
 *
 * @param tenantId - Override tenant ID (for testing only)
 */
export function setTenantIdForTesting(tenantId: string): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("setTenantIdForTesting can only be used in test environment");
  }

  // Store in global context for testing
  (global as any).__TEST_TENANT_ID__ = tenantId;
}

/**
 * Get test tenant ID (for testing only)
 */
export function getTestTenantId(): string | null {
  if (process.env.NODE_ENV !== "test") {
    return null;
  }

  return (global as any).__TEST_TENANT_ID__ || null;
}
