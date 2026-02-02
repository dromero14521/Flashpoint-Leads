import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createCheckoutSession, getOrCreateCustomer, PRICE_IDS } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { priceId, tier } = await request.json();

    // Get or create user in database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
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

    // Get or create Stripe customer
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
    const customer = await getOrCreateCustomer(email, name);

    // Update user with Stripe customer ID
    if (!user.stripeCustomerId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Determine mode based on tier (support both new and legacy naming)
    const isTier3 = tier === "tier3" || tier === "apex";
    const mode = isTier3 ? "payment" : "subscription";

    // Select price ID with fallback to defaults
    let selectedPriceId = priceId;
    if (!selectedPriceId) {
      if (isTier3) {
        selectedPriceId = PRICE_IDS.TIER3_ONETIME_2500 || PRICE_IDS.APEX;
      } else if (tier === "tier2" || tier === "architect") {
        selectedPriceId = PRICE_IDS.TIER2_MONTHLY_99 || PRICE_IDS.ARCHITECT_MONTHLY;
      }
    }

    if (!selectedPriceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 400 });
    }

    // Create checkout session with proper metadata
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId: selectedPriceId,
      successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
      mode,
      metadata: {
        userId: userId,
        clerkId: userId,
        tier: tier,
        userEmail: email,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
