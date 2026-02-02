/**
 * LockedFeature Component
 * Displays a locked state overlay for features not available in user's tier
 */

import React from "react";
import Link from "next/link";
import { SubscriptionTier, getTierDisplayName } from "@/lib/features";

interface LockedFeatureProps {
  feature: string;
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  className?: string;
}

export function LockedFeature({
  feature,
  requiredTier,
  children,
  className = "",
}: LockedFeatureProps) {
  const tierName = getTierDisplayName(requiredTier);

  return (
    <div className={`relative ${className}`}>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
        <div className="text-center px-6 py-8 max-w-sm">
          {/* Lock Icon */}
          <svg
            className="mx-auto h-12 w-12 text-gray-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>

          {/* Message */}
          <h3 className="text-lg font-semibold text-white mb-2">
            {feature}
          </h3>
          <p className="text-sm text-gray-300 mb-4">
            Unlock with {tierName}
          </p>

          {/* Upgrade Button */}
          <Link
            href="/pricing"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Upgrade Now
          </Link>
        </div>
      </div>

      {/* Blurred Preview */}
      <div className="blur-sm pointer-events-none select-none">{children}</div>
    </div>
  );
}

interface LockedFeatureBadgeProps {
  requiredTier: SubscriptionTier;
  className?: string;
}

/**
 * Small badge to indicate a feature is locked
 */
export function LockedFeatureBadge({
  requiredTier,
  className = "",
}: LockedFeatureBadgeProps) {
  const tierName = getTierDisplayName(requiredTier);

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600 ${className}`}
    >
      <svg
        className="mr-1 h-3 w-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      {tierName}
    </span>
  );
}
