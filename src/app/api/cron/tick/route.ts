import { NextRequest, NextResponse } from "next/server";
import { toZonedTime } from "date-fns-tz";
import { checkDeadlineAlertsForAllUsers } from "@/lib/deadline-alerts";
import { syncMailForAllUsers } from "@/lib/mail/sync";

const TZ = "America/Chicago";

function shouldSyncMail(now = new Date()) {
  const zoned = toZonedTime(now, TZ);
  const hour = zoned.getHours();
  const minute = zoned.getMinutes();
  if ((hour === 11 || hour === 23) && minute >= 45) return true;
  if (minute < 10 && hour % 4 === 0) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, unknown> = {};

  if (shouldSyncMail(now)) {
    results.mail = await syncMailForAllUsers(14);
  }

  await checkDeadlineAlertsForAllUsers();
  results.deadlineAlerts = true;

  return NextResponse.json({ ok: true, at: now.toISOString(), ...results });
}
