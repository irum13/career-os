import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { markAlertRead } from "@/app/actions";
import { formatDateTime } from "@/lib/utils";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <Header title="Notifications" subtitle="Deadline alerts — in-app only" />

      <div className="max-w-2xl">
        <h2 className="mb-4 text-lg font-medium text-slate-900">Deadline alerts</h2>
        {alerts && alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Card key={alert.id} className="!p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-800">{alert.message}</p>
                    <p className="text-xs text-[var(--muted)]">{formatDateTime(alert.created_at)}</p>
                  </div>
                  {!alert.read_at && (
                    <form action={markAlertRead.bind(null, alert.id)}>
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
          <EmptyState
            title="No alerts"
            description="Deadline shoutouts appear 7, 3, and 1 days before due dates."
          />
        )}
      </div>
    </div>
  );
}
