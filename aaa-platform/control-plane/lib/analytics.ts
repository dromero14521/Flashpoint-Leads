// Analytics utility - integrate with your preferred provider
// Recommended: Posthog, Mixpanel, or Amplitude

type EventName =
  | "page_view"
  | "signup_started"
  | "signup_completed"
  | "blueprint_started"
  | "blueprint_completed"
  | "checkout_started"
  | "checkout_completed"
  | "audit_started"
  | "audit_completed"
  | "strategy_call_booked"
  | "referral_shared";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

class Analytics {
  private debug = process.env.NODE_ENV === "development";

  identify(userId: string, traits?: EventProperties): void {
    if (this.debug) {
      console.log(`[Analytics] Identify: ${userId}`, traits);
      return;
    }

    // TODO: Implement with your analytics provider
    // Example with Posthog:
    // posthog.identify(userId, traits);
  }

  track(event: EventName, properties?: EventProperties): void {
    if (this.debug) {
      console.log(`[Analytics] Track: ${event}`, properties);
      return;
    }

    // TODO: Implement with your analytics provider
    // Example with Posthog:
    // posthog.capture(event, properties);
  }

  page(name?: string, properties?: EventProperties): void {
    if (this.debug) {
      console.log(`[Analytics] Page: ${name || "unknown"}`, properties);
      return;
    }

    // TODO: Implement with your analytics provider
  }

  // Revenue tracking
  revenue(amount: number, properties?: EventProperties): void {
    if (this.debug) {
      console.log(`[Analytics] Revenue: $${amount}`, properties);
      return;
    }

    // TODO: Implement revenue tracking
  }
}

export const analytics = new Analytics();

// Hook for client-side usage
export function useAnalytics() {
  return {
    track: (event: EventName, properties?: EventProperties) => {
      analytics.track(event, properties);
    },
    page: (name?: string, properties?: EventProperties) => {
      analytics.page(name, properties);
    },
  };
}
