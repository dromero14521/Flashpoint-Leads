import prisma from "@/lib/prisma";

interface DashboardStats {
  // Revenue
  mrr: number;
  mrrGrowth: number;
  
  // Users
  totalUsers: number;
  newUsersThisMonth: number;
  
  // Blueprints
  totalBlueprints: number;
  blueprintsThisMonth: number;
  
  // Conversions
  conversionRate: number;
  tier2Count: number;
  tier3Count: number;
  
  // Leads
  totalLeads: number;
  leadsThisMonth: number;
  strategyCalls: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Parallel queries for performance
  const [
    totalUsers,
    newUsersThisMonth,
    tier2Count,
    tier3Count,
    totalBlueprints,
    blueprintsThisMonth,
    totalLeads,
    leadsThisMonth,
    strategyCalls,
    newUsersLastMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { tier: "architect" } }),
    prisma.user.count({ where: { tier: "apex" } }),
    prisma.blueprint.count(),
    prisma.blueprint.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.strategyCall.count({ where: { status: { in: ["pending", "confirmed"] } } }),
    prisma.user.count({
      where: {
        createdAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
    }),
  ]);

  // Calculate MRR (Tier 2 subscribers * $99)
  const mrr = tier2Count * 99;

  // Calculate MRR growth
  const mrrGrowth = newUsersLastMonth > 0
    ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100
    : 0;

  // Calculate conversion rate (paid users / total users)
  const paidUsers = tier2Count + tier3Count;
  const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0;

  return {
    mrr,
    mrrGrowth,
    totalUsers,
    newUsersThisMonth,
    totalBlueprints,
    blueprintsThisMonth,
    conversionRate,
    tier2Count,
    tier3Count,
    totalLeads,
    leadsThisMonth,
    strategyCalls,
  };
}

export async function getUserStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalBlueprints, blueprintsThisMonth] = await Promise.all([
    prisma.blueprint.count({ where: { userId } }),
    prisma.blueprint.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),
  ]);

  return {
    totalBlueprints,
    blueprintsThisMonth,
    tier: user.tier,
    referralCount: user.referralCount,
  };
}
