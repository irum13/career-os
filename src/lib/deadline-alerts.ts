import { createServiceClient } from "@/lib/supabase/server";
import { daysUntil } from "@/lib/digest";

export async function checkDeadlineAlerts(userId: string) {
  const supabase = await createServiceClient();

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("user_id", userId);

  for (const deadline of deadlines ?? []) {
    const remaining = daysUntil(deadline.due_date);
    for (const noticeDay of deadline.notice_days ?? [7, 3, 1]) {
      if (remaining === noticeDay) {
        await supabase.from("alerts").upsert(
          {
            user_id: userId,
            deadline_id: deadline.id,
            alert_type: "deadline",
            message: `"${deadline.title}" is due in ${noticeDay} day${noticeDay > 1 ? "s" : ""}.`,
            days_before: noticeDay,
          },
          { onConflict: "deadline_id,days_before" }
        );
      }
    }
  }
}

export async function checkDeadlineAlertsForAllUsers() {
  const supabase = await createServiceClient();
  const { data: profiles } = await supabase.from("profiles").select("id");
  for (const profile of profiles ?? []) {
    await checkDeadlineAlerts(profile.id);
  }
}
