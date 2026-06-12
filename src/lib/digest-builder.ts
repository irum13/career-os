import { createServiceClient } from "@/lib/supabase/server";
import { summarizeTrending } from "@/lib/gemini";
import { getDigestWindow, daysUntil, isStaleJob } from "@/lib/digest";
import type { DigestType, Item, Profile } from "@/lib/types";

export async function buildDigestForUser(userId: string, type: DigestType) {
  const supabase = await createServiceClient();
  const { periodStart, periodEnd, label } = getDigestWindow(type);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  const { data: periodItems } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .gte("received_at", periodStart.toISOString())
    .lte("received_at", periodEnd.toISOString())
    .neq("priority", "dismissed")
    .order("received_at", { ascending: false });

  const { data: reviewQueue } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .eq("priority", "unclassified")
    .in("folder", ["promotions", "junk"])
    .order("received_at", { ascending: false })
    .limit(10);

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("user_id", userId)
    .gte("due_date", new Date().toISOString().split("T")[0])
    .order("due_date")
    .limit(10);

  const { data: jobs } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "interested");

  const newsItems = (periodItems ?? []).filter(
    (i: Item) => i.category === "ai_news" || i.category === "newsletter"
  );
  const trending = await summarizeTrending(newsItems, profile as Profile | null);

  const highlights = (periodItems ?? []).slice(0, 5).map((i: Item) => ({
    id: i.id,
    title: i.title,
    sender: i.sender,
    category: i.category,
  }));

  const todayDeadlines = (deadlines ?? [])
    .filter((d) => daysUntil(d.due_date) <= 7)
    .map((d) => ({
      title: d.title,
      due_date: d.due_date,
      days_until: daysUntil(d.due_date),
    }));

  const staleJobs = (jobs ?? [])
    .filter((j) => isStaleJob(j.updated_at))
    .map((j) => ({ company: j.company, role: j.role }));

  const content = {
    label,
    new_mail_count: periodItems?.length ?? 0,
    highlights,
    review_queue: (reviewQueue ?? []).map((i: Item) => ({
      id: i.id,
      title: i.title,
      sender: i.sender,
      folder: i.folder,
    })),
    deadlines: todayDeadlines,
    stale_jobs: staleJobs,
  };

  const { data: digest } = await supabase
    .from("digests")
    .upsert(
      {
        user_id: userId,
        digest_type: type,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        trending_summary: trending,
        content_json: content,
      },
      { onConflict: "user_id,digest_type,period_start" }
    )
    .select()
    .single();

  return digest;
}

export async function buildDigestsForAllUsers(type: DigestType) {
  const supabase = await createServiceClient();
  const { data: profiles } = await supabase.from("profiles").select("id");
  const results = [];

  for (const profile of profiles ?? []) {
    const digest = await buildDigestForUser(profile.id, type);
    results.push(digest);
  }

  return results;
}

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
