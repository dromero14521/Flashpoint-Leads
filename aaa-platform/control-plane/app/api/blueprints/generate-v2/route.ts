/**
 * Blueprint Generation API v2
 * Integrates feature gating, usage tracking, and GenAI Core v2
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserTier, getUserTenantId } from "@/lib/clerk";
import { withUsageGate } from "@/lib/feature-gate";
import { tenantDb } from "@/lib/db";

interface BlueprintRequestBody {
  industry: string;
  revenueGoal: string;
  techStack: string[];
  painPoints: string;
  outputFormat?: "technical" | "executive" | "visual";
}

export async function POST(req: NextRequest) {
  // Feature gate: Check blueprint usage limit and track
  return withUsageGate("blueprint", async () => {
    try {
      const { userId } = await auth();

      if (!userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Get user context
      const [tier, tenantId] = await Promise.all([
        getUserTier(userId),
        getUserTenantId(userId)
      ]);

      // Parse request body
      const body: BlueprintRequestBody = await req.json();

      // Validate required fields
      if (!body.industry || !body.revenueGoal || !body.painPoints) {
        return NextResponse.json(
          { error: "Missing required fields: industry, revenueGoal, painPoints" },
          { status: 400 }
        );
      }

      // Call GenAI Core v2
      const genaiCoreUrl = process.env.GENAI_CORE_URL || "http://localhost:8000";
      const response = await fetch(`${genaiCoreUrl}/generate-blueprint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Tier": tier,
          "X-User-Id": userId,
        },
        body: JSON.stringify({
          industry: body.industry,
          revenue_goal: body.revenueGoal,
          tech_stack: body.techStack || [],
          pain_points: body.painPoints,
          output_format: body.outputFormat || "technical",
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        return NextResponse.json(
          { error: error.error || "Blueprint generation failed" },
          { status: response.status }
        );
      }

      const result = await response.json();

      // Save blueprint to database (tenantId automatically injected)
      const blueprint = await tenantDb.blueprint.create({
        data: {
          userId,
          industry: body.industry,
          revenueGoal: body.revenueGoal,
          techStack: JSON.stringify(body.techStack || []),
          painPoints: body.painPoints,
          strategicDiagnosis: result.blueprint.strategic_diagnosis,
          proposedArchitecture: result.blueprint.proposed_architecture,
          components: JSON.stringify(result.blueprint.components),
          automationSteps: JSON.stringify(result.blueprint.automation_steps),
          estimatedImpact: JSON.stringify(result.blueprint.estimated_impact),
          rawBlueprint: JSON.stringify(result.blueprint),
          status: "generated",
        },
      });

      // Return response with blueprint ID
      return NextResponse.json({
        blueprintId: blueprint.id,
        blueprint: result.blueprint,
        metadata: {
          ...result.metadata,
          savedToDatabase: true,
          databaseId: blueprint.id
        },
        validation: result.validation,
      }, { status: 201 });

    } catch (error: any) {
      console.error("Blueprint generation error:", error);

      // Check if it's a network error
      if (error.code === "ECONNREFUSED") {
        return NextResponse.json(
          {
            error: "GenAI Core is not available. Please ensure the service is running.",
            detail: "Connection refused to GenAI Core service"
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to generate blueprint",
          detail: error.message
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Get supported output formats
 */
export async function GET(req: NextRequest) {
  try {
    const genaiCoreUrl = process.env.GENAI_CORE_URL || "http://localhost:8000";
    const response = await fetch(`${genaiCoreUrl}/formats`);

    if (!response.ok) {
      throw new Error("Failed to fetch formats");
    }

    const formats = await response.json();
    return NextResponse.json(formats);

  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch supported formats",
        fallback: {
          formats: ["technical", "executive", "visual"],
          descriptions: {
            technical: "For developers - includes technical details",
            executive: "For business owners - focuses on ROI",
            visual: "For visual learners - includes diagrams"
          }
        }
      },
      { status: 200 }  // Return 200 with fallback data
    );
  }
}
