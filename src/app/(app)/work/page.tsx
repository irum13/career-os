import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createDeadline } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";
import { formatDate } from "@/lib/utils";
import { daysUntil as calcDays } from "@/lib/digest";

export default async function WorkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: deadlines } = await supabase
    .from("deadlines")
    .select("*")
    .eq("user_id", user!.id)
    .in("entity_type", ["work", "other", null])
    .order("due_date");

  return (
    <div>
      <Header title="Coursework & TA" subtitle="Assignment and grading deadlines with advance notice" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {deadlines && deadlines.length > 0 ? (
            deadlines.map((d) => {
              const days = calcDays(d.due_date);
              return (
                <Card key={d.id} className="!p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{d.title}</h3>
                      <p className="text-sm text-[var(--muted)]">Due {formatDate(d.due_date)}</p>
                      {d.notes && <p className="mt-1 text-sm text-slate-600">{d.notes}</p>}
                    </div>
                    <span
                      className={`text-sm font-medium ${days <= 3 ? "text-red-600" : days <= 7 ? "text-amber-600" : "text-slate-500"}`}
                    >
                      {days === 0 ? "Today" : days < 0 ? "Past due" : `${days} days`}
                    </span>
                  </div>
                </Card>
              );
            })
          ) : (
            <EmptyState title="No deadlines" description="Add coursework or TA deadlines below." />
          )}
        </div>

        <Card title="Add deadline">
          <form action={createDeadline} className="space-y-3">
            <FormField label="Title" name="title" required placeholder="HW3, grade midterms, etc." />
            <FormField label="Due date" name="due_date" type="date" required />
            <FormField label="Notes" name="notes" type="textarea" />
            <p className="text-xs text-[var(--muted)]">Alerts at 7, 3, and 1 days before.</p>
            <SubmitButton label="Add deadline" />
          </form>
        </Card>
      </div>
    </div>
  );
}
