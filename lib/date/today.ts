/**
 * Centralized "Today" calculation service.
 * Uses Asia/Kolkata (IST) timezone consistently across the entire CRM.
 * All "today" queries use full calendar day: 12:00 AM to 11:59:59 PM IST.
 */

const CRM_TIMEZONE = "Asia/Kolkata";

/**
 * Get the start and end of today in the CRM's configured timezone (IST).
 * Returns ISO strings suitable for database queries.
 */
export function getTodayRange(): { start: string; end: string } {
  const now = new Date();

  // Get current date in IST
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CRM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = formatter.format(now); // "2026-07-10"

  // Start of day in IST: YYYY-MM-DDT00:00:00+05:30
  const startIST = new Date(`${todayStr}T00:00:00+05:30`);
  // End of day in IST: YYYY-MM-DDT23:59:59.999+05:30
  const endIST = new Date(`${todayStr}T23:59:59.999+05:30`);

  return {
    start: startIST.toISOString(),
    end: endIST.toISOString(),
  };
}

/**
 * Get today's date string in YYYY-MM-DD format in CRM timezone.
 */
export function getTodayDateString(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: CRM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Check if a given ISO date string falls within "today" in CRM timezone.
 */
export function isToday(isoDate: string): boolean {
  const { start, end } = getTodayRange();
  const t = new Date(isoDate).getTime();
  return t >= new Date(start).getTime() && t <= new Date(end).getTime();
}

/**
 * Check if a given ISO date is in the past (overdue) in CRM timezone.
 */
export function isPast(isoDate: string): boolean {
  return new Date(isoDate).getTime() < Date.now();
}

export { CRM_TIMEZONE };
