/**
 * Tenant-Aware Database Client
 *
 * This module provides a Prisma client wrapper with automatic tenant isolation.
 * All queries are automatically filtered by the current tenant's context.
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { getTenantId, getTestTenantId } from "./tenant";

// Prisma Client singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Tenant-Aware Prisma Client
 *
 * Automatically injects tenantId filtering into all queries
 *
 * Usage:
 * ```ts
 * import { tenantDb } from "@/lib/db";
 *
 * // All queries automatically filtered by current tenant
 * const blueprints = await tenantDb.blueprint.findMany();
 * const blueprint = await tenantDb.blueprint.findUnique({ where: { id: "123" } });
 * ```
 */
export const tenantDb = {
  /**
   * Blueprint operations with automatic tenant filtering
   */
  blueprint: {
    async findMany(args?: Prisma.BlueprintFindManyArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.blueprint.findMany({
        ...args,
        where: {
          ...args?.where,
          tenantId,
        },
      });
    },

    async findUnique(args: Prisma.BlueprintFindUniqueArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      const result = await prisma.blueprint.findUnique(args);

      // Verify tenant access
      if (result && result.tenantId !== tenantId) {
        throw new Error("Forbidden: Resource belongs to different tenant");
      }

      return result;
    },

    async findFirst(args?: Prisma.BlueprintFindFirstArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.blueprint.findFirst({
        ...args,
        where: {
          ...args?.where,
          tenantId,
        },
      });
    },

    async create(args: Prisma.BlueprintCreateArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.blueprint.create({
        ...args,
        data: {
          ...args.data,
          tenantId,
        },
      });
    },

    async update(args: Prisma.BlueprintUpdateArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());

      // First verify tenant access
      const existing = await prisma.blueprint.findUnique({
        where: args.where,
      });

      if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Forbidden: Resource belongs to different tenant");
      }

      return prisma.blueprint.update(args);
    },

    async delete(args: Prisma.BlueprintDeleteArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());

      // First verify tenant access
      const existing = await prisma.blueprint.findUnique({
        where: args.where,
      });

      if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Forbidden: Resource belongs to different tenant");
      }

      return prisma.blueprint.delete(args);
    },

    async count(args?: Prisma.BlueprintCountArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.blueprint.count({
        ...args,
        where: {
          ...args?.where,
          tenantId,
        },
      });
    },
  },

  /**
   * UsageEvent operations with automatic tenant filtering
   */
  usageEvent: {
    async findMany(args?: Prisma.UsageEventFindManyArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.usageEvent.findMany({
        ...args,
        where: {
          ...args?.where,
          tenantId,
        },
      });
    },

    async create(args: Prisma.UsageEventCreateArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.usageEvent.create({
        ...args,
        data: {
          ...args.data,
          tenantId,
        },
      });
    },

    async count(args?: Prisma.UsageEventCountArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.usageEvent.count({
        ...args,
        where: {
          ...args?.where,
          tenantId,
        },
      });
    },
  },

  /**
   * SubscriptionHistory operations with automatic tenant filtering
   */
  subscriptionHistory: {
    async findMany(args?: Prisma.SubscriptionHistoryFindManyArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.subscriptionHistory.findMany({
        ...args,
        where: {
          ...args?.where,
          tenantId,
        },
      });
    },

    async create(args: Prisma.SubscriptionHistoryCreateArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.subscriptionHistory.create({
        ...args,
        data: {
          ...args.data,
          tenantId,
        },
      });
    },
  },

  /**
   * UserSettings operations with automatic tenant filtering
   */
  userSettings: {
    async findUnique(args: Prisma.UserSettingsFindUniqueArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      const result = await prisma.userSettings.findUnique(args);

      // Verify tenant access
      if (result && result.tenantId !== tenantId) {
        throw new Error("Forbidden: Resource belongs to different tenant");
      }

      return result;
    },

    async create(args: Prisma.UserSettingsCreateArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());
      return prisma.userSettings.create({
        ...args,
        data: {
          ...args.data,
          tenantId,
        },
      });
    },

    async update(args: Prisma.UserSettingsUpdateArgs) {
      const tenantId = getTestTenantId() || (await getTenantId());

      // First verify tenant access
      const existing = await prisma.userSettings.findUnique({
        where: args.where,
      });

      if (!existing || existing.tenantId !== tenantId) {
        throw new Error("Forbidden: Resource belongs to different tenant");
      }

      return prisma.userSettings.update(args);
    },
  },

  /**
   * User operations (no tenant filtering needed - User IS the tenant)
   */
  user: prisma.user,

  /**
   * Non-tenant-specific models (admin/system data)
   */
  lead: prisma.lead,
  strategyCall: prisma.strategyCall,
  auditSubmission: prisma.auditSubmission,
  webhookEvent: prisma.webhookEvent,
};

/**
 * Direct Prisma client access for migrations and admin operations
 *
 * WARNING: Use with caution. Does NOT apply tenant filtering.
 * Only use for:
 * - Database migrations
 * - Admin operations
 * - System-level queries
 */
export { prisma as db };

export default prisma;
