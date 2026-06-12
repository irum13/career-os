import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createActionRequest, updateActionStatus } from "@/app/actions";
import { FormField, SubmitButton } from "@/components/forms/SimpleForm";

export default async function ActionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: actions } = await supabase
    .from("action_requests")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header
        title="Actions"
        subtitle="Request drafts — nothing sends or submits without your approval"
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {actions && actions.length > 0 ? (
            actions.map((action) => (
              <Card key={action.id}>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">{action.title}</h3>
                  <Badge label={action.status} />
                </div>
                {action.request_text && (
                  <p className="text-sm text-[var(--muted)]">Request: {action.request_text}</p>
                )}
                {action.draft_content && (
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
                    {action.draft_content}
                  </pre>
                )}
                {action.status === "pending_approval" && (
                  <div className="mt-4 flex gap-2">
                    <form action={updateActionStatus.bind(null, action.id, "approved")}>
                      <button type="submit" className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700">
                        Approve
                      </button>
                    </form>
                    <form action={updateActionStatus.bind(null, action.id, "executed")}>
                      <button type="submit" className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm text-white hover:bg-[var(--accent-hover)]">
                        Mark executed (you sent it)
                      </button>
                    </form>
                    <form action={updateActionStatus.bind(null, action.id, "cancelled")}>
                      <button type="submit" className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm hover:bg-slate-50">
                        Cancel
                      </button>
                    </form>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <EmptyState
              title="No actions yet"
              description="Request a draft cover letter or application text. You review and send it yourself."
            />
          )}
        </div>

        <Card title="New action request">
          <form action={createActionRequest} className="space-y-3">
            <FormField label="Title" name="title" required placeholder="Draft for Company X" />
            <FormField
              label="What do you need?"
              name="request_text"
              type="textarea"
              required
              placeholder="Draft a cover letter for the data science intern role at..."
            />
            <p className="text-xs text-[var(--muted)]">
              AI will draft content for your review. You send or submit manually after approving.
            </p>
            <SubmitButton label="Generate draft" />
          </form>
        </Card>
      </div>
    </div>
  );
}
