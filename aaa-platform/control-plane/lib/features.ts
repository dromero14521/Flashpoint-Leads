/**
 * Feature Gating System
 * Implements tier-based feature flags and limitations for the AAA Platform
 */

import { SubscriptionTier } from "./clerk";

// Re-export for convenience
export type { SubscriptionTier };

export interface TierFeatures {
  // Blueprint limits
  blueprint_limit: number; // per month (Infinity for unlimited)
  blueprint_export_pdf: boolean;
  blueprint_custom_templates: boolean;

  // Integration access
  integrations: string[]; // ['zapier', 'notion', 'clickup', 'all']

  // API access
  api_access: boolean;
  api_rate_limit: number; // requests per minute

  // Support
  priority_support: boolean;
  white_glove_service: boolean;

  // Advanced features
  custom_branding: boolean;
  team_collaboration: boolean;
  advanced_analytics: boolean;
}

/**
 * Feature configuration per tier
 * Based on CLAUDE.md revenue model
 */
export const FEATURE_FLAGS: Record<SubscriptionTier, TierFeatures> = {
  tier1: {
    // "Crippleware" - Free tier with deliberate limitations
    blueprint_limit: 3, // 3 blueprints per month
    blueprint_export_pdf: false,
    blueprint_custom_templates: false,

    integrations: [], // No integrations

    api_access: false,
    api_rate_limit: 0,

    priority_support: false,
    white_glove_service: false,

    custom_branding: false,
    team_collaboration: false,
    advanced_analytics: false,
  },

  tier2: {
    // Core Subscription ($99-199/mo) - Primary recurring revenue driver
    blueprint_limit: Infinity, // Unlimited blueprints
    blueprint_export_pdf: true,
    blueprint_custom_templates: true,

    integrations: ["zapier", "notion", "clickup"], // Standard integrations

    api_access: true,
    api_rate_limit: 100, // 100 requests per minute

    priority_support: false,
    white_glove_service: false,

    custom_branding: true,
    team_collaboration: true,
    advanced_analytics: true,
  },

  tier3: {
    // Apex Implementation ($2,500-5,000) - High-ticket white-glove service
    blueprint_limit: Infinity,
    blueprint_export_pdf: true,
    blueprint_custom_templates: true,

    integrations: ["all"], // All integrations including custom

    api_access: true,
    api_rate_limit: 1000, // 1000 requests per minute

    priority_support: true,
    white_glove_service: true,

    custom_branding: true,
    team_collaboration: true,
    advanced_analytics: true,
  },
};

/**
 * Check if a user has access to a specific feature
 * @param userTier - User's subscription tier
 * @param feature - Feature key to check
 * @returns true if user has access
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier,
  feature: keyof TierFeatures
): boolean {
  const tierConfig = FEATURE_FLAGS[userTier];
  const value = tierConfig[feature];

  // Handle boolean features
  if (typeof value === "boolean") {
    return value;
  }

  // Handle array features (integrations)
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  // Handle numeric features (treat > 0 as enabled)
  if (typeof value === "number") {
    return value > 0;
  }

  return false;
}

/**
 * Get the limit value for a specific feature
 * @param userTier - User's subscription tier
 * @param feature - Feature key to get limit for
 * @returns Limit value (Infinity for unlimited)
 */
export function getFeatureLimit(
  userTier: SubscriptionTier,
  feature: keyof TierFeatures
): number {
  const tierConfig = FEATURE_FLAGS[userTier];
  const value = tierConfig[feature];

  if (typeof value === "number") {
    return value;
  }

  // For non-numeric features, return 0 (disabled) or Infinity (enabled)
  return hasFeatureAccess(userTier, feature) ? Infinity : 0;
}

/**
 * Get all integrations available for a tier
 * @param userTier - User's subscription tier
 * @returns Array of integration names
 */
export function getAvailableIntegrations(userTier: SubscriptionTier): string[] {
  return FEATURE_FLAGS[userTier].integrations;
}

/**
 * Check if a specific integration is available
 * @param userTier - User's subscription tier
 * @param integration - Integration name (e.g., "zapier", "notion")
 * @returns true if integration is available
 */
export function hasIntegrationAccess(
  userTier: SubscriptionTier,
  integration: string
): boolean {
  const integrations = getAvailableIntegrations(userTier);
  return integrations.includes("all") || integrations.includes(integration);
}

/**
 * Get the required tier for a feature
 * @param feature - Feature key
 * @returns Minimum tier required (or null if available to all)
 */
export function getRequiredTier(
  feature: keyof TierFeatures
): SubscriptionTier | null {
  // Check each tier from lowest to highest
  const tiers: SubscriptionTier[] = ["tier1", "tier2", "tier3"];

  for (const tier of tiers) {
    if (hasFeatureAccess(tier, feature)) {
      return tier;
    }
  }

  return null; // Not available in any tier
}

/**
 * Get human-readable tier name
 * @param tier - Subscription tier
 * @returns Display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    tier1: "Free",
    tier2: "Pro",
    tier3: "Apex",
  };
  return names[tier];
}

/**
 * Get tier price (monthly)
 * @param tier - Subscription tier
 * @returns Price in dollars
 */
export function getTierPrice(tier: SubscriptionTier): number {
  const prices: Record<SubscriptionTier, number> = {
    tier1: 0,
    tier2: 99, // Base price for tier2
    tier3: 2500, // Base price for tier3 (one-time or monthly)
  };
  return prices[tier];
}

/**
 * Get feature comparison for pricing page
 * @returns Array of features with tier availability
 */
export function getFeatureComparison(): Array<{
  feature: string;
  tier1: boolean | string;
  tier2: boolean | string;
  tier3: boolean | string;
}> {
  return [
    {
      feature: "AI-Generated Blueprints",
      tier1: "3/month",
      tier2: "Unlimited",
      tier3: "Unlimited",
    },
    {
      feature: "PDF Export",
      tier1: false,
      tier2: true,
      tier3: true,
    },
    {
      feature: "Custom Templates",
      tier1: false,
      tier2: true,
      tier3: true,
    },
    {
      feature: "Integrations (Zapier, Notion, etc.)",
      tier1: false,
      tier2: true,
      tier3: true,
    },
    {
      feature: "API Access",
      tier1: false,
      tier2: true,
      tier3: true,
    },
    {
      feature: "Priority Support",
      tier1: false,
      tier2: false,
      tier3: true,
    },
    {
      feature: "White-Glove Service",
      tier1: false,
      tier2: false,
      tier3: true,
    },
    {
      feature: "Custom Branding",
      tier1: false,
      tier2: true,
      tier3: true,
    },
    {
      feature: "Team Collaboration",
      tier1: false,
      tier2: true,
      tier3: true,
    },
    {
      feature: "Advanced Analytics",
      tier1: false,
      tier2: true,
      tier3: true,
    },
  ];
}

/**
 * Custom error for feature access denial
 */
export class FeatureLockedError extends Error {
  constructor(
    message: string,
    public requiredTier: SubscriptionTier,
    public currentTier: SubscriptionTier
  ) {
    super(message);
    this.name = "FeatureLockedError";
  }
}

/**
 * Custom error for usage limit reached
 */
export class UsageLimitError extends Error {
  constructor(
    message: string,
    public action: string,
    public limit: number,
    public used: number
  ) {
    super(message);
    this.name = "UsageLimitError";
  }
}
