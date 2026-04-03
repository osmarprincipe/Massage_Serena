/**
 * Computes the endDate for a membership based on the plan's billingCycle.
 *
 * Uses calendar-accurate Date arithmetic:
 *   MONTHLY → same day next month (handles month-length differences correctly)
 *   WEEKLY  → exactly 7 days later
 *
 * If billingCycle is unrecognised, defaults to monthly so access is never
 * shorter than expected.
 */
export function computeMembershipEndDate(startDate: Date, billingCycle: string): Date {
  const end = new Date(startDate);

  if (billingCycle === "WEEKLY") {
    end.setDate(end.getDate() + 7);
  } else {
    // MONTHLY (default)
    end.setMonth(end.getMonth() + 1);
  }

  return end;
}
