import { startOfDay, subDays } from "date-fns";

export function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const today = startOfDay(new Date());
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isStaleJob(updatedAt: string, days = 14): boolean {
  const updated = new Date(updatedAt);
  return subDays(new Date(), days) > updated;
}
