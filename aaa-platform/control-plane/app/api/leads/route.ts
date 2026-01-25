import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/leads - Capture lead from lead magnets
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      company,
      industry,
      source,
      leadMagnet,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if lead already exists
    const existingLead = await prisma.lead.findUnique({
      where: { email },
    });

    if (existingLead) {
      // Update existing lead with new info
      const lead = await prisma.lead.update({
        where: { email },
        data: {
          firstName: firstName || existingLead.firstName,
          lastName: lastName || existingLead.lastName,
          company: company || existingLead.company,
          industry: industry || existingLead.industry,
          source: source || existingLead.source,
          leadMagnet: leadMagnet || existingLead.leadMagnet,
          utmSource: utmSource || existingLead.utmSource,
          utmMedium: utmMedium || existingLead.utmMedium,
          utmCampaign: utmCampaign || existingLead.utmCampaign,
        },
      });
      return NextResponse.json({ lead, isNew: false });
    }

    // Create new lead
    const lead = await prisma.lead.create({
      data: {
        email,
        firstName,
        lastName,
        company,
        industry,
        source: source || "organic",
        leadMagnet,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    });

    // TODO: Trigger email nurture sequence here
    // await sendWelcomeEmail(lead);

    return NextResponse.json({ lead, isNew: true });
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json({ error: "Failed to capture lead" }, { status: 500 });
  }
}
