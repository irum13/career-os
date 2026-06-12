import { toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  setHours,
  setMinutes,
} from "date-fns";
import type { DigestType } from "./types";

const TZ = "America/Chicago";

export function getDigestWindow(type: DigestType, refDate = new Date()) {
  const zoned = toZonedTime(refDate, TZ);

  switch (type) {
    case "am": {
      // Midnight–noon same day, published at noon
      const dayStart = startOfDay(zoned);
      const periodStart = fromZonedTime(dayStart, TZ);
      const periodEnd = fromZonedTime(setMinutes(setHours(dayStart, 12), 0), TZ);
      return { periodStart, periodEnd, label: "Noon digest" };
    }
    case "pm": {
      // Previous noon–midnight, published at midnight
      const dayStart = startOfDay(zoned);
      const periodEnd = fromZonedTime(dayStart, TZ);
      const periodStart = fromZonedTime(
        setMinutes(setHours(subDays(dayStart, 1), 12), 0),
        TZ
      );
      return { periodStart, periodEnd, label: "Evening digest" };
    }
    case "weekly": {
      const weekStart = fromZonedTime(startOfWeek(zoned, { weekStartsOn: 1 }), TZ);
      const weekEnd = fromZonedTime(endOfWeek(zoned, { weekStartsOn: 1 }), TZ);
      return { periodStart: weekStart, periodEnd: weekEnd, label: "Weekly digest" };
    }
    case "monthly": {
      const monthStart = fromZonedTime(startOfMonth(zoned), TZ);
      const monthEnd = fromZonedTime(endOfMonth(zoned), TZ);
      return { periodStart: monthStart, periodEnd: monthEnd, label: "Monthly digest" };
    }
  }
}

export function getCurrentDigestType(refDate = new Date()): DigestType | null {
  const zoned = toZonedTime(refDate, TZ);
  const hour = zoned.getHours();
  const minute = zoned.getMinutes();
  const day = zoned.getDay();
  const dateOfMonth = zoned.getDate();

  // Run at 12:00 PM
  if (hour === 12 && minute < 10) {
    if (day === 6) return "weekly"; // Saturday
    if (dateOfMonth === 1) return "monthly";
    return "am";
  }

  // Run at 12:00 AM
  if (hour === 0 && minute < 10) {
    return "pm";
  }

  return null;
}

export function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const today = startOfDay(new Date());
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isStaleJob(updatedAt: string, days = 14): boolean {
  const updated = new Date(updatedAt);
  return subDays(new Date(), days) > updated;
}
