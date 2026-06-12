import { NextRequest, NextResponse } from "next/server";
import { toZonedTime } from "date-fns-tz";
import { buildDigestsForAllUsers, checkDeadlineAlerts } from "@/lib/digest-builder";
import { getCurrentDigestType } from "@/lib/digest";
import { syncMailForAllUsers } from "@/lib/mail/sync";
import { createServiceClient } from "@/lib/supabase/server";
import type { DigestType } from "@/lib/types";

const TZ = "America/Chicago";

function shouldSyncMail(now = new Date()) {
  const zoned = toZonedTime(now, TZ);
  const hour = zoned.getHours();
  const minute = zoned.getMinutes();
  // Pre-digest sync at 11:50 AM and 11:50 PM Houston
  if ((hour === 11 || hour === 23) && minute >= 45) return true;
  // Light sync every 4 hours on the hour
  if (minute < 10 && hour % 4 === 0) return true;
  return false;
}

function getDigestTypeOverride(now = new Date()): DigestType | null {
  const zoned = toZonedTime(now, TZ);
  const hour = zoned.getHours();
  const minute = zoned.getMinutes();
  const day = zoned.getDay();
  const dateOfMonth = zoned.getDate();

  if (minute > 15) return null;

  if (hour === 12) {
    if (day === 6) return "weekly";
    if (dateOfMonth === 1) return "monthly";
    return "am";
  }
  if (hour === 0) return "pm";
  return null;
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

  const digestType = getDigestTypeOverride(now) ?? getCurrentDigestType(now);
  if (digestType) {
    const supabase = await createServiceClient();
    const { data: profiles } = await supabase.from("profiles").select("id");
    for (const profile of profiles ?? []) {
      await checkDeadlineAlerts(profile.id);
    }
    results.digest = { type: digestType, items: await buildDigestsForAllUsers(digestType) };
  }

  return NextResponse.json({ ok: true, at: now.toISOString(), ...results });
}
