/**
 * Tenant Isolation Tests
 *
 * These tests verify that the multi-tenant architecture properly isolates data
 * between tenants and prevents unauthorized access.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { prisma } from "@/lib/db";
import { setTenantIdForTesting } from "@/lib/tenant";
import { tenantDb } from "@/lib/db";

// Test data
const TENANT_A_ID = "user_test_tenant_a";
const TENANT_B_ID = "user_test_tenant_b";

describe("Tenant Isolation Tests", () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = "test";

    // Create test users (tenants)
    await prisma.user.upsert({
      where: { clerkId: TENANT_A_ID },
      create: {
        id: TENANT_A_ID,
        clerkId: TENANT_A_ID,
        email: "tenant-a@test.com",
        tenantId: TENANT_A_ID,
        tier: "tier2",
      },
      update: {},
    });

    await prisma.user.upsert({
      where: { clerkId: TENANT_B_ID },
      create: {
        id: TENANT_B_ID,
        clerkId: TENANT_B_ID,
        email: "tenant-b@test.com",
        tenantId: TENANT_B_ID,
        tier: "tier2",
      },
      update: {},
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.blueprint.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A_ID, TENANT_B_ID],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [TENANT_A_ID, TENANT_B_ID],
        },
      },
    });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up blueprints before each test
    await prisma.blueprint.deleteMany({
      where: {
        tenantId: {
          in: [TENANT_A_ID, TENANT_B_ID],
        },
      },
    });
  });

  describe("Blueprint Tenant Isolation", () => {
    test("should create blueprint with correct tenantId", async () => {
      setTenantIdForTesting(TENANT_A_ID);

      const blueprint = await tenantDb.blueprint.create({
        data: {
          userId: TENANT_A_ID,
          industry: "SaaS",
          revenueGoal: "100k/mo",
          techStack: JSON.stringify(["Next.js", "Stripe"]),
          painPoints: "Manual customer onboarding",
        },
      });

      expect(blueprint.tenantId).toBe(TENANT_A_ID);
      expect(blueprint.userId).toBe(TENANT_A_ID);
    });

    test("should only return blueprints for current tenant", async () => {
      // Create blueprints for both tenants
      await prisma.blueprint.create({
        data: {
          userId: TENANT_A_ID,
          tenantId: TENANT_A_ID,
          industry: "SaaS",
          revenueGoal: "100k/mo",
          techStack: "[]",
          painPoints: "Tenant A problem",
        },
      });

      await prisma.blueprint.create({
        data: {
          userId: TENANT_B_ID,
          tenantId: TENANT_B_ID,
          industry: "E-commerce",
          revenueGoal: "200k/mo",
          techStack: "[]",
          painPoints: "Tenant B problem",
        },
      });

      // Query as Tenant A
      setTenantIdForTesting(TENANT_A_ID);
      const tenantABlueprints = await tenantDb.blueprint.findMany();

      expect(tenantABlueprints).toHaveLength(1);
      expect(tenantABlueprints[0].tenantId).toBe(TENANT_A_ID);
      expect(tenantABlueprints[0].painPoints).toBe("Tenant A problem");

      // Query as Tenant B
      setTenantIdForTesting(TENANT_B_ID);
      const tenantBBlueprints = await tenantDb.blueprint.findMany();

      expect(tenantBBlueprints).toHaveLength(1);
      expect(tenantBBlueprints[0].tenantId).toBe(TENANT_B_ID);
      expect(tenantBBlueprints[0].painPoints).toBe("Tenant B problem");
    });

    test("should block access to other tenant's blueprints", async () => {
      // Create blueprint for Tenant A
      const blueprintA = await prisma.blueprint.create({
        data: {
          userId: TENANT_A_ID,
          tenantId: TENANT_A_ID,
          industry: "SaaS",
          revenueGoal: "100k/mo",
          techStack: "[]",
          painPoints: "Confidential data",
        },
      });

      // Try to access as Tenant B
      setTenantIdForTesting(TENANT_B_ID);

      await expect(
        tenantDb.blueprint.findUnique({
          where: { id: blueprintA.id },
        })
      ).rejects.toThrow("Forbidden: Resource belongs to different tenant");
    });

    test("should block update of other tenant's blueprints", async () => {
      // Create blueprint for Tenant A
      const blueprintA = await prisma.blueprint.create({
        data: {
          userId: TENANT_A_ID,
          tenantId: TENANT_A_ID,
          industry: "SaaS",
          revenueGoal: "100k/mo",
          techStack: "[]",
          painPoints: "Original data",
        },
      });

      // Try to update as Tenant B
      setTenantIdForTesting(TENANT_B_ID);

      await expect(
        tenantDb.blueprint.update({
          where: { id: blueprintA.id },
          data: {
            painPoints: "Hacked data",
          },
        })
      ).rejects.toThrow("Forbidden: Resource belongs to different tenant");
    });

    test("should block deletion of other tenant's blueprints", async () => {
      // Create blueprint for Tenant A
      const blueprintA = await prisma.blueprint.create({
        data: {
          userId: TENANT_A_ID,
          tenantId: TENANT_A_ID,
          industry: "SaaS",
          revenueGoal: "100k/mo",
          techStack: "[]",
          painPoints: "Important data",
        },
      });

      // Try to delete as Tenant B
      setTenantIdForTesting(TENANT_B_ID);

      await expect(
        tenantDb.blueprint.delete({
          where: { id: blueprintA.id },
        })
      ).rejects.toThrow("Forbidden: Resource belongs to different tenant");

      // Verify blueprint still exists
      const stillExists = await prisma.blueprint.findUnique({
        where: { id: blueprintA.id },
      });
      expect(stillExists).not.toBeNull();
    });

    test("should count only current tenant's blueprints", async () => {
      // Create 3 blueprints for Tenant A
      for (let i = 0; i < 3; i++) {
        await prisma.blueprint.create({
          data: {
            userId: TENANT_A_ID,
            tenantId: TENANT_A_ID,
            industry: "SaaS",
            revenueGoal: "100k/mo",
            techStack: "[]",
            painPoints: `Problem ${i}`,
          },
        });
      }

      // Create 2 blueprints for Tenant B
      for (let i = 0; i < 2; i++) {
        await prisma.blueprint.create({
          data: {
            userId: TENANT_B_ID,
            tenantId: TENANT_B_ID,
            industry: "E-commerce",
            revenueGoal: "200k/mo",
            techStack: "[]",
            painPoints: `Problem ${i}`,
          },
        });
      }

      // Count as Tenant A
      setTenantIdForTesting(TENANT_A_ID);
      const countA = await tenantDb.blueprint.count();
      expect(countA).toBe(3);

      // Count as Tenant B
      setTenantIdForTesting(TENANT_B_ID);
      const countB = await tenantDb.blueprint.count();
      expect(countB).toBe(2);
    });
  });

  describe("UsageEvent Tenant Isolation", () => {
    test("should create usage event with correct tenantId", async () => {
      setTenantIdForTesting(TENANT_A_ID);

      const event = await tenantDb.usageEvent.create({
        data: {
          userId: TENANT_A_ID,
          action: "blueprint",
          month: "2026-02",
          metadata: JSON.stringify({ test: true }),
        },
      });

      expect(event.tenantId).toBe(TENANT_A_ID);
    });

    test("should only count usage events for current tenant", async () => {
      // Create events for Tenant A
      for (let i = 0; i < 5; i++) {
        await prisma.usageEvent.create({
          data: {
            userId: TENANT_A_ID,
            tenantId: TENANT_A_ID,
            action: "blueprint",
            month: "2026-02",
          },
        });
      }

      // Create events for Tenant B
      for (let i = 0; i < 3; i++) {
        await prisma.usageEvent.create({
          data: {
            userId: TENANT_B_ID,
            tenantId: TENANT_B_ID,
            action: "blueprint",
            month: "2026-02",
          },
        });
      }

      // Count as Tenant A
      setTenantIdForTesting(TENANT_A_ID);
      const countA = await tenantDb.usageEvent.count({
        where: {
          action: "blueprint",
          month: "2026-02",
        },
      });
      expect(countA).toBe(5);

      // Count as Tenant B
      setTenantIdForTesting(TENANT_B_ID);
      const countB = await tenantDb.usageEvent.count({
        where: {
          action: "blueprint",
          month: "2026-02",
        },
      });
      expect(countB).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty tenantId gracefully", async () => {
      setTenantIdForTesting("");

      await expect(tenantDb.blueprint.findMany()).rejects.toThrow();
    });

    test("should handle invalid tenantId", async () => {
      setTenantIdForTesting("invalid_tenant_id");

      const blueprints = await tenantDb.blueprint.findMany();
      expect(blueprints).toHaveLength(0);
    });

    test("should not leak data through search queries", async () => {
      // Create blueprints with searchable content
      await prisma.blueprint.create({
        data: {
          userId: TENANT_A_ID,
          tenantId: TENANT_A_ID,
          industry: "SaaS",
          revenueGoal: "100k/mo",
          techStack: "[]",
          painPoints: "Secret keyword XYZ123",
        },
      });

      await prisma.blueprint.create({
        data: {
          userId: TENANT_B_ID,
          tenantId: TENANT_B_ID,
          industry: "E-commerce",
          revenueGoal: "200k/mo",
          techStack: "[]",
          painPoints: "Public keyword ABC456",
        },
      });

      // Search as Tenant B for Tenant A's secret keyword
      setTenantIdForTesting(TENANT_B_ID);
      const results = await tenantDb.blueprint.findMany({
        where: {
          painPoints: {
            contains: "XYZ123",
          },
        },
      });

      expect(results).toHaveLength(0);
    });
  });
});
