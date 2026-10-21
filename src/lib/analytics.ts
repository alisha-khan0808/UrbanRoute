"use client";

/**
 * Privacy-safe analytics. Only event names and non-identifying properties
 * (service slugs, region ids) are sent — never enquiry contents.
 */
export type AnalyticsEvent =
  | "hotspot_click"
  | "service_view"
  | "cta_click"
  | "form_start"
  | "form_submit"
  | "coverage_select"
  | "fallback_3d";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string> }) => void;
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, props: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  window.plausible?.(event, { props });
  window.dataLayer?.push({ event, ...props });
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", event, props);
}
