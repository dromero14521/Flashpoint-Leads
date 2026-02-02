/**
 * UpgradePrompt Component
 * Strategic upgrade prompts triggered at key moments
 */

import Link from "next/link";
import { SubscriptionTier, getTierDisplayName, getTierPrice } from "@/lib/features";

type UpgradeTrigger =
  | "blueprint_limit"
  | "export_pdf"
  | "integrations"
  | "api_access"
  | "priority_support"
  | "custom_branding";

interface UpgradePromptProps {
  trigger: UpgradeTrigger;
  currentTier?: SubscriptionTier;
  requiredTier?: SubscriptionTier;
  className?: string;
}

const UPGRADE_MESSAGES: Record<
  UpgradeTrigger,
  {
    title: string;
    description: string;
    cta: string;
    benefits: string[];
  }
> = {
  blueprint_limit: {
    title: "You've reached your monthly blueprint limit",
    description:
      "Upgrade to Pro for unlimited AI-generated blueprints and unlock powerful integrations.",
    cta: "Upgrade to Pro",
    benefits: [
      "Unlimited AI blueprints",
      "Zapier, Notion & ClickUp integrations",
      "PDF exports",
      "Custom templates",
      "API access",
    ],
  },
  export_pdf: {
    title: "PDF export is a Pro feature",
    description:
      "Get professional PDF exports, unlimited blueprints, and API access with Pro.",
    cta: "Unlock Pro Features",
    benefits: [
      "Professional PDF exports",
      "Unlimited blueprints",
      "All integrations",
      "Custom branding",
    ],
  },
  integrations: {
    title: "Deploy blueprints instantly with integrations",
    description:
      "Connect Zapier, Notion, and ClickUp to deploy your automation blueprints in one click.",
    cta: "Activate Integrations",
    benefits: [
      "Zapier integration",
      "Notion integration",
      "ClickUp integration",
      "One-click deployment",
      "Unlimited blueprints",
    ],
  },
  api_access: {
    title: "Build with the AAA Platform API",
    description:
      "Integrate blueprint generation into your own tools with full API access.",
    cta: "Get API Access",
    benefits: [
      "Full REST API access",
      "100 req/min rate limit",
      "Webhook support",
      "API documentation",
      "Priority support",
    ],
  },
  priority_support: {
    title: "Get priority support with Apex",
    description:
      "Join our Apex tier for priority support, white-glove service, and dedicated implementation assistance.",
    cta: "Upgrade to Apex",
    benefits: [
      "Priority 24/7 support",
      "White-glove service",
      "Dedicated account manager",
      "Custom implementation",
      "1,000 req/min API rate",
    ],
  },
  custom_branding: {
    title: "Add your brand with Pro",
    description:
      "Customize blueprints with your logo, colors, and branding. Make them truly yours.",
    cta: "Enable Custom Branding",
    benefits: [
      "Custom logo",
      "Brand colors",
      "Custom templates",
      "White-label exports",
      "Unlimited blueprints",
    ],
  },
};

export function UpgradePrompt({
  trigger,
  currentTier = "tier1",
  requiredTier = "tier2",
  className = "",
}: UpgradePromptProps) {
  const message = UPGRADE_MESSAGES[trigger];
  const tierName = getTierDisplayName(requiredTier);
  const price = getTierPrice(requiredTier);

  return (
    <div
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-start">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {message.title}
          </h3>
          <p className="mt-2 text-sm text-gray-600">{message.description}</p>

          {/* Benefits List */}
          <ul className="mt-4 space-y-2">
            {message.benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-center text-sm text-gray-700">
                <svg
                  className="h-4 w-4 text-green-500 mr-2 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <div className="mt-6 flex items-center space-x-3">
            <Link
              href="/pricing"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              {message.cta}
            </Link>
            {price > 0 && (
              <span className="text-sm text-gray-500">
                Starting at ${price}/mo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface UpgradeModalProps {
  trigger: UpgradeTrigger;
  isOpen: boolean;
  onClose: () => void;
  currentTier?: SubscriptionTier;
  requiredTier?: SubscriptionTier;
}

/**
 * Modal version of upgrade prompt for more intrusive calls-to-action
 */
export function UpgradeModal({
  trigger,
  isOpen,
  onClose,
  currentTier = "tier1",
  requiredTier = "tier2",
}: UpgradeModalProps) {
  const message = UPGRADE_MESSAGES[trigger];
  const tierName = getTierDisplayName(requiredTier);
  const price = getTierPrice(requiredTier);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="float-right text-gray-400 hover:text-gray-600"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-blue-100 p-3">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {message.title}
          </h3>
          <p className="text-sm text-gray-600 mb-6">{message.description}</p>

          {/* Benefits */}
          <div className="text-left mb-6 space-y-3">
            {message.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Upgrade to {tierName}
            </Link>
            {price > 0 && (
              <p className="text-sm text-gray-500">
                Just ${price}/month - Cancel anytime
              </p>
            )}
            <button
              onClick={onClose}
              className="block w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InlineUpgradePromptProps {
  trigger: UpgradeTrigger;
  compact?: boolean;
  className?: string;
}

/**
 * Compact inline version for use in lists or cards
 */
export function InlineUpgradePrompt({
  trigger,
  compact = false,
  className = "",
}: InlineUpgradePromptProps) {
  const message = UPGRADE_MESSAGES[trigger];

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2 ${className}`}
      >
        <span className="text-xs text-blue-900 font-medium">
          {message.title}
        </span>
        <Link
          href="/pricing"
          className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <svg
        className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-gray-900">{message.title}</h4>
        <p className="text-xs text-gray-600 mt-1">{message.description}</p>
        <Link
          href="/pricing"
          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
        >
          {message.cta} →
        </Link>
      </div>
    </div>
  );
}
