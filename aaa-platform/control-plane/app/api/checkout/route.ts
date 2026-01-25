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

    // Determine mode based on tier
    const mode = tier === "apex" ? "payment" : "subscription";
    const selectedPriceId = priceId || (tier === "apex" ? PRICE_IDS.APEX : PRICE_IDS.ARCHITECT_MONTHLY);

    if (!selectedPriceId) {
      return NextResponse.json({ error: "Price ID not configured" }, { status: 400 });
    }

    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId: selectedPriceId,
      successUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
      mode,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
