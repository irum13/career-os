import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { markDigestRead, markAlertRead } from "@/app/actions";
import { formatDateTime } from "@/lib/utils";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: digests } = await supabase
    .from("digests")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <Header title="Notifications" subtitle="Digests and deadline alerts — in-app only" />

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-lg font-medium text-slate-900">Digests</h2>
          {digests && digests.length > 0 ? (
            <div className="space-y-3">
              {digests.map((d) => (
                <Card key={d.id} className="!p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium capitalize text-slate-900">
                        {d.digest_type === "am" ? "Noon" : d.digest_type} digest
                      </p>
                      <p className="text-sm text-[var(--muted)]">{formatDateTime(d.created_at)}</p>
                      <p className="mt-2 text-sm text-slate-700">{d.trending_summary}</p>
                    </div>
                    {!d.read_at && (
                      <form action={markDigestRead.bind(null, d.id)}>
                        <button type="submit" className="text-xs text-[var(--accent)] hover:underline">
                          Mark read
                        </button>
                      </form>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No digests yet" description="Digests appear at noon and midnight (Houston time)." />
          )}
        </div>

        <div>
          <h2 className="mb-4 text-lg font-medium text-slate-900">Deadline alerts</h2>
          {alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((a) => (
                <Card key={a.id} className="!p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-800">{a.message}</p>
                      <p className="text-xs text-[var(--muted)]">{formatDateTime(a.created_at)}</p>
                    </div>
                    {!a.read_at && (
                      <form action={markAlertRead.bind(null, a.id)}>
                        <button type="submit" className="text-xs text-[var(--accent)] hover:underline">
                          Mark read
                        </button>
                      </form>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No alerts" description="Deadline shoutouts appear 7, 3, and 1 days before due dates." />
          )}
        </div>
      </div>
    </div>
  );
}
