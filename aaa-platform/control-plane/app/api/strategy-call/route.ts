import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/strategy-call - Book a strategy call
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      company,
      phone,
      industry,
      revenue,
      teamSize,
      biggestChallenge,
      desiredOutcome,
      timeline,
      preferredDate,
      preferredTime,
      timezone,
    } = body;

    // Validate required fields
    if (!email || !firstName || !industry || !biggestChallenge || !desiredOutcome) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const strategyCall = await prisma.strategyCall.create({
      data: {
        email,
        firstName,
        lastName,
        company,
        phone,
        industry,
        revenue,
        teamSize,
        biggestChallenge,
        desiredOutcome,
        timeline,
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        preferredTime,
        timezone,
        status: "pending",
      },
    });

    // Also capture as lead
    await prisma.lead.upsert({
      where: { email },
      create: {
        email,
        firstName,
        lastName,
        company,
        industry,
        source: "strategy-call",
        status: "qualified",
      },
      update: {
        status: "qualified",
      },
    });

    // TODO: Send confirmation email
    // TODO: Create calendar event
    // TODO: Notify sales team

    return NextResponse.json({ strategyCall });
  } catch (error) {
    console.error("Error booking strategy call:", error);
    return NextResponse.json(
      { error: "Failed to book strategy call" },
      { status: 500 }
    );
  }
}
