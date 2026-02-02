/**
 * UsageMeter Component
 * Displays usage progress with upgrade prompts when nearing limits
 */

import React from "react";
import Link from "next/link";

interface UsageMeterProps {
  used: number;
  limit: number;
  action: string;
  displayName?: string;
  className?: string;
}

export function UsageMeter({
  used,
  limit,
  action,
  displayName,
  className = "",
}: UsageMeterProps) {
  const percentage = limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  const isUnlimited = limit === Infinity;

  const label = displayName || action;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        {isUnlimited ? (
          <span className="text-green-600 font-semibold">Unlimited</span>
        ) : (
          <span
            className={`font-semibold ${
              isAtLimit
                ? "text-red-600"
                : isNearLimit
                ? "text-orange-600"
                : "text-gray-600"
            }`}
          >
            {used} of {limit}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {!isUnlimited && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isAtLimit
                ? "bg-red-500"
                : isNearLimit
                ? "bg-orange-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {/* Warning Message */}
      {isAtLimit && (
        <div className="flex items-start space-x-2 text-xs bg-red-50 border border-red-200 rounded p-2">
          <svg
            className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-red-800 font-medium">Limit reached!</p>
            <p className="text-red-700 mt-1">
              You've used all your {label} for this month.{" "}
              <Link
                href="/pricing"
                className="underline font-medium hover:text-red-900"
              >
                Upgrade for unlimited access
              </Link>
            </p>
          </div>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <p className="text-xs text-orange-600">
          You're almost at your limit.{" "}
          <Link href="/pricing" className="underline font-medium hover:text-orange-800">
            Upgrade for unlimited access
          </Link>
        </p>
      )}
    </div>
  );
}

interface UsageMeterListProps {
  usageData: Array<{
    action: string;
    displayName: string;
    used: number;
    limit: number;
  }>;
  className?: string;
}

/**
 * Display multiple usage meters in a list
 */
export function UsageMeterList({ usageData, className = "" }: UsageMeterListProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {usageData.map((item) => (
        <UsageMeter
          key={item.action}
          action={item.action}
          displayName={item.displayName}
          used={item.used}
          limit={item.limit}
        />
      ))}
    </div>
  );
}

interface CompactUsageMeterProps {
  used: number;
  limit: number;
  className?: string;
}

/**
 * Compact version for inline display
 */
export function CompactUsageMeter({
  used,
  limit,
  className = "",
}: CompactUsageMeterProps) {
  const percentage = limit === Infinity ? 0 : Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isUnlimited = limit === Infinity;

  if (isUnlimited) {
    return (
      <span className={`text-xs text-green-600 font-medium ${className}`}>
        Unlimited
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <span
        className={`text-xs font-medium ${
          isNearLimit ? "text-orange-600" : "text-gray-600"
        }`}
      >
        {used}/{limit}
      </span>
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isNearLimit ? "bg-orange-500" : "bg-blue-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
