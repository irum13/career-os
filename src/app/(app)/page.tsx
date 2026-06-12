import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import { markDigestRead } from "@/app/actions";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: latestDigest } = await supabase
    .from("digests")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { count: unreadAlerts } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user!.id)
    .is("read_at", null);

  const { data: reviewQueue } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user!.id)
    .eq("priority", "unclassified")
    .in("folder", ["promotions", "junk"])
    .order("received_at", { ascending: false })
    .limit(5);

  const content = latestDigest?.content_json as Record<string, unknown> | undefined;
  const highlights = (content?.highlights as { title: string; sender: string | null; category: string }[]) ?? [];
  const deadlines = (content?.deadlines as { title: string; due_date: string; days_until: number }[]) ?? [];
  const staleJobs = (content?.stale_jobs as { company: string; role: string }[]) ?? [];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      <Header
        title={`${greeting()}${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        subtitle="Your Career OS dashboard — optimized for laptop"
        alertCount={unreadAlerts ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={latestDigest ? `Latest digest · ${latestDigest.digest_type === "am" ? "Noon" : latestDigest.digest_type}` : "No digest yet"}
            action={
              latestDigest && !latestDigest.read_at ? (
                <form action={markDigestRead.bind(null, latestDigest.id)}>
                  <button type="submit" className="text-xs text-[var(--accent)] hover:underline">
                    Mark read
                  </button>
                </form>
              ) : null
            }
          >
            {latestDigest ? (
              <div className="space-y-4">
                <p className="text-sm text-[var(--muted)]">
                  {formatDateTime(latestDigest.created_at)} · {(content?.new_mail_count as number) ?? 0} new items
                </p>
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Trending</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-800">
                    {latestDigest.trending_summary || "No trending summary yet."}
                  </p>
                </div>
                {highlights.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Worth a look</p>
                    <ul className="space-y-2">
                      {highlights.map((h, i) => (
                        <li key={i} className="flex items-center justify-between text-sm">
                          <span>{h.title}</span>
                          <Badge label={h.category} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {deadlines.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">Upcoming deadlines</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {deadlines.map((d, i) => (
                        <li key={i}>
                          {d.title} — {d.days_until === 0 ? "today" : `in ${d.days_until} days`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {staleJobs.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-amber-700">Stale applications</p>
                    <ul className="space-y-1 text-sm text-slate-600">
                      {staleJobs.map((j, i) => (
                        <li key={i}>
                          {j.company} — {j.role}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Connect Gmail and Outlook in Sources, then wait for the noon or evening digest.
                You can also trigger a manual sync from Settings.
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="Review queue"
            action={
              <Link href="/inbox?filter=review" className="text-xs text-[var(--accent)] hover:underline">
                View all
              </Link>
            }
          >
            {reviewQueue && reviewQueue.length > 0 ? (
              <ul className="space-y-3">
                {reviewQueue.map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="font-medium text-slate-800">{item.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.folder} · {item.sender}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-[var(--muted)]">No unclassified promotions or junk mail.</p>
            )}
          </Card>

          <Card
            title="Alerts"
            action={
              <Link href="/notifications" className="text-xs text-[var(--accent)] hover:underline">
                View all
              </Link>
            }
          >
            <p className="text-sm text-[var(--muted)]">
              {unreadAlerts ? `${unreadAlerts} unread deadline alerts` : "No unread alerts"}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
