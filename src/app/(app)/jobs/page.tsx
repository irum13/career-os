import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createJob } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: jobs } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div>
      <Header title="Jobs" subtitle="Applications, programs, fellowships, and externships" />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          {jobs && jobs.length > 0 ? (
            jobs.map((job) => (
              <Card key={job.id} className="!p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {job.company} — {job.role}
                    </h3>
                    {job.url && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent)] hover:underline">
                        View posting
                      </a>
                    )}
                    {job.notes && <p className="mt-2 text-sm text-slate-600">{job.notes}</p>}
                  </div>
                  <Badge label={job.status} />
                </div>
              </Card>
            ))
          ) : (
            <EmptyState title="No jobs yet" description="Add a job via Quick Capture or the form." />
          )}
        </div>

        <Card title="Add job">
          <form action={createJob} className="space-y-3">
            <FormField label="Company" name="company" required />
            <FormField label="Role" name="role" required />
            <FormField label="URL" name="url" type="url" />
            <FormField label="Application deadline" name="due_date" type="date" />
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select name="status" className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm" defaultValue="interested">
                <option value="interested">Interested</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <FormField label="Notes" name="notes" type="textarea" />
            <SubmitButton label="Add job" />
          </form>
        </Card>
      </div>
    </div>
  );
}
