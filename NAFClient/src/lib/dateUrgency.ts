export type UrgencyResult =
  | { overdue: false; label: string }
  | { overdue: true; label: string };

/**
 * Returns urgency info for a dateNeeded string.
 * - Returns null if dateNeeded is absent.
 * - Overdue: "X days/weeks/months/years overdue"
 * - Future:
 *   - >= 1 year remaining: years
 *   - >= 1 month remaining: months
 *   - > 1 week remaining: weeks
 *   - <= 1 week remaining: days
 */
export function getDateUrgency(dateNeeded: string | null | undefined): UrgencyResult | null {
  if (!dateNeeded) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateNeeded);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays >= 365) {
      const years = Math.floor(absDays / 365);
      return { overdue: true, label: `${years} ${years === 1 ? "year" : "years"} overdue` };
    }
    if (absDays >= 30) {
      const months = Math.floor(absDays / 30);
      return { overdue: true, label: `${months} ${months === 1 ? "month" : "months"} overdue` };
    }
    if (absDays >= 7) {
      const weeks = Math.floor(absDays / 7);
      return { overdue: true, label: `${weeks} ${weeks === 1 ? "week" : "weeks"} overdue` };
    }
    return { overdue: true, label: `${absDays} ${absDays === 1 ? "day" : "days"} overdue` };
  }

  if (diffDays === 0) return { overdue: false, label: "due today" };

  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    return { overdue: false, label: `${years} ${years === 1 ? "year" : "years"} remaining` };
  }
  if (diffDays >= 30) {
    const months = Math.floor(diffDays / 30);
    return { overdue: false, label: `${months} ${months === 1 ? "month" : "months"} remaining` };
  }
  if (diffDays > 7) {
    const weeks = Math.floor(diffDays / 7);
    return { overdue: false, label: `${weeks} ${weeks === 1 ? "week" : "weeks"} remaining` };
  }
  return { overdue: false, label: `${diffDays} ${diffDays === 1 ? "day" : "days"} remaining` };
}
