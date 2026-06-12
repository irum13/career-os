import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createSubscription } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";
import { formatDate } from "@/lib/utils";

export default async function MoneyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user!.id)
    .order("renewal_date");

  return (
    <div>
      <Header title="Subscriptions" subtitle="Track renewals and expiry dates" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {subs && subs.length > 0 ? (
            subs.map((s) => (
              <Card key={s.id} className="!p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{s.name}</h3>
                    {s.amount && <p className="text-sm text-slate-600">${s.amount}/period</p>}
                    {s.renewal_date && (
                      <p className="text-sm text-[var(--muted)]">Renews {formatDate(s.renewal_date)}</p>
                    )}
                    {s.cancel_url && (
                      <a href={s.cancel_url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline">
                        Manage / cancel
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState title="No subscriptions" description="Add active subscriptions to track renewals." />
          )}
        </div>

        <Card title="Add subscription">
          <form action={createSubscription} className="space-y-3">
            <FormField label="Name" name="name" required />
            <FormField label="Amount" name="amount" type="number" placeholder="9.99" />
            <FormField label="Renewal date" name="renewal_date" type="date" />
            <FormField label="Cancel URL" name="cancel_url" type="url" />
            <SubmitButton label="Add subscription" />
          </form>
        </Card>
      </div>
    </div>
  );
}
