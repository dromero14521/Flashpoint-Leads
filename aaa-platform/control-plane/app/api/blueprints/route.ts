import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { tenantDb, prisma } from "@/lib/db";

// GET /api/blueprints - List user's blueprints
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blueprints = await prisma.blueprint.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ blueprints });
  } catch (error) {
    console.error("Error fetching blueprints:", error);
    return NextResponse.json({ error: "Failed to fetch blueprints" }, { status: 500 });
  }
}

// POST /api/blueprints - Create a new blueprint
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    
    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user && clerkUser) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          imageUrl: clerkUser.imageUrl,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check tier limits
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const blueprintCount = await prisma.blueprint.count({
      where: {
        userId: user.id,
        createdAt: { gte: thisMonth },
      },
    });

    const tierLimits: Record<string, number> = {
      free: 3,
      architect: -1,
      apex: -1,
    };

    const limit = tierLimits[user.tier] || 3;
    if (limit !== -1 && blueprintCount >= limit) {
      return NextResponse.json(
        { error: "Monthly blueprint limit reached. Upgrade to continue." },
        { status: 403 }
      );
    }

    const { industry, revenueGoal, techStack, painPoints } = await request.json();

    // Call GenAI Core
    const genaiUrl = process.env.NEXT_PUBLIC_GENAI_CORE_URL || "http://localhost:8000";
    const genaiResponse = await fetch(`${genaiUrl}/generate-blueprint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        industry,
        revenue_goal: revenueGoal,
        tech_stack: techStack,
        pain_points: painPoints,
      }),
    });

    if (!genaiResponse.ok) {
      throw new Error("Failed to generate blueprint");
    }

    const genaiData = await genaiResponse.json();
    const blueprintData = genaiData.blueprint;

    // Save blueprint to database (tenantId automatically injected)
    const blueprint = await tenantDb.blueprint.create({
      data: {
        userId: user.id,
        industry,
        revenueGoal,
        techStack: JSON.stringify(techStack),
        painPoints,
        strategicDiagnosis: blueprintData.strategic_diagnosis,
        proposedArchitecture: blueprintData.proposed_architecture,
        components: JSON.stringify(blueprintData.components),
        automationSteps: JSON.stringify(blueprintData.automation_steps),
        estimatedImpact: blueprintData.estimated_impact,
        rawBlueprint: JSON.stringify(blueprintData),
        status: "generated",
      },
    });

    return NextResponse.json({ blueprint, raw: blueprintData });
  } catch (error) {
    console.error("Error creating blueprint:", error);
    return NextResponse.json({ error: "Failed to create blueprint" }, { status: 500 });
  }
}
