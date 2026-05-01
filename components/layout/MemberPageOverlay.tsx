"use client";

import { usePathname } from "next/navigation";

/**
 * Per-route adaptive dark overlay that sits between the fixed cinematic background
 * and the page content. Lower opacity = more background visibility.
 *
 * Dashboard (Home):   more background comes through for an atmospheric feel
 * Content/Membership: balanced — content readable, atmosphere present
 * Bookings/Purchases: stronger — dense data tables need maximum readability
 */
const overlayConfig: { pattern: RegExp; opacity: number }[] = [
  { pattern: /^\/app\/dashboard$/,  opacity: 0.52 },
  { pattern: /^\/app\/membership/,  opacity: 0.60 },
  { pattern: /^\/app\/content/,     opacity: 0.66 },
  { pattern: /^\/app\/profile/,     opacity: 0.64 },
  { pattern: /^\/app\/bookings/,    opacity: 0.72 },
  { pattern: /^\/app\/purchases/,   opacity: 0.72 },
];

export function MemberPageOverlay() {
  const pathname = usePathname() ?? "";
  const opacity =
    overlayConfig.find(({ pattern }) => pattern.test(pathname))?.opacity ?? 0.62;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ background: `rgba(5,2,3,${opacity})`, zIndex: -5 }}
      aria-hidden
    />
  );
}
