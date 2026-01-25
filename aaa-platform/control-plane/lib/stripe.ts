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
export const PRICE_IDS = {
  ARCHITECT_MONTHLY: process.env.STRIPE_ARCHITECT_MONTHLY_PRICE_ID || "",
  ARCHITECT_YEARLY: process.env.STRIPE_ARCHITECT_YEARLY_PRICE_ID || "",
  APEX: process.env.STRIPE_APEX_PRICE_ID || "",
} as const;

export const TIER_LIMITS = {
  free: {
    blueprintsPerMonth: 3,
    features: ["Basic blueprints", "Email support"],
  },
  architect: {
    blueprintsPerMonth: -1, // unlimited
    features: ["Unlimited blueprints", "All integrations", "Priority support", "Custom templates"],
  },
  apex: {
    blueprintsPerMonth: -1,
    features: ["Everything in Architect", "1:1 Strategy Session", "Done-for-you setup", "90-day support"],
  },
} as const;

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  mode = "subscription",
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode?: "subscription" | "payment";
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
