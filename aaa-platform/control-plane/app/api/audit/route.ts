import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/audit - Submit automation audit
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      industry,
      monthlyRevenue,
      hoursOnManualTasks,
      hourlyRate,
      topPainPoints,
      currentTools,
      automationAttempts,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Calculate annual cost and potential savings
    const rate = hourlyRate || 50; // Default $50/hr if not provided
    const weeklyHours = hoursOnManualTasks || 10;
    const annualCost = rate * weeklyHours * 52;
    const potentialSavings = annualCost * 0.8; // Assume 80% reduction

    const audit = await prisma.auditSubmission.create({
      data: {
        email,
        industry,
        monthlyRevenue,
        hoursOnManualTasks: weeklyHours,
        hourlyRate: rate,
        topPainPoints: JSON.stringify(topPainPoints),
        currentTools: JSON.stringify(currentTools),
        automationAttempts,
        annualCost,
        potentialSavings,
      },
    });

    // Also capture as lead
    await prisma.lead.upsert({
      where: { email },
      create: {
        email,
        industry,
        source: "audit",
        leadMagnet: "automation-audit",
        painPoints: topPainPoints?.join(", "),
        estimatedRevenue: monthlyRevenue,
      },
      update: {
        industry,
        leadMagnet: "automation-audit",
        painPoints: topPainPoints?.join(", "),
        estimatedRevenue: monthlyRevenue,
      },
    });

    return NextResponse.json({
      audit,
      results: {
        annualCost,
        potentialSavings,
        weeklySavings: potentialSavings / 52,
        hoursSavedPerWeek: weeklyHours * 0.8,
      },
    });
  } catch (error) {
    console.error("Error processing audit:", error);
    return NextResponse.json({ error: "Failed to process audit" }, { status: 500 });
  }
}
