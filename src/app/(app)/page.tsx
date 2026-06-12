import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";

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

  const { data: latestBrief } = await supabase
    .from("news_briefs")
    .select("summary_text, generated_at")
    .eq("user_id", user!.id)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
        subtitle="Your Career OS dashboard"
        alertCount={unreadAlerts ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="AI news brief"
            action={
              <Link href="/news" className="text-xs text-[var(--accent)] hover:underline">
                Open News →
              </Link>
            }
          >
            {latestBrief ? (
              <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {latestBrief.summary_text}
              </p>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Add newsletter senders on the News page, sync mail, and get an AI summary with career
                project ideas.
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
