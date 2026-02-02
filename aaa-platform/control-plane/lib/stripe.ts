import { Stripe } from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backward compatibility
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get billingPortal() { return getStripe().billingPortal; },
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get webhooks() { return getStripe().webhooks; },
};

// Price IDs - Set these in your Stripe Dashboard
// See docs/STRIPE-SETUP-GUIDE.md for configuration instructions
export const PRICE_IDS = {
  // Tier 2: Core Subscription (Recurring)
  TIER2_MONTHLY_99: process.env.STRIPE_PRICE_TIER2_MONTHLY_99 || "",
  TIER2_MONTHLY_199: process.env.STRIPE_PRICE_TIER2_MONTHLY_199 || "",

  // Tier 3: Apex Implementation (One-time)
  TIER3_ONETIME_2500: process.env.STRIPE_PRICE_TIER3_ONETIME_2500 || "",
  TIER3_ONETIME_5000: process.env.STRIPE_PRICE_TIER3_ONETIME_5000 || "",

  // Legacy naming (for backward compatibility)
  ARCHITECT_MONTHLY: process.env.STRIPE_ARCHITECT_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_TIER2_MONTHLY_99 || "",
  ARCHITECT_YEARLY: process.env.STRIPE_ARCHITECT_YEARLY_PRICE_ID || "",
  APEX: process.env.STRIPE_APEX_PRICE_ID || process.env.STRIPE_PRICE_TIER3_ONETIME_2500 || "",
} as const;

// Tier configurations and feature limits
export const TIER_CONFIG = {
  tier1: {
    name: "Freemium",
    price: "$0",
    blueprintsPerMonth: 3,
    features: [
      "3 blueprint generations per month",
      "Basic templates only",
      "Email support",
      "Community access"
    ],
    limitations: [
      "No API integrations",
      'AAA watermark on exports',
      "No priority support"
    ],
  },
  tier2: {
    name: "Core Subscription",
    price: "$99-$199/mo",
    blueprintsPerMonth: -1, // unlimited
    features: [
      "Unlimited blueprint generations",
      "All premium templates",
      "API integrations (Zapier, Notion, ClickUp)",
      "Priority support",
      "Custom branding (no watermarks)",
      "Export to multiple formats"
    ],
    variants: {
      individual: { price: "$99/mo", users: 1 },
      team: { price: "$199/mo", users: 5 }
    }
  },
  tier3: {
    name: "Apex Implementation",
    price: "$2,500-$5,000",
    blueprintsPerMonth: -1, // unlimited
    features: [
      "Everything in Core Subscription",
      "1-on-1 strategy session (Hurt & Heal framework)",
      "Custom blueprint by experts",
      "Done-for-you implementation support",
      "30-day follow-up (Single Project)",
      "90-day ongoing support (Complete Transformation)",
      "Multi-system integration assistance"
    ],
    variants: {
      singleProject: { price: "$2,500", support: "30 days" },
      completeTransformation: { price: "$5,000", support: "90 days" }
    }
  },
  // Legacy naming (for backward compatibility)
  free: {
    blueprintsPerMonth: 3,
    features: ["Basic blueprints", "Email support"],
  },
  architect: {
    blueprintsPerMonth: -1,
    features: ["Unlimited blueprints", "All integrations", "Priority support", "Custom templates"],
  },
  apex: {
    blueprintsPerMonth: -1,
    features: ["Everything in Architect", "1:1 Strategy Session", "Done-for-you setup", "90-day support"],
  },
} as const;

// Helper to get tier name from database tier value
export function getTierDisplayName(tier: string): string {
  const tierMap: Record<string, string> = {
    free: "Freemium",
    tier1: "Freemium",
    architect: "Core Subscription",
    tier2: "Core Subscription",
    apex: "Apex Implementation",
    tier3: "Apex Implementation",
  };
  return tierMap[tier] || "Freemium";
}

// Helper to get blueprint limit for a tier
export function getBlueprintLimit(tier: string): number {
  const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.tier1;
  return tierConfig.blueprintsPerMonth;
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  mode = "subscription",
  metadata,
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: "subscription" | "payment";
  metadata?: Record<string, string>;
}) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: metadata || {},
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export async function getOrCreateCustomer(email: string, name?: string) {
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  return await stripe.customers.create({
    email,
    name,
  });
}
