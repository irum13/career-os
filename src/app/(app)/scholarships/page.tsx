import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createScholarship } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";

export default async function ScholarshipsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: scholarships } = await supabase
    .from("scholarships")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header title="Scholarships" subtitle="Track opportunities and application deadlines" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {scholarships && scholarships.length > 0 ? (
            scholarships.map((s) => (
              <Card key={s.id} className="!p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">{s.name}</h3>
                    {s.organization && <p className="text-sm text-[var(--muted)]">{s.organization}</p>}
                    {s.amount && <p className="text-sm text-slate-600">{s.amount}</p>}
                    {s.url && (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline">
                        View opportunity
                      </a>
                    )}
                  </div>
                  <Badge label={s.status} />
                </div>
              </Card>
            ))
          ) : (
            <EmptyState title="No scholarships yet" description="Add opportunities you're tracking." />
          )}
        </div>

        <Card title="Add scholarship">
          <form action={createScholarship} className="space-y-3">
            <FormField label="Name" name="name" required />
            <FormField label="Organization" name="organization" />
            <FormField label="Amount" name="amount" placeholder="e.g. $5,000" />
            <FormField label="URL" name="url" type="url" />
            <FormField label="Deadline" name="due_date" type="date" />
            <FormField label="Notes" name="notes" type="textarea" />
            <SubmitButton label="Add scholarship" />
          </form>
        </Card>
      </div>
    </div>
  );
}
