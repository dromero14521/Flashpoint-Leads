import { lemonSqueezySetup, getAuthenticatedUser, getProducts, getCheckouts, createCheckout, getSubscriptions } from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";

// Initialize LemonSqueezy API client
export function initializeLemonSqueezy() {
  if (!process.env.LEMONSQUEEZY_API_KEY) {
    throw new Error("LEMONSQUEEZY_API_KEY is not set");
  }

  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY,
    onError: (error) => console.error("LemonSqueezy Error:", error),
  });
}

// Variant/Product IDs - Map these to your LemonSqueezy dashboard
export const LEMONSQUEEZY_PRODUCT_IDS = {
  // Tier 2: Core Subscription (Recurring)
  TIER2_MONTHLY_99: process.env.LEMONSQUEEZY_VARIANT_TIER2_99 || "",
  TIER2_MONTHLY_199: process.env.LEMONSQUEEZY_VARIANT_TIER2_199 || "",

  // Tier 3: Apex Implementation (One-time)
  TIER3_ONETIME_2500: process.env.LEMONSQUEEZY_VARIANT_TIER3_2500 || "",
  TIER3_ONETIME_5000: process.env.LEMONSQUEEZY_VARIANT_TIER3_5000 || "",

  // Store ID (required for checkout creation)
  STORE_ID: process.env.LEMONSQUEEZY_STORE_ID || "",
} as const;

/**
 * Create a LemonSqueezy checkout session
 * Returns a checkout URL that can be opened in overlay or redirect
 */
export async function createCheckoutSession({
  variantId,
  email,
  name,
  metadata,
}: {
  variantId: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  if (!LEMONSQUEEZY_PRODUCT_IDS.STORE_ID) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not configured");
  }

  initializeLemonSqueezy();

  const { data, error } = await createCheckout(
    LEMONSQUEEZY_PRODUCT_IDS.STORE_ID,
    variantId,
    {
      productOptions: {
        enableCheckoutButton: true,
      },
      checkoutData: {
        email,
        name,
        custom: metadata,
      },
    }
  );

  if (error) {
    throw new Error(`Failed to create LemonSqueezy checkout: ${error.message}`);
  }

  return {
    checkoutId: data?.id,
    checkoutUrl: data?.attributes?.url,
  };
}

/**
 * Verify webhook signature using HMAC-SHA256
 * LemonSqueezy signs all webhooks with a shared secret
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    console.error("Webhook secret not configured");
    return false;
  }

  try {
    // LemonSqueezy uses HMAC-SHA256 with the request body
    const hash = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(hash, signature);
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

/**
 * Extract data from LemonSqueezy webhook payload
 * Webhooks are in JSON:API format
 */
export interface WebhookData {
  id: string;
  type: "order" | "subscription" | "subscription-invoice" | "license-key";
  customerId?: string;
  subscriptionId?: string;
  orderId?: string;
  status?: string;
  variantId?: string;
  productId?: string;
  customerEmail?: string;
  customerName?: string;
  amount?: number;
}

export function extractWebhookData(payload: any): WebhookData {
  const data = payload.data;

  return {
    id: data.id,
    type: data.type,
    customerId: data.attributes?.customer_id,
    subscriptionId: data.attributes?.subscription_id,
    orderId: data.attributes?.order_id,
    status: data.attributes?.status,
    variantId: data.attributes?.variant_id,
    productId: data.attributes?.product_id,
    customerEmail: data.attributes?.customer_email,
    customerName: data.attributes?.customer_name,
    amount: data.attributes?.total,
  };
}

/**
 * Map LemonSqueezy variant ID to AAA Platform tier
 */
export function mapVariantIdToTier(variantId: string): string {
  // Tier 2 mapping
  if (
    variantId === LEMONSQUEEZY_PRODUCT_IDS.TIER2_MONTHLY_99 ||
    variantId === LEMONSQUEEZY_PRODUCT_IDS.TIER2_MONTHLY_199
  ) {
    return "tier2";
  }

  // Tier 3 mapping
  if (
    variantId === LEMONSQUEEZY_PRODUCT_IDS.TIER3_ONETIME_2500 ||
    variantId === LEMONSQUEEZY_PRODUCT_IDS.TIER3_ONETIME_5000
  ) {
    return "tier3";
  }

  console.warn(`Unknown LemonSqueezy variant ID: ${variantId}, defaulting to tier1`);
  return "tier1";
}

/**
 * Parse LemonSqueezy subscription status
 * Statuses: active, paused, past_due, unpaid, cancelled
 */
export function isSubscriptionActive(status?: string): boolean {
  return status === "active" || status === "paused";
}
